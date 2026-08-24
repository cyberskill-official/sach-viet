import { randomBytes } from "node:crypto";
import { openDatabase } from "./db.mjs";
import { assertPermission, normalizeRole } from "./access.mjs";
import { requireStoredObjectKey } from "./storage-core.mjs";
import {
  assertRoyaltyActivationGate,
  getRoyaltyActivationGate,
} from "./publisher-portal-core.mjs";

const identifier = () => randomBytes(16).toString("hex");
const required = (value, label) => {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`);
  return value.trim();
};

function authorActor(user) {
  assertPermission(user, "author.dashboard", "Author access is required.");
  return normalizeRole(user.role);
}

function resolveAuthorId(actor, requestedAuthorId) {
  const role = authorActor(actor);
  if (role === "admin") {
    return requestedAuthorId ? required(requestedAuthorId, "Author ID") : actor.id;
  }
  if (requestedAuthorId && requestedAuthorId !== actor.id) {
    throw new Error("You cannot access another author's records.");
  }
  return actor.id;
}

async function assertOpaqueStorageKey(store, storageKey) {
  return requireStoredObjectKey(store, required(storageKey, "Storage key"));
}

function publicRequest(row) {
  return {
    id: row.id,
    authorId: row.authorId,
    title: row.title,
    notes: row.notes,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function publicLog(row) {
  return {
    id: row.id,
    manuscriptRequestId: row.manuscriptRequestId,
    status: row.status,
    actorId: row.actorId,
    createdAt: row.createdAt,
  };
}

async function appendStatusLog(store, { manuscriptRequestId, status, actorId, createdAt }) {
  const id = identifier();
  await store.db
    .prepare(
      `INSERT INTO author_manuscript_request_logs
        (id, manuscript_request_id, status, actor_id, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, manuscriptRequestId, status, actorId, createdAt);
  return { id, manuscriptRequestId, status, actorId, createdAt };
}

export async function createAuthorPortalStore({
  dbPath,
  clock = () => Date.now(),
  log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-018", ...fields })),
} = {}) {
  const db = await openDatabase(dbPath);
  return { db, clock, log, close: () => db.close() };
}

