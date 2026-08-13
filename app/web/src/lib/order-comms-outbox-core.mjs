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

export const ORDER_COMMS_KINDS = Object.freeze(["order.paid", "identity.verify", "identity.reset"]);
export const IDENTITY_COMMS_KINDS = Object.freeze(["identity.verify", "identity.reset"]);
export const ORDER_COMMS_MAX_ATTEMPTS = 8;

const BASE_RETRY_DELAY_MS = 60_000;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;
const KIND_SET = new Set(ORDER_COMMS_KINDS);
const schemaReady = new WeakSet();

function identifier() {
  return randomBytes(16).toString("hex");
}

function storeNow(store) {
  if (typeof store.clock === "function") return store.clock();
  if (typeof store.now === "function") return store.now();
  return Date.now();
}

function serializePayload(payload) {
  if (payload == null) return null;
  if (typeof payload === "string") return payload;
  return JSON.stringify(payload);
}

function parsePayload(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
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
export async function enqueueOrderComms(store, orderId, { kind = "order.paid", payload = null } = {}) {
  if (typeof orderId !== "string" || orderId.trim() === "") throw new Error("Order ID is required.");
  assertKind(kind);
  ensureOrderCommsOutboxSchema(store);
  const timestamp = storeNow(store);
  const inserted = await store.db
    .prepare(
      `INSERT INTO order_comms_outbox
        (id, order_id, kind, status, attempts, available_at, last_error, created_at, updated_at, payload)
       VALUES (?, ?, ?, 'pending', 0, ?, NULL, ?, ?, ?)
       ON CONFLICT DO NOTHING`,
    )
    .run(identifier(), orderId, kind, timestamp, timestamp, timestamp, serializePayload(payload));
  return { enqueued: inserted.changes === 1, orderId, kind };
}

/**
 * Enqueue identity.verify / identity.reset against the leased outbox.
 * `order_id` stores the user id. Re-request upserts payload and re-queues
 * (password reset must send the latest token).
 */
export async function enqueueIdentityComms(store, userId, { kind, payload } = {}) {
  if (typeof userId !== "string" || userId.trim() === "") throw new Error("User ID is required.");
  if (!IDENTITY_COMMS_KINDS.includes(kind)) throw new Error("Unknown identity comms kind.");
  ensureOrderCommsOutboxSchema(store);
  const timestamp = storeNow(store);
  const serialized = serializePayload(payload);
  const inserted = await store.db
    .prepare(
      `INSERT INTO order_comms_outbox
        (id, order_id, kind, status, attempts, available_at, last_error, created_at, updated_at, payload)
       VALUES (?, ?, ?, 'pending', 0, ?, NULL, ?, ?, ?)
       ON CONFLICT (order_id, kind) DO UPDATE SET
         status = 'pending',
         attempts = 0,
         available_at = excluded.available_at,
         last_error = NULL,
         leased_until = NULL,
         lease_owner = NULL,
         payload = excluded.payload,
         updated_at = excluded.updated_at`,
    )
    .run(identifier(), userId, kind, timestamp, timestamp, timestamp, serialized);
  return { enqueued: inserted.changes >= 1, orderId: userId, kind };
}

/**
 * Takes ownership of due entries by charging an attempt and pushing `available_at` forward
 * before any delivery work happens. A crash mid-dispatch therefore leaves the row `pending`
 * (retried after the backoff) rather than stuck in a `processing` limbo.
 */
export async function claimDueOrderComms(store, { orderId = null, limit = 10, owner = null } = {}) {
  ensureOrderCommsOutboxSchema(store);
  const now = storeNow(store);
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
        `SELECT id, order_id AS orderId, kind, attempts, payload
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
        claimed.push({
          ...candidate,
          payload: parsePayload(candidate.payload),
          attempt,
          nextAvailableAt,
          leaseOwner,
        });
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
  const timestamp = storeNow(store);
  await store.db
    .prepare(
      "UPDATE order_comms_outbox SET status = 'delivered', last_error = NULL, leased_until = NULL, lease_owner = NULL, available_at = ?, updated_at = ? WHERE id = ?",
    )
    .run(timestamp, timestamp, entryId);
}

/** Leaves the entry pending for another attempt, or dead-letters it once attempts run out. */
export async function markOrderCommsFailed(store, entryId, reason) {
  const timestamp = storeNow(store);
  const row = await store.db.prepare("SELECT attempts FROM order_comms_outbox WHERE id = ?").get(entryId);
  const exhausted = Number(row?.attempts || 0) >= ORDER_COMMS_MAX_ATTEMPTS;
  await store.db
    .prepare("UPDATE order_comms_outbox SET status = ?, last_error = ?, leased_until = NULL, lease_owner = NULL, updated_at = ? WHERE id = ?")
    .run(exhausted ? "abandoned" : "pending", reason ? String(reason).slice(0, 500) : null, timestamp, entryId);
  return { status: exhausted ? "abandoned" : "pending" };
}

export async function markOrderCommsAbandoned(store, entryId, reason) {
  const timestamp = storeNow(store);
  await store.db
    .prepare("UPDATE order_comms_outbox SET status = 'abandoned', last_error = ?, leased_until = NULL, lease_owner = NULL, updated_at = ? WHERE id = ?")
    .run(reason ? String(reason).slice(0, 500) : null, timestamp, entryId);
}

export async function getOrderCommsEntry(store, orderId, { kind = "order.paid" } = {}) {
  ensureOrderCommsOutboxSchema(store);
  const row = await store.db
    .prepare(
      `SELECT id, order_id AS orderId, kind, status, attempts, available_at AS availableAt,
              last_error AS lastError, created_at AS createdAt, updated_at AS updatedAt, payload
       FROM order_comms_outbox WHERE order_id = ? AND kind = ?`,
    )
    .get(orderId, kind);
  if (!row) return row;
  return { ...row, payload: parsePayload(row.payload) };
}
