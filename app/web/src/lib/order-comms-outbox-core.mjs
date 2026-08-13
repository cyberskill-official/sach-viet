import { randomBytes } from "node:crypto";
import { beginImmediateWithRetry } from "./db.mjs";

/**
 * Durable queue for order communications (currently the paid-order confirmation).
 *
 * Owns the `order_comms_outbox` table so both the payment path (which enqueues inside the
 * same transaction that marks an order paid) and the dispatcher (which drains it) share one
 * schema definition. Deliberately dependency-free so it can be imported from commerce code
 * without pulling in the notification/email graph.
 */

export const ORDER_COMMS_KINDS = Object.freeze(["order.paid"]);
export const ORDER_COMMS_MAX_ATTEMPTS = 8;

const BASE_RETRY_DELAY_MS = 60_000;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;
const KIND_SET = new Set(ORDER_COMMS_KINDS);
const schemaReady = new WeakSet();

function identifier() {
  return randomBytes(16).toString("hex");
}

function assertKind(kind) {
  if (!KIND_SET.has(kind)) throw new Error("Unknown order comms kind.");
  return kind;
}

/** Exponential backoff for the nth attempt (1-based), capped so retries stay bounded. */
export function orderCommsRetryDelayMs(attempt) {
  const exponent = Math.max(0, attempt - 1);
  return Math.min(BASE_RETRY_DELAY_MS * 2 ** exponent, MAX_RETRY_DELAY_MS);
}

/** No-op: order_comms_outbox schema is applied by the initial migration. */
export function ensureOrderCommsOutboxSchema(store) {
  schemaReady.add(store);
}

/**
 * Records that an order needs confirmation comms. Safe to call on every webhook replay:
 * the unique (order_id, kind) index makes re-enqueue a no-op, so a delivered row is never
 * resurrected and a still-pending row keeps its attempt history.
 */
export async function enqueueOrderComms(store, orderId, { kind = "order.paid" } = {}) {
  if (typeof orderId !== "string" || orderId.trim() === "") throw new Error("Order ID is required.");
  assertKind(kind);
  ensureOrderCommsOutboxSchema(store);
  const timestamp = store.clock();
  const inserted = await store.db
    .prepare(
      `INSERT INTO order_comms_outbox
        (id, order_id, kind, status, attempts, available_at, last_error, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', 0, ?, NULL, ?, ?)
       ON CONFLICT DO NOTHING`,
    )
    .run(identifier(), orderId, kind, timestamp, timestamp, timestamp);
  return { enqueued: inserted.changes === 1, orderId, kind };
}

/**
 * Takes ownership of due entries by charging an attempt and pushing `available_at` forward
 * before any delivery work happens. A crash mid-dispatch therefore leaves the row `pending`
 * (retried after the backoff) rather than stuck in a `processing` limbo.
 */
export async function claimDueOrderComms(store, { orderId = null, limit = 10, owner = null } = {}) {
  ensureOrderCommsOutboxSchema(store);
  const now = store.clock();
  const leaseOwner = owner || randomBytes(8).toString("hex");
  const filters = ["status = 'pending'", "available_at <= ?", "(leased_until IS NULL OR leased_until < ?)"];
  const parameters = [now, now];
  if (orderId) {
    filters.push("order_id = ?");
    parameters.push(orderId);
  }
  await beginImmediateWithRetry(store.db);
  try {
    const candidates = await store.db
      .prepare(
        `SELECT id, order_id AS orderId, kind, attempts
         FROM order_comms_outbox
         WHERE ${filters.join(" AND ")}
         ORDER BY available_at ASC, created_at ASC
         LIMIT ?
         FOR UPDATE SKIP LOCKED`,
      )
      .all(...parameters, Math.max(1, Number(limit) || 1));

    const claimed = [];
    for (const candidate of candidates) {
      const attempt = candidate.attempts + 1;
      const nextAvailableAt = now + orderCommsRetryDelayMs(attempt);
      const leasedUntil = now + orderCommsRetryDelayMs(attempt);
      const updated = await store.db
        .prepare(
          `UPDATE order_comms_outbox
           SET attempts = attempts + 1, available_at = ?, leased_until = ?, lease_owner = ?, updated_at = ?
           WHERE id = ? AND status = 'pending'`,
        )
        .run(nextAvailableAt, leasedUntil, leaseOwner, now, candidate.id);
      if (updated.changes === 1) {
        claimed.push({ ...candidate, attempt, nextAvailableAt, leaseOwner });
      }
    }
    await store.db.exec("COMMIT");
    return claimed;
  } catch (error) {
    try {
      await store.db.exec("ROLLBACK");
    } catch {
      // ignore
    }
    throw error;
  }
}

export async function markOrderCommsDelivered(store, entryId) {
  const timestamp = store.clock();
  await store.db
    .prepare(
      "UPDATE order_comms_outbox SET status = 'delivered', last_error = NULL, leased_until = NULL, lease_owner = NULL, available_at = ?, updated_at = ? WHERE id = ?",
    )
    .run(timestamp, timestamp, entryId);
}

/** Leaves the entry pending for another attempt, or dead-letters it once attempts run out. */
export async function markOrderCommsFailed(store, entryId, reason) {
  const timestamp = store.clock();
  const row = await store.db.prepare("SELECT attempts FROM order_comms_outbox WHERE id = ?").get(entryId);
  const exhausted = Number(row?.attempts || 0) >= ORDER_COMMS_MAX_ATTEMPTS;
  await store.db
    .prepare("UPDATE order_comms_outbox SET status = ?, last_error = ?, leased_until = NULL, lease_owner = NULL, updated_at = ? WHERE id = ?")
    .run(exhausted ? "abandoned" : "pending", reason ? String(reason).slice(0, 500) : null, timestamp, entryId);
  return { status: exhausted ? "abandoned" : "pending" };
}

export async function markOrderCommsAbandoned(store, entryId, reason) {
  const timestamp = store.clock();
  await store.db
    .prepare("UPDATE order_comms_outbox SET status = 'abandoned', last_error = ?, leased_until = NULL, lease_owner = NULL, updated_at = ? WHERE id = ?")
    .run(reason ? String(reason).slice(0, 500) : null, timestamp, entryId);
}

export async function getOrderCommsEntry(store, orderId, { kind = "order.paid" } = {}) {
  ensureOrderCommsOutboxSchema(store);
  return await store.db
    .prepare(
      `SELECT id, order_id AS orderId, kind, status, attempts, available_at AS availableAt,
              last_error AS lastError, created_at AS createdAt, updated_at AS updatedAt
       FROM order_comms_outbox WHERE order_id = ? AND kind = ?`,
    )
    .get(orderId, kind);
}