export async function createAuthorManuscriptRequest(store, actor, input = {}) {
  const authorId = resolveAuthorId(actor, input.authorId);
  const title = required(input.title, "Title");
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  const storageKey = await assertOpaqueStorageKey(store, input.storageKey);
  const now = store.clock();
  const row = {
    id: identifier(),
    authorId,
    title,
    notes,
    storageKey,
    status: "submitted",
    createdAt: now,
    updatedAt: now,
  };
  await store.db
    .prepare(
      `INSERT INTO author_manuscript_requests
        (id, author_id, title, notes, storage_key, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(row.id, row.authorId, row.title, row.notes, row.storageKey, row.status, row.createdAt, row.updatedAt);
  await appendStatusLog(store, {
    manuscriptRequestId: row.id,
    status: "submitted",
    actorId: actor.id,
    createdAt: now,
  });
  store.log("author_manuscript_request_created", {
    manuscriptRequestId: row.id,
    authorId: row.authorId,
    status: row.status,
  });
  return publicRequest(row);
}

export async function listAuthorManuscriptRequests(store, actor, input = {}) {
  const authorId = resolveAuthorId(actor, input.authorId);
  const rows = await store.db
    .prepare(
      `SELECT id, author_id AS authorId, title, notes, status, created_at AS createdAt, updated_at AS updatedAt
       FROM author_manuscript_requests
       WHERE author_id = ?
       ORDER BY updated_at DESC, id DESC`,
    )
    .all(authorId);
  return rows.map(publicRequest);
}

export async function getAuthorManuscriptRequest(store, actor, input = {}) {
  const authorId = resolveAuthorId(actor, input.authorId);
  const requestId = required(input.requestId, "Request ID");
  const existing = await store.db
    .prepare(
      `SELECT id, author_id AS authorId, title, notes, status, created_at AS createdAt, updated_at AS updatedAt
       FROM author_manuscript_requests WHERE id = ?`,
    )
    .get(requestId);
  if (!existing) throw new Error("Manuscript request does not exist.");
  if (existing.authorId !== authorId) throw new Error("You cannot access another author's records.");
  const logs = await store.db
    .prepare(
      `SELECT id, manuscript_request_id AS manuscriptRequestId, status, actor_id AS actorId, created_at AS createdAt
       FROM author_manuscript_request_logs
       WHERE manuscript_request_id = ?
       ORDER BY created_at ASC, id ASC`,
    )
    .all(requestId);
  return { ...publicRequest(existing), logs: logs.map(publicLog) };
}

export async function withdrawAuthorManuscriptRequest(store, actor, input = {}) {
  const authorId = resolveAuthorId(actor, input.authorId);
  const requestId = required(input.requestId, "Request ID");
  const existing = await store.db
    .prepare(
      `SELECT id, author_id AS authorId, title, notes, status, created_at AS createdAt, updated_at AS updatedAt
       FROM author_manuscript_requests WHERE id = ?`,
    )
    .get(requestId);
  if (!existing) throw new Error("Manuscript request does not exist.");
  if (existing.authorId !== authorId) throw new Error("You cannot access another author's records.");
  if (existing.status === "withdrawn") throw new Error("Manuscript request is already withdrawn.");
  const updatedAt = store.clock();
  await store.db
    .prepare(`UPDATE author_manuscript_requests SET status = 'withdrawn', updated_at = ? WHERE id = ?`)
    .run(updatedAt, requestId);
  await appendStatusLog(store, {
    manuscriptRequestId: requestId,
    status: "withdrawn",
    actorId: actor.id,
    createdAt: updatedAt,
  });
  store.log("author_manuscript_request_withdrawn", {
    manuscriptRequestId: requestId,
    authorId,
    status: "withdrawn",
  });
  return publicRequest({ ...existing, status: "withdrawn", updatedAt });
}

export async function getAuthorDashboard(store, actor, input = {}) {
  const authorId = resolveAuthorId(actor, input.authorId);
  const gate = await getRoyaltyActivationGate(store);
  const submittedCount = (await store.db
    .prepare(
      `SELECT COUNT(*) AS count FROM author_manuscript_requests WHERE author_id = ? AND status = 'submitted'`,
    )
    .get(authorId)).count;
  const withdrawnCount = (await store.db
    .prepare(
      `SELECT COUNT(*) AS count FROM author_manuscript_requests WHERE author_id = ? AND status = 'withdrawn'`,
    )
    .get(authorId)).count;
  store.log("author_dashboard_read", {
    authorId,
    activationGateStatus: gate.status,
    financialActivationAllowed: gate.financialActivationAllowed,
  });
  return {
    authorId,
    nonFinancial: {
      submittedManuscriptRequestCount: submittedCount,
      withdrawnManuscriptRequestCount: withdrawnCount,
    },
    earnings: { policyPending: true },
    stages: { policyPending: true },
    activationGate: {
      status: gate.status,
      financialActivationAllowed: gate.financialActivationAllowed,
      unresolvedDecisionAreas: gate.unresolvedDecisionAreas,
    },
  };
}

export async function computeAuthorEarnings(store, actor, input = {}) {
  resolveAuthorId(actor, input.authorId);
  await assertRoyaltyActivationGate(store, "Author earnings computation");
  throw new Error("Author earnings computation is not implemented without accepted decision-register calculation methods.");
}

export async function allocateAuthorSales(store, actor, input = {}) {
  resolveAuthorId(actor, input.authorId);
  await assertRoyaltyActivationGate(store, "Author sales allocation");
  throw new Error("Author sales allocation is not implemented without accepted decision-register allocation rules.");
}

export async function createAuthorPayoutInstruction(store, actor, input = {}) {
  resolveAuthorId(actor, input.authorId);
  await assertRoyaltyActivationGate(store, "Author payout");
  throw new Error("Author payout instructions are not implemented without accepted payment authority.");
}

export { getRoyaltyActivationGate, assertRoyaltyActivationGate };
