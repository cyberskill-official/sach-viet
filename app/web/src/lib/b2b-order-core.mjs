import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { normalizeRole } from "./access.mjs";

const ORDER_STATUSES = Object.freeze(["awaiting_po", "confirmed", "cancelled"]);
const ARTIFACT_KINDS = Object.freeze(["contract", "purchase_order"]);
const TRANSITIONS = Object.freeze({
  awaiting_po: ["confirmed", "cancelled"],
  confirmed: [],
  cancelled: [],
});

const id = () => randomBytes(16).toString("hex");
const required = (value, name) => {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${name} is required.`);
  return value.trim();
};

function moneyUnits(value) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0"));
}

function moneyString(value) {
  return `${value / 10000n}.${String(value % 10000n).padStart(4, "0")}`;
}

function staffActor(user) {
  if (!user?.id) throw new Error("Authentication is required.");
  const role = normalizeRole(user.role);
  if (role !== "employee_b2b" && role !== "admin") throw new Error("B2B staff access is required.");
  return role;
}

function institutionActor(user) {
  if (!user?.id) throw new Error("Authentication is required.");
  const role = normalizeRole(user.role);
  if (role !== "school_librarian" && role !== "admin") throw new Error("Institution access is required.");
  return role;
}

function membership(store, userId) {
  return store.db.prepare("SELECT organization_id AS organizationId FROM organization_members WHERE user_id = ?").get(userId) || null;
}

function requireOrganizationForActor(store, user) {
  const role = institutionActor(user);
  if (role === "admin") return null;
  const row = membership(store, user.id);
  if (!row) throw new Error("Institution membership is required.");
  return row.organizationId;
}

function orderRow(store, orderId) {
  return store.db.prepare(`
    SELECT id, quote_id AS quoteId, organization_id AS organizationId, status, currency,
           subtotal_usd AS subtotalUsd, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt
    FROM b2b_orders WHERE id = ?
  `).get(orderId);
}

function orderItems(store, orderId) {
  return store.db.prepare(`
    SELECT id, order_id AS orderId, product_id AS productId, quantity, unit_price_usd AS unitPriceUsd
    FROM b2b_order_items WHERE order_id = ? ORDER BY id ASC
  `).all(orderId);
}

function artifacts(store, orderId, { includeStorageKey }) {
  const rows = store.db.prepare(`
    SELECT id, order_id AS orderId, kind, reference_number AS referenceNumber, storage_key AS storageKey,
           created_by AS createdBy, created_at AS createdAt
    FROM b2b_artifacts WHERE order_id = ? ORDER BY created_at ASC, id ASC
  `).all(orderId);
  return rows.map((row) => {
    const artifact = {
      id: row.id,
      orderId: row.orderId,
      kind: row.kind,
      referenceNumber: row.referenceNumber,
      createdAt: row.createdAt,
    };
    if (includeStorageKey) {
      artifact.storageKey = row.storageKey;
      artifact.createdBy = row.createdBy;
    }
    return artifact;
  });
}

function publicOrder(store, order, { blind, includeStorageKey }) {
  const payload = {
    id: order.id,
    quoteId: order.quoteId,
    organizationId: order.organizationId,
    status: order.status,
    currency: order.currency,
    subtotalUsd: order.subtotalUsd,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: orderItems(store, order.id),
    artifacts: artifacts(store, order.id, { includeStorageKey: Boolean(includeStorageKey) }),
  };
  if (!blind) payload.createdBy = order.createdBy;
  return payload;
}

export function createB2bOrderStore({
  dbPath,
  clock = () => Date.now(),
  log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-014", ...fields })),
} = {}) {
  const path = dbPath || process.env.DATABASE_PATH || "/data/sachviet.sqlite";
  if (!existsSync(dirname(path))) mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS b2b_orders (
      id TEXT PRIMARY KEY,
      quote_id TEXT NOT NULL UNIQUE,
      organization_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('awaiting_po', 'confirmed', 'cancelled')),
      currency TEXT NOT NULL CHECK (currency = 'USD'),
      subtotal_usd TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS b2b_order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity >= 1),
      unit_price_usd TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES b2b_orders(id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS b2b_artifacts (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('contract', 'purchase_order')),
      reference_number TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES b2b_orders(id)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS b2b_orders_org_idx ON b2b_orders(organization_id, updated_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS b2b_orders_status_idx ON b2b_orders(status, updated_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS b2b_artifacts_order_idx ON b2b_artifacts(order_id, kind, created_at ASC);
  `);
  return { db, clock, log, close: () => db.close() };
}

