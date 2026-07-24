import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { normalizeRole } from "./access.mjs";
import { normalizeMoney } from "./catalog-core.mjs";

const id = () => randomBytes(16).toString("hex");
const required = (value, name) => {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${name} is required.`);
  return value.trim();
};

function institutionActor(user) {
  if (!user?.id) throw new Error("Authentication is required.");
  const role = normalizeRole(user.role);
  if (role !== "school_librarian" && role !== "admin") throw new Error("Institution access is required.");
  return role;
}

function staffActor(user) {
  if (!user?.id) throw new Error("Authentication is required.");
  const role = normalizeRole(user.role);
  if (role !== "employee_b2b" && role !== "admin") throw new Error("B2B staff access is required.");
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

function resolveOrganizationId(store, actor, inputOrganizationId) {
  const actorOrg = requireOrganizationForActor(store, actor);
  if (actorOrg) {
    if (inputOrganizationId && inputOrganizationId !== actorOrg) {
      throw new Error("Budget access is denied.");
    }
    return actorOrg;
  }
  return required(inputOrganizationId, "Organization ID");
}

function assertOpaqueStorageKey(storageKey) {
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    throw new Error("Storage key must not be a public URL.");
  }
  return storageKey;
}

function publicBudget(row) {
  return {
    organizationId: row.organizationId,
    amountUsd: row.amountUsd,
    currency: row.currency,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt,
  };
}

function publicMarcListItem(row) {
  return {
    productId: row.productId,
    updatedAt: row.updatedAt,
  };
}

function publicMarcDetail(row) {
  return {
    productId: row.productId,
    storageKey: row.storageKey,
    updatedAt: row.updatedAt,
  };
}

export function createInstitutionBuyerStore({
  dbPath,
  clock = () => Date.now(),
  log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-015", ...fields })),
} = {}) {
  const path = dbPath || process.env.DATABASE_PATH || "/data/sachviet.sqlite";
  if (!existsSync(dirname(path))) mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS institution_budgets (
      organization_id TEXT PRIMARY KEY,
      amount_usd TEXT NOT NULL,
      currency TEXT NOT NULL CHECK (currency = 'USD'),
      updated_by TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS institution_marc_records (
      product_id TEXT PRIMARY KEY,
      storage_key TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    ) STRICT;
  `);
  return { db, clock, log, close: () => db.close() };
}

export function upsertInstitutionBudget(store, actor, input) {
  institutionActor(actor);
  const organizationId = resolveOrganizationId(store, actor, input?.organizationId);
  if (!store.db.prepare("SELECT 1 FROM organizations WHERE id = ?").get(organizationId)) {
    throw new Error("Organization does not exist.");
  }
  const amountUsd = normalizeMoney(input?.amountUsd);
  const updatedAt = store.clock();
  store.db.prepare(`
    INSERT INTO institution_budgets (organization_id, amount_usd, currency, updated_by, updated_at)
    VALUES (?, ?, 'USD', ?, ?)
    ON CONFLICT(organization_id) DO UPDATE SET
      amount_usd = excluded.amount_usd,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at
  `).run(organizationId, amountUsd, actor.id, updatedAt);
  store.log("institution_budget_upserted", {
    result: "accepted",
    organization_id: organizationId,
  });
  return getInstitutionBudget(store, actor, { organizationId });
}

export function getInstitutionBudget(store, actor, input = {}) {
  institutionActor(actor);
  const organizationId = resolveOrganizationId(store, actor, input?.organizationId);
  const row = store.db.prepare(`
    SELECT organization_id AS organizationId, amount_usd AS amountUsd, currency,
           updated_by AS updatedBy, updated_at AS updatedAt
    FROM institution_budgets WHERE organization_id = ?
  `).get(organizationId);
  if (!row) throw new Error("Budget does not exist.");
  return publicBudget(row);
}

