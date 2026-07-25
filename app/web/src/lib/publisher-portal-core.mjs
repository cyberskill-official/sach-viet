import { randomBytes } from "node:crypto";
import { openSqliteDatabase } from "./sqlite.mjs";
import { normalizeRole } from "./access.mjs";

const identifier = () => randomBytes(16).toString("hex");
const required = (value, label) => {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`);
  return value.trim();
};

/** Decision-register areas from TASK-REBUILD-016. All unresolved until owner acceptance. */
export const ROYALTY_DECISION_REGISTER = Object.freeze([
  "royalty_eligibility",
  "rate_and_split",
  "sales_basis_and_allocation",
  "recoupment_and_advances",
  "reporting_period_and_currency",
  "tax_and_withholding",
  "payout_and_payment_authority",
  "contract_attribution_and_visibility",
]);

function publisherActor(user) {
  if (!user?.id) throw new Error("Authentication is required.");
  const role = normalizeRole(user.role);
  if (role !== "publisher" && role !== "admin") throw new Error("Publisher access is required.");
  return role;
}

function resolvePublisherId(actor, requestedPublisherId) {
  const role = publisherActor(actor);
  if (role === "admin") {
    return requestedPublisherId ? required(requestedPublisherId, "Publisher ID") : actor.id;
  }
  if (requestedPublisherId && requestedPublisherId !== actor.id) {
    throw new Error("You cannot access another publisher's records.");
  }
  return actor.id;
}

function assertOpaqueStorageKey(storageKey) {
  const key = required(storageKey, "Storage key");
  if (key.startsWith("http://") || key.startsWith("https://")) {
    throw new Error("Storage key must not be a public URL.");
  }
  return key;
}

/**
 * Activation gate from TASK-REBUILD-016.
 * Financial behavior requires owner-accepted decision-register rows.
 * Without an accepted activation record, every financial path is refused.
 */
export function getRoyaltyActivationGate(store) {
  const accepted = store.db
    .prepare(
      `SELECT decision_area AS decisionArea, accepted_at AS acceptedAt, authority_source AS authoritySource
       FROM royalty_decision_acceptances
       ORDER BY decision_area ASC`,
    )
    .all();
  const acceptedAreas = new Set(accepted.map((row) => row.decisionArea));
  const unresolved = ROYALTY_DECISION_REGISTER.filter((area) => !acceptedAreas.has(area));
  return {
    status: unresolved.length === 0 && accepted.length > 0 ? "accepted" : "pending",
    unresolvedDecisionAreas: unresolved,
    acceptedDecisionAreas: accepted.map((row) => ({
      decisionArea: row.decisionArea,
      acceptedAt: row.acceptedAt,
      authoritySource: row.authoritySource,
    })),
    financialActivationAllowed: unresolved.length === 0 && accepted.length === ROYALTY_DECISION_REGISTER.length,
  };
}

export function assertRoyaltyActivationGate(store, actionLabel = "Financial publisher behavior") {
  const gate = getRoyaltyActivationGate(store);
  if (!gate.financialActivationAllowed) {
    throw new Error(
      `${actionLabel} is blocked until owner acceptance of royalty decision-register rows (activation gate pending).`,
    );
  }
  return gate;
}

function publicRequest(row) {
  return {
    id: row.id,
    publisherId: row.publisherId,
    title: row.title,
    notes: row.notes,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function publicMarcListItem(row) {
  return {
    productId: row.productId,
    publisherId: row.publisherId,
    updatedAt: row.updatedAt,
  };
}

export function createPublisherPortalStore({
  dbPath,
  clock = () => Date.now(),
  log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-017", ...fields })),
} = {}) {
  const db = openSqliteDatabase(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS publishing_requests (
      id TEXT PRIMARY KEY,
      publisher_id TEXT NOT NULL,
      title TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      storage_key TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('submitted', 'withdrawn')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS publishing_requests_publisher_updated_idx
      ON publishing_requests(publisher_id, updated_at DESC, id DESC);

    CREATE TABLE IF NOT EXISTS publisher_marc_records (
      publisher_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (publisher_id, product_id)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS publisher_marc_publisher_updated_idx
      ON publisher_marc_records(publisher_id, updated_at DESC, product_id ASC);

    CREATE TABLE IF NOT EXISTS royalty_decision_acceptances (
      decision_area TEXT PRIMARY KEY,
      accepted_at INTEGER NOT NULL,
      authority_source TEXT NOT NULL
    ) STRICT;
  `);
  return { db, clock, log, close: () => db.close() };
}