export function convertWonQuoteToOrder(store, actor, input) {
  staffActor(actor);
  const quoteId = required(input?.quoteId, "Quote ID");
  const quote = store.db.prepare(`
    SELECT id, organization_id AS organizationId, status
    FROM b2b_quotes WHERE id = ?
  `).get(quoteId);
  if (!quote) throw new Error("Quote does not exist.");
  if (quote.status !== "won") throw new Error("Only won quotes can be converted to orders.");
  const existing = store.db.prepare("SELECT id FROM b2b_orders WHERE quote_id = ?").get(quoteId);
  if (existing) throw new Error("Quote already has an order.");
  const items = store.db.prepare(`
    SELECT id, product_id AS productId, quantity, unit_price_usd AS unitPriceUsd
    FROM b2b_quote_items WHERE quote_id = ? ORDER BY id ASC
  `).all(quoteId);
  if (items.length === 0) throw new Error("Quote must contain at least one item.");
  if (items.some((item) => typeof item.unitPriceUsd !== "string" || item.unitPriceUsd.trim() === "")) {
    throw new Error("Every quote line must have a unit price before conversion.");
  }

  let subtotal = 0n;
  for (const item of items) subtotal += moneyUnits(item.unitPriceUsd) * BigInt(item.quantity);

  const now = store.clock();
  const order = {
    id: id(),
    quoteId,
    organizationId: quote.organizationId,
    status: "awaiting_po",
    currency: "USD",
    subtotalUsd: moneyString(subtotal),
    createdBy: actor.id,
    createdAt: now,
    updatedAt: now,
  };

  store.db.exec("BEGIN IMMEDIATE");
  try {
    store.db.prepare(`
      INSERT INTO b2b_orders (id, quote_id, organization_id, status, currency, subtotal_usd, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(order.id, order.quoteId, order.organizationId, order.status, order.currency, order.subtotalUsd, order.createdBy, order.createdAt, order.updatedAt);
    const insertItem = store.db.prepare(`
      INSERT INTO b2b_order_items (id, order_id, product_id, quantity, unit_price_usd)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const item of items) insertItem.run(id(), order.id, item.productId, item.quantity, item.unitPriceUsd);
    store.db.exec("COMMIT");
  } catch (error) {
    store.db.exec("ROLLBACK");
    throw error;
  }

  store.log("b2b_order_converted", { result: "accepted", order_id: order.id, quote_id: quoteId, organization_id: order.organizationId });
  return publicOrder(store, order, { blind: false, includeStorageKey: true });
}

