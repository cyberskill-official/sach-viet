import { randomBytes } from "node:crypto";
import { beginImmediateWithRetry, isUniqueViolationError, openDatabase, tableExists } from "./db.mjs";
import { normalizeRole } from "./access.mjs";
import { normalizeMoney } from "./catalog-core.mjs";
import {
  B2B_COMMERCIAL_POLICY,
  DEC_B2B_NET_DAYS,
  DEC_B2B_QUOTE_VALIDITY_DAYS,
  applyB2bDiscount,
  isB2bQuoteExpired,
} from "./finance-policy-core.mjs";

const QUOTE_STATUSES = Object.freeze(["draft", "sent", "negotiating", "won", "lost"]);
const TRANSITIONS = Object.freeze({
  draft: ["sent"],
  sent: ["negotiating"],
  negotiating: ["won", "lost"],
  won: [],
  lost: [],
});

const id = () => randomBytes(16).toString("hex");
const required = (value, name) => {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${name} is required.`);
  return value.trim();
};
const positiveInt = (value, name) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new Error(`${name} must be a positive integer.`);
  return n;
};

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

async function productExists(store, productId) {
  if (!await tableExists(store.db, "products")) return true;
  return Boolean(await store.db.prepare("SELECT 1 FROM products WHERE id = ? LIMIT 1").get(productId));
}

async function quoteRow(store, quoteId) {
  return await store.db.prepare(`
    SELECT id, organization_id AS organizationId, selection_list_id AS selectionListId,
           status, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt
    FROM b2b_quotes WHERE id = ?
  `).get(quoteId);
}

async function quoteItems(store, quoteId) {
  return await store.db.prepare(`
    SELECT id, quote_id AS quoteId, product_id AS productId, quantity, unit_price_usd AS unitPriceUsd
    FROM b2b_quote_items WHERE quote_id = ? ORDER BY id ASC
  `).all(quoteId);
}

async function publicQuote(store, quote, { blind, now = store.clock() }) {
  const items = (await quoteItems(store, quote.id)).map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    unitPriceUsd: item.unitPriceUsd,
  }));
  const expired = isB2bQuoteExpired(quote.createdAt, now);
  const payload = {
    id: quote.id,
    organizationId: quote.organizationId,
    selectionListId: quote.selectionListId,
    status: quote.status,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    items,
    quoteValidityDays: DEC_B2B_QUOTE_VALIDITY_DAYS,
    netDays: DEC_B2B_NET_DAYS,
    expired,
    commercialPolicyVersion: B2B_COMMERCIAL_POLICY.version,
  };
  if (!blind) payload.createdBy = quote.createdBy;
  return payload;
}

export async function createB2bQuoteStore({
  dbPath,
  clock = () => Date.now(),
  log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-013", ...fields })),
} = {}) {
  const db = await openDatabase(dbPath);
  return { db, clock, log, close: () => db.close() };
}

export async function createOrganization(store, actor, input) {
  staffActor(actor);
  const organization = { id: id(), name: required(input?.name, "Organization name"), createdAt: store.clock() };
  await store.db.prepare("INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?)").run(organization.id, organization.name, organization.createdAt);
  store.log("b2b_organization_created", { result: "accepted", organization_id: organization.id });
  return organization;
}

export async function addOrganizationMember(store, actor, input) {
  staffActor(actor);
  const organizationId = required(input?.organizationId, "Organization ID");
  const userId = required(input?.userId, "User ID");
  if (!await store.db.prepare("SELECT 1 FROM organizations WHERE id = ?").get(organizationId)) throw new Error("Organization does not exist.");
  try {
    await store.db.prepare("INSERT INTO organization_members (organization_id, user_id, created_at) VALUES (?, ?, ?)").run(organizationId, userId, store.clock());
  } catch (error) {
    if (isUniqueViolationError(error)) throw new Error("User already belongs to an organization.");
    throw error;
  }
  store.log("b2b_organization_member_added", { result: "accepted", organization_id: organizationId });
  return { organizationId, userId };
}

export async function listOrganizations(store, actor) {
  staffActor(actor);
  return await store.db.prepare("SELECT id, name, created_at AS createdAt FROM organizations ORDER BY created_at DESC, id DESC").all();
}

export async function createSelectionList(store, actor, input) {
  const role = institutionActor(actor);
  let organizationId = typeof input?.organizationId === "string" ? input.organizationId.trim() : "";
  if (role === "admin") {
    organizationId = required(organizationId || null, "Organization ID");
  } else {
    organizationId = await requireOrganizationForActor(store, actor);
  }
  if (!await store.db.prepare("SELECT 1 FROM organizations WHERE id = ?").get(organizationId)) throw new Error("Organization does not exist.");
  const list = {
    id: id(),
    organizationId,
    title: required(input?.title, "Selection list title"),
    createdBy: actor.id,
    createdAt: store.clock(),
  };
  await store.db.prepare("INSERT INTO selection_lists (id, organization_id, title, created_by, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(list.id, list.organizationId, list.title, list.createdBy, list.createdAt);
  store.log("b2b_selection_list_created", { result: "accepted", selection_list_id: list.id, organization_id: list.organizationId });
  return list;
}

export async function addSelectionListItem(store, actor, input) {
  institutionActor(actor);
  const selectionListId = required(input?.selectionListId, "Selection list ID");
  const list = await store.db.prepare("SELECT id, organization_id AS organizationId FROM selection_lists WHERE id = ?").get(selectionListId);
  if (!list) throw new Error("Selection list does not exist.");
  const actorOrg = await requireOrganizationForActor(store, actor);
  if (actorOrg && actorOrg !== list.organizationId) throw new Error("Selection list access is denied.");
  const productId = required(input?.productId, "Product ID");
  if (!await productExists(store, productId)) throw new Error("Product does not exist.");
  const item = {
    id: id(),
    selectionListId,
    productId,
    quantity: positiveInt(input?.quantity, "Quantity"),
    createdAt: store.clock(),
  };
  await store.db.prepare("INSERT INTO selection_list_items (id, selection_list_id, product_id, quantity, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(item.id, item.selectionListId, item.productId, item.quantity, item.createdAt);
  store.log("b2b_selection_list_item_added", { result: "accepted", selection_list_id: selectionListId, product_id: productId });
  return item;
}

export async function listSelectionLists(store, actor) {
  institutionActor(actor);
  const actorOrg = await requireOrganizationForActor(store, actor);
  const rows = actorOrg
    ? await store.db.prepare("SELECT id, organization_id AS organizationId, title, created_by AS createdBy, created_at AS createdAt FROM selection_lists WHERE organization_id = ? ORDER BY created_at DESC, id DESC").all(actorOrg)
    : await store.db.prepare("SELECT id, organization_id AS organizationId, title, created_by AS createdBy, created_at AS createdAt FROM selection_lists ORDER BY created_at DESC, id DESC").all();
  const items = store.db.prepare("SELECT id, product_id AS productId, quantity FROM selection_list_items WHERE selection_list_id = ? ORDER BY id ASC");
  const result = [];
  for (const row of rows) {
    result.push({ ...row, items: await items.all(row.id) });
  }
  return result;
}

export async function requestQuoteFromSelectionList(store, actor, input) {
  institutionActor(actor);
  const selectionListId = required(input?.selectionListId, "Selection list ID");
  const list = await store.db.prepare("SELECT id, organization_id AS organizationId FROM selection_lists WHERE id = ?").get(selectionListId);
  if (!list) throw new Error("Selection list does not exist.");
  const actorOrg = await requireOrganizationForActor(store, actor);
  if (actorOrg && actorOrg !== list.organizationId) throw new Error("Selection list access is denied.");
  const items = await store.db.prepare("SELECT product_id AS productId, quantity FROM selection_list_items WHERE selection_list_id = ? ORDER BY id ASC").all(selectionListId);
  if (items.length === 0) throw new Error("Selection list must contain at least one item.");
  const now = store.clock();
  const quote = {
    id: id(),
    organizationId: list.organizationId,
    selectionListId,
    status: "draft",
    createdBy: actor.id,
    createdAt: now,
    updatedAt: now,
  };
  await beginImmediateWithRetry(store.db);
  try {
    await store.db.prepare("INSERT INTO b2b_quotes (id, organization_id, selection_list_id, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(quote.id, quote.organizationId, quote.selectionListId, quote.status, quote.createdBy, quote.createdAt, quote.updatedAt);
    const insertItem = store.db.prepare("INSERT INTO b2b_quote_items (id, quote_id, product_id, quantity, unit_price_usd) VALUES (?, ?, ?, ?, NULL)");
    for (const item of items) await insertItem.run(id(), quote.id, item.productId, item.quantity);
    await store.db.exec("COMMIT");
  } catch (error) {
    await store.db.exec("ROLLBACK");
    throw error;
  }
  store.log("b2b_quote_requested", { result: "accepted", quote_id: quote.id, organization_id: quote.organizationId, status: quote.status });
  return await publicQuote(store, quote, { blind: true });
}

export async function listInstitutionQuotes(store, actor) {
  institutionActor(actor);
  const actorOrg = await requireOrganizationForActor(store, actor);
  const rows = actorOrg
    ? await store.db.prepare("SELECT id, organization_id AS organizationId, selection_list_id AS selectionListId, status, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt FROM b2b_quotes WHERE organization_id = ? ORDER BY updated_at DESC, id DESC").all(actorOrg)
    : await store.db.prepare("SELECT id, organization_id AS organizationId, selection_list_id AS selectionListId, status, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt FROM b2b_quotes ORDER BY updated_at DESC, id DESC").all();
  return Promise.all(rows.map((row) => publicQuote(store, row, { blind: true })));
}

export async function getInstitutionQuote(store, actor, quoteId) {
  institutionActor(actor);
  const quote = await quoteRow(store, required(quoteId, "Quote ID"));
  if (!quote) throw new Error("Quote does not exist.");
  const actorOrg = await requireOrganizationForActor(store, actor);
  if (actorOrg && actorOrg !== quote.organizationId) throw new Error("Quote access is denied.");
  return await publicQuote(store, quote, { blind: true });
}

export async function listQuotesPipeline(store, actor) {
  staffActor(actor);
  const rows = await store.db.prepare("SELECT id, organization_id AS organizationId, selection_list_id AS selectionListId, status, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt FROM b2b_quotes ORDER BY updated_at DESC, id DESC").all();
  const pipeline = Object.fromEntries(QUOTE_STATUSES.map((status) => [status, []]));
  for (const row of rows) pipeline[row.status].push(await publicQuote(store, row, { blind: false }));
  return pipeline;
}

export async function getStaffQuote(store, actor, quoteId) {
  staffActor(actor);
  const quote = await quoteRow(store, required(quoteId, "Quote ID"));
  if (!quote) throw new Error("Quote does not exist.");
  return await publicQuote(store, quote, { blind: false });
}

export async function transitionQuoteStatus(store, actor, input) {
  staffActor(actor);
  const quoteId = required(input?.quoteId, "Quote ID");
  const nextStatus = required(input?.status, "Status");
  if (!QUOTE_STATUSES.includes(nextStatus)) throw new Error("Quote status is invalid.");
  const quote = await quoteRow(store, quoteId);
  if (!quote) throw new Error("Quote does not exist.");
  if (isB2bQuoteExpired(quote.createdAt, store.clock()) && nextStatus === "won") {
    throw new Error(`DEC-B2B-001: quote expired after ${DEC_B2B_QUOTE_VALIDITY_DAYS} days; re-issue required.`);
  }
  const allowed = TRANSITIONS[quote.status] || [];
  if (!allowed.includes(nextStatus)) throw new Error(`Cannot transition quote from ${quote.status} to ${nextStatus}.`);
  const updatedAt = store.clock();
  await store.db.prepare("UPDATE b2b_quotes SET status = ?, updated_at = ? WHERE id = ?").run(nextStatus, updatedAt, quoteId);
  store.log("b2b_quote_status_changed", { result: "accepted", quote_id: quoteId, from_status: quote.status, to_status: nextStatus });
  return await publicQuote(store, { ...quote, status: nextStatus, updatedAt }, { blind: false });
}

/**
 * Admin-only discount preview using DEC-B2B max 20%.
 * @param {object} store
 * @param {{ id: string, role: string }} actor
 * @param {{ quoteId?: string, discountPercent?: number, subtotalUsd?: string }} input
 */
export async function previewQuoteDiscount(store, actor, input = {}) {
  staffActor(actor);
  const role = normalizeRole(actor.role);
  const discountPercent = Number(input?.discountPercent);
  let subtotalUsd = typeof input?.subtotalUsd === "string" ? input.subtotalUsd : "";
  if (input?.quoteId) {
    const quote = await getStaffQuote(store, actor, input.quoteId);
    if (quote.expired) {
      throw new Error(`DEC-B2B-001: quote expired after ${DEC_B2B_QUOTE_VALIDITY_DAYS} days; re-issue required.`);
    }
    const units = quote.items.reduce((sum, item) => {
      if (!item.unitPriceUsd) return sum;
      const [whole, fraction = ""] = String(item.unitPriceUsd).split(".");
      const line = (BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0"))) * BigInt(item.quantity);
      return sum + line;
    }, 0n);
    subtotalUsd = `${units / 10000n}.${String(units % 10000n).padStart(4, "0")}`;
  }
  if (!subtotalUsd) throw new Error("Subtotal or quoteId is required.");
  return applyB2bDiscount(subtotalUsd, discountPercent, { role });
}

export async function setQuoteItemPrices(store, actor, input) {
  staffActor(actor);
  const quoteId = required(input?.quoteId, "Quote ID");
  const quote = await quoteRow(store, quoteId);
  if (!quote) throw new Error("Quote does not exist.");
  if (!["draft", "sent", "negotiating"].includes(quote.status)) throw new Error("Quote prices can only be set before a terminal status.");
  if (!Array.isArray(input?.items) || input.items.length === 0) throw new Error("At least one quote item price is required.");
  await beginImmediateWithRetry(store.db);
  try {
    for (const entry of input.items) {
      const itemId = required(entry?.id, "Quote item ID");
      const unitPriceUsd = normalizeMoney(entry?.unitPriceUsd);
      const row = await store.db.prepare("SELECT id FROM b2b_quote_items WHERE id = ? AND quote_id = ?").get(itemId, quoteId);
      if (!row) throw new Error("Quote item does not exist on this quote.");
      await store.db.prepare("UPDATE b2b_quote_items SET unit_price_usd = ? WHERE id = ?").run(unitPriceUsd, itemId);
    }
    const updatedAt = store.clock();
    await store.db.prepare("UPDATE b2b_quotes SET updated_at = ? WHERE id = ?").run(updatedAt, quoteId);
    await store.db.exec("COMMIT");
  } catch (error) {
    await store.db.exec("ROLLBACK");
    throw error;
  }
  store.log("b2b_quote_prices_set", { result: "accepted", quote_id: quoteId, item_count: input.items.length });
  return await getStaffQuote(store, actor, quoteId);
}

export const B2B_QUOTE_STATUSES = QUOTE_STATUSES;