export function createPublishingRequest(store, actor, input = {}) {
  const publisherId = resolvePublisherId(actor, input.publisherId);
  const title = required(input.title, "Title");
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  const storageKey = assertOpaqueStorageKey(input.storageKey);
  const now = store.clock();
  const row = {
    id: identifier(),
    publisherId,
    title,
    notes,
    storageKey,
    status: "submitted",
    createdAt: now,
    updatedAt: now,
  };
  store.db
    .prepare(
      `INSERT INTO publishing_requests
        (id, publisher_id, title, notes, storage_key, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(row.id, row.publisherId, row.title, row.notes, row.storageKey, row.status, row.createdAt, row.updatedAt);
  store.log("publishing_request_created", {
    publishingRequestId: row.id,
    publisherId: row.publisherId,
    status: row.status,
  });
  return publicRequest(row);
}

export function listPublishingRequests(store, actor, input = {}) {
  const publisherId = resolvePublisherId(actor, input.publisherId);
  return store.db
    .prepare(
      `SELECT id, publisher_id AS publisherId, title, notes, status, created_at AS createdAt, updated_at AS updatedAt
       FROM publishing_requests
       WHERE publisher_id = ?
       ORDER BY updated_at DESC, id DESC`,
    )
    .all(publisherId)
    .map(publicRequest);
}

export function withdrawPublishingRequest(store, actor, input = {}) {
  const publisherId = resolvePublisherId(actor, input.publisherId);
  const requestId = required(input.requestId, "Request ID");
  const existing = store.db
    .prepare(
      `SELECT id, publisher_id AS publisherId, title, notes, status, created_at AS createdAt, updated_at AS updatedAt
       FROM publishing_requests WHERE id = ?`,
    )
    .get(requestId);
  if (!existing) throw new Error("Publishing request does not exist.");
  if (existing.publisherId !== publisherId) throw new Error("You cannot access another publisher's records.");
  if (existing.status === "withdrawn") throw new Error("Publishing request is already withdrawn.");
  const updatedAt = store.clock();
  store.db.prepare(`UPDATE publishing_requests SET status = 'withdrawn', updated_at = ? WHERE id = ?`).run(updatedAt, requestId);
  store.log("publishing_request_withdrawn", {
    publishingRequestId: requestId,
    publisherId,
    status: "withdrawn",
  });
  return publicRequest({ ...existing, status: "withdrawn", updatedAt });
}

export function registerPublisherMarcRecord(store, actor, input = {}) {
  const publisherId = resolvePublisherId(actor, input.publisherId);
  const productId = required(input.productId, "Product ID");
  const product = store.db.prepare("SELECT id FROM products WHERE id = ?").get(productId);
  if (!product) throw new Error("Product does not exist.");
  const storageKey = assertOpaqueStorageKey(input.storageKey);
  const updatedAt = store.clock();
  store.db
    .prepare(
      `INSERT INTO publisher_marc_records (publisher_id, product_id, storage_key, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(publisher_id, product_id) DO UPDATE SET
         storage_key = excluded.storage_key,
         updated_by = excluded.updated_by,
         updated_at = excluded.updated_at`,
    )
    .run(publisherId, productId, storageKey, actor.id, updatedAt);
  store.log("publisher_marc_registered", {
    publisherId,
    productId,
    updatedAt,
  });
  return { publisherId, productId, updatedAt };
}

export function listPublisherMarcRecords(store, actor, input = {}) {
  const publisherId = resolvePublisherId(actor, input.publisherId);
  return store.db
    .prepare(
      `SELECT publisher_id AS publisherId, product_id AS productId, updated_at AS updatedAt
       FROM publisher_marc_records
       WHERE publisher_id = ?
       ORDER BY updated_at DESC, product_id ASC`,
    )
    .all(publisherId)
    .map(publicMarcListItem);
}

export function getPublisherDashboard(store, actor, input = {}) {
  const publisherId = resolvePublisherId(actor, input.publisherId);
  const gate = getRoyaltyActivationGate(store);
  const requestCount = store.db
    .prepare(`SELECT COUNT(*) AS count FROM publishing_requests WHERE publisher_id = ? AND status = 'submitted'`)
    .get(publisherId).count;
  const marcCount = store.db
    .prepare(`SELECT COUNT(*) AS count FROM publisher_marc_records WHERE publisher_id = ?`)
    .get(publisherId).count;
  store.log("publisher_dashboard_read", {
    publisherId,
    activationGateStatus: gate.status,
    financialActivationAllowed: gate.financialActivationAllowed,
  });
  return {
    publisherId,
    nonFinancial: {
      submittedPublishingRequestCount: requestCount,
      marcRecordCount: marcCount,
    },
    royalties: { policyPending: true },
    sales: { policyPending: true },
    contracts: { policyPending: true },
    activationGate: {
      status: gate.status,
      financialActivationAllowed: gate.financialActivationAllowed,
      unresolvedDecisionAreas: gate.unresolvedDecisionAreas,
    },
  };
}

export function computePublisherRoyalties(store, actor, input = {}) {
  resolvePublisherId(actor, input.publisherId);
  assertRoyaltyActivationGate(store, "Royalty computation");
  throw new Error("Royalty computation is not implemented without accepted decision-register calculation methods.");
}

export function allocatePublisherSales(store, actor, input = {}) {
  resolvePublisherId(actor, input.publisherId);
  assertRoyaltyActivationGate(store, "Sales allocation");
  throw new Error("Sales allocation is not implemented without accepted decision-register allocation rules.");
}

export function createPublisherPayoutInstruction(store, actor, input = {}) {
  resolvePublisherId(actor, input.publisherId);
  assertRoyaltyActivationGate(store, "Publisher payout");
  throw new Error("Publisher payout instructions are not implemented without accepted payment authority.");
}
