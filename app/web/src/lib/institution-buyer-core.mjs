import { randomBytes } from "node:crypto";
import { beginImmediateWithRetry, openDatabase, tableExists } from "./db.mjs";
import { normalizeRole } from "./access.mjs";
import { requireStoredObjectKey } from "./storage-core.mjs";
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

async function membership(store, userId) {
  return await store.db.prepare("SELECT organization_id AS organizationId FROM organization_members WHERE user_id = ?").get(userId) || null;
}

async function requireOrganizationForActor(store, user) {
  const role = institutionActor(user);
  if (role === "admin") return null;
  const row = await membership(store, user.id);
  if (!row) throw new Error("Institution membership is required.");
  return row.organizationId;
}

async function resolveOrganizationId(store, actor, inputOrganizationId) {
  const actorOrg = await requireOrganizationForActor(store, actor);
  if (actorOrg) {
    if (inputOrganizationId && inputOrganizationId !== actorOrg) {
      throw new Error("Budget access is denied.");
    }
    return actorOrg;
  }
  return required(inputOrganizationId, "Organization ID");
}

async function assertOpaqueStorageKey(store, storageKey) {
  return requireStoredObjectKey(store, required(storageKey, "Storage key"));
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

export async function createInstitutionBuyerStore({
  dbPath,
  clock = () => Date.now(),
  log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-015", ...fields })),
} = {}) {
  const db = await openDatabase(dbPath);
  return { db, clock, log, close: () => db.close() };
}

export async function upsertInstitutionBudget(store, actor, input) {
  institutionActor(actor);
  const organizationId = await resolveOrganizationId(store, actor, input?.organizationId);
  if (!await store.db.prepare("SELECT 1 FROM organizations WHERE id = ?").get(organizationId)) {
    throw new Error("Organization does not exist.");
  }
  const amountUsd = normalizeMoney(input?.amountUsd);
  const updatedAt = store.clock();
  await store.db.prepare(`
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
  return await getInstitutionBudget(store, actor, { organizationId });
}

export async function getInstitutionBudget(store, actor, input = {}) {
  institutionActor(actor);
  const organizationId = await resolveOrganizationId(store, actor, input?.organizationId);
  const row = await store.db.prepare(`
    SELECT organization_id AS organizationId, amount_usd AS amountUsd, currency,
           updated_by AS updatedBy, updated_at AS updatedAt
    FROM institution_budgets WHERE organization_id = ?
  `).get(organizationId);
  if (!row) throw new Error("Budget does not exist.");
  return publicBudget(row);
}

export async function submitInstitutionPurchaseOrder(store, actor, input) {
  institutionActor(actor);
  const orderId = required(input?.orderId, "Order ID");
  const referenceNumber = required(input?.referenceNumber, "Reference number");
  const order = await store.db.prepare(`
    SELECT id, organization_id AS organizationId, status
    FROM b2b_orders WHERE id = ?
  `).get(orderId);
  if (!order) throw new Error("Order does not exist.");
  const actorOrg = await requireOrganizationForActor(store, actor);
  if (actorOrg && actorOrg !== order.organizationId) throw new Error("Order access is denied.");
  if (order.status !== "awaiting_po") throw new Error("Purchase orders can only be submitted for awaiting_po orders.");
  const storageKey = await assertOpaqueStorageKey(store, required(input?.storageKey, "Storage key"));

  const artifactId = id();
  const createdAt = store.clock();
  await beginImmediateWithRetry(store.db);
  try {
    await store.db.prepare(`
      INSERT INTO b2b_artifacts (id, order_id, kind, reference_number, storage_key, created_by, created_at)
      VALUES (?, ?, 'purchase_order', ?, ?, ?, ?)
    `).run(artifactId, orderId, referenceNumber, storageKey, actor.id, createdAt);
    await store.db.prepare("UPDATE b2b_orders SET updated_at = ? WHERE id = ?").run(createdAt, orderId);
    await store.db.exec("COMMIT");
  } catch (error) {
    await store.db.exec("ROLLBACK");
    throw error;
  }

  const status = (await store.db.prepare("SELECT status FROM b2b_orders WHERE id = ?").get(orderId)).status;
  store.log("institution_purchase_order_submitted", {
    result: "accepted",
    order_id: orderId,
    artifact_id: artifactId,
  });

  const artifacts = await store.db.prepare(`
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

export async function registerInstitutionMarcRecord(store, actor, input) {
  staffActor(actor);
  const productId = required(input?.productId, "Product ID");
  if (await tableExists(store.db, "products")) {
    if (!await store.db.prepare("SELECT 1 FROM products WHERE id = ? LIMIT 1").get(productId)) {
      throw new Error("Product does not exist.");
    }
  }
  const storageKey = await assertOpaqueStorageKey(store, required(input?.storageKey, "Storage key"));
  const updatedAt = store.clock();
  await store.db.prepare(`
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

async function entitledProductIds(store, organizationId) {
  if (organizationId) {
    return (await store.db.prepare(`
      SELECT DISTINCT items.product_id AS productId
      FROM b2b_order_items items
      JOIN b2b_orders orders ON orders.id = items.order_id
      WHERE orders.organization_id = ? AND orders.status = 'confirmed'
      ORDER BY items.product_id ASC
    `).all(organizationId)).map((row) => row.productId);
  }
  return (await store.db.prepare(`
    SELECT DISTINCT items.product_id AS productId
    FROM b2b_order_items items
    JOIN b2b_orders orders ON orders.id = items.order_id
    WHERE orders.status = 'confirmed'
    ORDER BY items.product_id ASC
  `).all()).map((row) => row.productId);
}

export async function listInstitutionMarcRecords(store, actor) {
  institutionActor(actor);
  const actorOrg = await requireOrganizationForActor(store, actor);
  const productIds = await entitledProductIds(store, actorOrg);
  if (productIds.length === 0) return [];
  const placeholders = productIds.map(() => "?").join(", ");
  const rows = await store.db.prepare(`
    SELECT product_id AS productId, updated_at AS updatedAt
    FROM institution_marc_records
    WHERE product_id IN (${placeholders})
    ORDER BY product_id ASC
  `).all(...productIds);
  return rows.map(publicMarcListItem);
}

export async function getInstitutionMarcRecord(store, actor, productIdInput) {
  institutionActor(actor);
  const productId = required(productIdInput, "Product ID");
  const actorOrg = await requireOrganizationForActor(store, actor);
  const entitled = new Set(await entitledProductIds(store, actorOrg));
  if (!entitled.has(productId)) throw new Error("MARC access is denied.");
  const row = await store.db.prepare(`
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