export function attachArtifact(store, actor, input) {
  staffActor(actor);
  const orderId = required(input?.orderId, "Order ID");
  const order = orderRow(store, orderId);
  if (!order) throw new Error("Order does not exist.");
  if (order.status === "cancelled") throw new Error("Cannot attach artifacts to a cancelled order.");
  const kind = required(input?.kind, "Artifact kind");
  if (!ARTIFACT_KINDS.includes(kind)) throw new Error("Artifact kind is invalid.");
  const referenceNumber = required(input?.referenceNumber, "Reference number");
  const storageKey = required(input?.storageKey, "Storage key");
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    throw new Error("Artifact storage key must not be a public URL.");
  }
  const artifact = {
    id: id(),
    orderId,
    kind,
    referenceNumber,
    storageKey,
    createdBy: actor.id,
    createdAt: store.clock(),
  };
  store.db.prepare(`
    INSERT INTO b2b_artifacts (id, order_id, kind, reference_number, storage_key, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(artifact.id, artifact.orderId, artifact.kind, artifact.referenceNumber, artifact.storageKey, artifact.createdBy, artifact.createdAt);
  store.db.prepare("UPDATE b2b_orders SET updated_at = ? WHERE id = ?").run(artifact.createdAt, orderId);
  store.log("b2b_artifact_attached", { result: "accepted", order_id: orderId, artifact_id: artifact.id, kind });
  return publicOrder(store, orderRow(store, orderId), { blind: false, includeStorageKey: true });
}

export function transitionOrderStatus(store, actor, input) {
  staffActor(actor);
  const orderId = required(input?.orderId, "Order ID");
  const nextStatus = required(input?.status, "Status");
  if (!ORDER_STATUSES.includes(nextStatus)) throw new Error("Order status is invalid.");
  const order = orderRow(store, orderId);
  if (!order) throw new Error("Order does not exist.");
  const allowed = TRANSITIONS[order.status] || [];
  if (!allowed.includes(nextStatus)) throw new Error(`Cannot transition order from ${order.status} to ${nextStatus}.`);
  if (nextStatus === "confirmed") {
    const po = store.db.prepare("SELECT 1 FROM b2b_artifacts WHERE order_id = ? AND kind = 'purchase_order' LIMIT 1").get(orderId);
    if (!po) throw new Error("A purchase_order artifact is required before confirmation.");
  }
  const updatedAt = store.clock();
  store.db.prepare("UPDATE b2b_orders SET status = ?, updated_at = ? WHERE id = ?").run(nextStatus, updatedAt, orderId);
  store.log("b2b_order_status_changed", { result: "accepted", order_id: orderId, from_status: order.status, to_status: nextStatus });
  return publicOrder(store, { ...order, status: nextStatus, updatedAt }, { blind: false, includeStorageKey: true });
}

export function listStaffOrders(store, actor) {
  staffActor(actor);
  const rows = store.db.prepare(`
    SELECT id, quote_id AS quoteId, organization_id AS organizationId, status, currency,
           subtotal_usd AS subtotalUsd, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt
    FROM b2b_orders ORDER BY updated_at DESC, id DESC
  `).all();
  return rows.map((row) => publicOrder(store, row, { blind: false, includeStorageKey: true }));
}

export function getStaffOrder(store, actor, orderId) {
  staffActor(actor);
  const order = orderRow(store, required(orderId, "Order ID"));
  if (!order) throw new Error("Order does not exist.");
  return publicOrder(store, order, { blind: false, includeStorageKey: true });
}

export function listInstitutionOrders(store, actor) {
  institutionActor(actor);
  const actorOrg = requireOrganizationForActor(store, actor);
  const rows = actorOrg
    ? store.db.prepare(`
        SELECT id, quote_id AS quoteId, organization_id AS organizationId, status, currency,
               subtotal_usd AS subtotalUsd, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt
        FROM b2b_orders WHERE organization_id = ? ORDER BY updated_at DESC, id DESC
      `).all(actorOrg)
    : store.db.prepare(`
        SELECT id, quote_id AS quoteId, organization_id AS organizationId, status, currency,
               subtotal_usd AS subtotalUsd, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt
        FROM b2b_orders ORDER BY updated_at DESC, id DESC
      `).all();
  return rows.map((row) => publicOrder(store, row, { blind: true, includeStorageKey: false }));
}

export function getInstitutionOrder(store, actor, orderId) {
  institutionActor(actor);
  const order = orderRow(store, required(orderId, "Order ID"));
  if (!order) throw new Error("Order does not exist.");
  const actorOrg = requireOrganizationForActor(store, actor);
  if (actorOrg && actorOrg !== order.organizationId) throw new Error("Order access is denied.");
  return publicOrder(store, order, { blind: true, includeStorageKey: false });
}

export const B2B_ORDER_STATUSES = ORDER_STATUSES;
export const B2B_ARTIFACT_KINDS = ARTIFACT_KINDS;
