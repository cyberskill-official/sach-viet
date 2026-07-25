import { randomBytes } from "node:crypto";

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

export function ensureOrderCommsOutboxSchema(store) {
  if (schemaReady.has(store)) return;
  store.db.exec(`
    CREATE TABLE IF NOT EXISTS order_comms_outbox (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('order.paid')),
      status TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'abandoned')),
      attempts INTEGER NOT NULL CHECK (attempts >= 0),
      available_at INTEGER NOT NULL,
      last_error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    ) STRICT;
    CREATE UNIQUE INDEX IF NOT EXISTS order_comms_outbox_order_kind_uq
      ON order_comms_outbox(order_id, kind);
    CREATE INDEX IF NOT EXISTS order_comms_outbox_ready_idx
      ON order_comms_outbox(status, available_at);
  `);
  schemaReady.add(store);
}

/**
 * Records that an order needs confirmation comms. Safe to call on every webhook replay:
 * the unique (order_id, kind) index makes re-enqueue a no-op, so a delivered row is never
 * resurrected and a still-pending row keeps its attempt history.
 */
export function enqueueOrderComms(store, orderId, { kind = "order.paid" } = {}) {
  if (typeof orderId !== "string" || orderId.trim() === "") throw new Error("Order ID is required.");
  assertKind(kind);
  ensureOrderCommsOutboxSchema(store);
  const timestamp = store.clock();
  const inserted = store.db
    .prepare(
      `INSERT OR IGNORE INTO order_comms_outbox
        (id, order_id, kind, status, attempts, available_at, last_error, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', 0, ?, NULL, ?, ?)`,
    )
    .run(identifier(), orderId, kind, timestamp, timestamp, timestamp);
  return { enqueued: inserted.changes === 1, orderId, kind };
}

/**
 * Takes ownership of due entries by charging an attempt and pushing `available_at` forward
 * before any delivery work happens. A crash mid-dispatch therefore leaves the row `pending`
 * (retried after the backoff) rather than stuck in a `processing` limbo.
 */
export function claimDueOrderComms(store, { orderId = null, limit = 10 } = {}) {
  ensureOrderCommsOutboxSchema(store);
  const now = store.clock();
  const filters = ["status = 'pending'", "available_at <= ?"];
  const parameters = [now];
  if (orderId) {
    filters.push("order_id = ?");
    parameters.push(orderId);
  }
  const candidates = store.db
    .prepare(
      `SELECT id, order_id AS orderId, kind, attempts
       FROM order_comms_outbox
       WHERE ${filters.join(" AND ")}
       ORDER BY available_at ASC, created_at ASC
       LIMIT ?`,
    )
    .all(...parameters, Math.max(1, Number(limit) || 1));

  const claim = store.db.prepare(
    `UPDATE order_comms_outbox
     SET attempts = attempts + 1, available_at = ?, updated_at = ?
     WHERE id = ? AND status = 'pending'`,
  );
  const claimed = [];
  for (const candidate of candidates) {
    const attempt = candidate.attempts + 1;
    const nextAvailableAt = now + orderCommsRetryDelayMs(attempt);
    if (claim.run(nextAvailableAt, now, candidate.id).changes === 1) {
      claimed.push({ ...candidate, attempt, nextAvailableAt });
    }
  }
  return claimed;
}

export function markOrderCommsDelivered(store, entryId) {
  const timestamp = store.clock();
  store.db
    .prepare(
      "UPDATE order_comms_outbox SET status = 'delivered', last_error = NULL, available_at = ?, updated_at = ? WHERE id = ?",
    )
    .run(timestamp, timestamp, entryId);
}

/** Leaves the entry pending for another attempt, or dead-letters it once attempts run out. */
export function markOrderCommsFailed(store, entryId, reason) {
  const timestamp = store.clock();
  const row = store.db.prepare("SELECT attempts FROM order_comms_outbox WHERE id = ?").get(entryId);
  const exhausted = Number(row?.attempts || 0) >= ORDER_COMMS_MAX_ATTEMPTS;
  store.db
    .prepare("UPDATE order_comms_outbox SET status = ?, last_error = ?, updated_at = ? WHERE id = ?")
    .run(exhausted ? "abandoned" : "pending", reason ? String(reason).slice(0, 500) : null, timestamp, entryId);
  return { status: exhausted ? "abandoned" : "pending" };
}

export function markOrderCommsAbandoned(store, entryId, reason) {
  const timestamp = store.clock();
  store.db
    .prepare("UPDATE order_comms_outbox SET status = 'abandoned', last_error = ?, updated_at = ? WHERE id = ?")
    .run(reason ? String(reason).slice(0, 500) : null, timestamp, entryId);
}

export function getOrderCommsEntry(store, orderId, { kind = "order.paid" } = {}) {
  ensureOrderCommsOutboxSchema(store);
  return store.db
    .prepare(
      `SELECT id, order_id AS orderId, kind, status, attempts, available_at AS availableAt,
              last_error AS lastError, created_at AS createdAt, updated_at AS updatedAt
       FROM order_comms_outbox WHERE order_id = ? AND kind = ?`,
    )
    .get(orderId, kind);
}