export function submitInstitutionPurchaseOrder(store, actor, input) {
  institutionActor(actor);
  const orderId = required(input?.orderId, "Order ID");
  const referenceNumber = required(input?.referenceNumber, "Reference number");
  const storageKey = assertOpaqueStorageKey(required(input?.storageKey, "Storage key"));
  const order = store.db.prepare(`
    SELECT id, organization_id AS organizationId, status
    FROM b2b_orders WHERE id = ?
  `).get(orderId);
  if (!order) throw new Error("Order does not exist.");
  const actorOrg = requireOrganizationForActor(store, actor);
  if (actorOrg && actorOrg !== order.organizationId) throw new Error("Order access is denied.");
  if (order.status !== "awaiting_po") throw new Error("Purchase orders can only be submitted for awaiting_po orders.");

  const artifactId = id();
  const createdAt = store.clock();
  store.db.exec("BEGIN IMMEDIATE");
  try {
    store.db.prepare(`
      INSERT INTO b2b_artifacts (id, order_id, kind, reference_number, storage_key, created_by, created_at)
      VALUES (?, ?, 'purchase_order', ?, ?, ?, ?)
    `).run(artifactId, orderId, referenceNumber, storageKey, actor.id, createdAt);
    store.db.prepare("UPDATE b2b_orders SET updated_at = ? WHERE id = ?").run(createdAt, orderId);
    store.db.exec("COMMIT");
  } catch (error) {
    store.db.exec("ROLLBACK");
    throw error;
  }

  const status = store.db.prepare("SELECT status FROM b2b_orders WHERE id = ?").get(orderId).status;
  store.log("institution_purchase_order_submitted", {
    result: "accepted",
    order_id: orderId,
    artifact_id: artifactId,
  });

  const artifacts = store.db.prepare(`
    SELECT id, order_id AS orderId, kind, reference_number AS referenceNumber, created_at AS createdAt
    FROM b2b_artifacts WHERE order_id = ? ORDER BY created_at ASC, id ASC
  `).all(orderId);

  return {
    orderId,
    organizationId: order.organizationId,
    status,
    artifacts,
  };
}

export function registerInstitutionMarcRecord(store, actor, input) {
  staffActor(actor);
  const productId = required(input?.productId, "Product ID");
  const storageKey = assertOpaqueStorageKey(required(input?.storageKey, "Storage key"));
  if (store.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'products'").get()) {
    if (!store.db.prepare("SELECT 1 FROM products WHERE id = ? LIMIT 1").get(productId)) {
      throw new Error("Product does not exist.");
    }
  }
  const updatedAt = store.clock();
  store.db.prepare(`
    INSERT INTO institution_marc_records (product_id, storage_key, updated_by, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(product_id) DO UPDATE SET
      storage_key = excluded.storage_key,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at
  `).run(productId, storageKey, actor.id, updatedAt);
  store.log("institution_marc_registered", {
    result: "accepted",
    product_id: productId,
  });
  return publicMarcDetail({ productId, storageKey, updatedAt });
}

function entitledProductIds(store, organizationId) {
  if (organizationId) {
    return store.db.prepare(`
      SELECT DISTINCT items.product_id AS productId
      FROM b2b_order_items items
      JOIN b2b_orders orders ON orders.id = items.order_id
      WHERE orders.organization_id = ? AND orders.status = 'confirmed'
      ORDER BY items.product_id ASC
    `).all(organizationId).map((row) => row.productId);
  }
  return store.db.prepare(`
    SELECT DISTINCT items.product_id AS productId
    FROM b2b_order_items items
    JOIN b2b_orders orders ON orders.id = items.order_id
    WHERE orders.status = 'confirmed'
    ORDER BY items.product_id ASC
  `).all().map((row) => row.productId);
}

export function listInstitutionMarcRecords(store, actor) {
  institutionActor(actor);
  const actorOrg = requireOrganizationForActor(store, actor);
  const productIds = entitledProductIds(store, actorOrg);
  if (productIds.length === 0) return [];
  const placeholders = productIds.map(() => "?").join(", ");
  const rows = store.db.prepare(`
    SELECT product_id AS productId, updated_at AS updatedAt
    FROM institution_marc_records
    WHERE product_id IN (${placeholders})
    ORDER BY product_id ASC
  `).all(...productIds);
  return rows.map(publicMarcListItem);
}

export function getInstitutionMarcRecord(store, actor, productIdInput) {
  institutionActor(actor);
  const productId = required(productIdInput, "Product ID");
  const actorOrg = requireOrganizationForActor(store, actor);
  const entitled = new Set(entitledProductIds(store, actorOrg));
  if (!entitled.has(productId)) throw new Error("MARC access is denied.");
  const row = store.db.prepare(`
    SELECT product_id AS productId, storage_key AS storageKey, updated_at AS updatedAt
    FROM institution_marc_records WHERE product_id = ?
  `).get(productId);
  if (!row) throw new Error("MARC record does not exist.");
  store.log("institution_marc_fetched", {
    result: "accepted",
    product_id: productId,
  });
  return publicMarcDetail(row);
}
