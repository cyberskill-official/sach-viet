import { randomBytes } from "node:crypto";
import { beginImmediateWithRetry, isUniqueViolationError, openDatabase, tableExists } from "./db.mjs";
import { normalizeRole } from "./access.mjs";
import { normalizeMoney } from "./catalog-core.mjs";

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

function productExists(store, productId) {
  if (!tableExists(store.db, "products")) return true;
  return Boolean(store.db.prepare("SELECT 1 FROM products WHERE id = ? LIMIT 1").get(productId));
}

function quoteRow(store, quoteId) {
  return store.db.prepare(`
    SELECT id, organization_id AS organizationId, selection_list_id AS selectionListId,
           status, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt
    FROM b2b_quotes WHERE id = ?
  `).get(quoteId);
}

function quoteItems(store, quoteId) {
  return store.db.prepare(`
    SELECT id, quote_id AS quoteId, product_id AS productId, quantity, unit_price_usd AS unitPriceUsd
    FROM b2b_quote_items WHERE quote_id = ? ORDER BY id ASC
  `).all(quoteId);
}

function publicQuote(store, quote, { blind }) {
  const items = quoteItems(store, quote.id).map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    unitPriceUsd: item.unitPriceUsd,
  }));
  const payload = {
    id: quote.id,
    organizationId: quote.organizationId,
    selectionListId: quote.selectionListId,
    status: quote.status,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    items,
  };
  if (!blind) payload.createdBy = quote.createdBy;
  return payload;
}

export function createB2bQuoteStore({
  dbPath,
  clock = () => Date.now(),
  log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-013", ...fields })),
} = {}) {
  const db = openDatabase(dbPath);
  return { db, clock, log, close: () => db.close() };
}

export function createOrganization(store, actor, input) {
  staffActor(actor);
  const organization = { id: id(), name: required(input?.name, "Organization name"), createdAt: store.clock() };
  store.db.prepare("INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?)").run(organization.id, organization.name, organization.createdAt);
  store.log("b2b_organization_created", { result: "accepted", organization_id: organization.id });
  return organization;
}

export function addOrganizationMember(store, actor, input) {
  staffActor(actor);
  const organizationId = required(input?.organizationId, "Organization ID");
  const userId = required(input?.userId, "User ID");
  if (!store.db.prepare("SELECT 1 FROM organizations WHERE id = ?").get(organizationId)) throw new Error("Organization does not exist.");
  try {
    store.db.prepare("INSERT INTO organization_members (organization_id, user_id, created_at) VALUES (?, ?, ?)").run(organizationId, userId, store.clock());
  } catch (error) {
    if (isUniqueViolationError(error)) throw new Error("User already belongs to an organization.");
    throw error;
  }
  store.log("b2b_organization_member_added", { result: "accepted", organization_id: organizationId });
  return { organizationId, userId };
}

export function listOrganizations(store, actor) {
  staffActor(actor);
  return store.db.prepare("SELECT id, name, created_at AS createdAt FROM organizations ORDER BY created_at DESC, id DESC").all();
}

export function createSelectionList(store, actor, input) {
  const role = institutionActor(actor);
  let organizationId = typeof input?.organizationId === "string" ? input.organizationId.trim() : "";
  if (role === "admin") {
    organizationId = required(organizationId || null, "Organization ID");
  } else {
    organizationId = requireOrganizationForActor(store, actor);
  }
  if (!store.db.prepare("SELECT 1 FROM organizations WHERE id = ?").get(organizationId)) throw new Error("Organization does not exist.");
  const list = {
    id: id(),
    organizationId,
    title: required(input?.title, "Selection list title"),
    createdBy: actor.id,
    createdAt: store.clock(),
  };
  store.db.prepare("INSERT INTO selection_lists (id, organization_id, title, created_by, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(list.id, list.organizationId, list.title, list.createdBy, list.createdAt);
  store.log("b2b_selection_list_created", { result: "accepted", selection_list_id: list.id, organization_id: list.organizationId });
  return list;
}

export function addSelectionListItem(store, actor, input) {
  institutionActor(actor);
  const selectionListId = required(input?.selectionListId, "Selection list ID");
  const list = store.db.prepare("SELECT id, organization_id AS organizationId FROM selection_lists WHERE id = ?").get(selectionListId);
  if (!list) throw new Error("Selection list does not exist.");
  const actorOrg = requireOrganizationForActor(store, actor);
  if (actorOrg && actorOrg !== list.organizationId) throw new Error("Selection list access is denied.");
  const productId = required(input?.productId, "Product ID");
  if (!productExists(store, productId)) throw new Error("Product does not exist.");
  const item = {
    id: id(),
    selectionListId,
    productId,
    quantity: positiveInt(input?.quantity, "Quantity"),
    createdAt: store.clock(),
  };
  store.db.prepare("INSERT INTO selection_list_items (id, selection_list_id, product_id, quantity, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(item.id, item.selectionListId, item.productId, item.quantity, item.createdAt);
  store.log("b2b_selection_list_item_added", { result: "accepted", selection_list_id: selectionListId, product_id: productId });
  return item;
}

export function listSelectionLists(store, actor) {
  institutionActor(actor);
  const actorOrg = requireOrganizationForActor(store, actor);
  const rows = actorOrg
    ? store.db.prepare("SELECT id, organization_id AS organizationId, title, created_by AS createdBy, created_at AS createdAt FROM selection_lists WHERE organization_id = ? ORDER BY created_at DESC, id DESC").all(actorOrg)
    : store.db.prepare("SELECT id, organization_id AS organizationId, title, created_by AS createdBy, created_at AS createdAt FROM selection_lists ORDER BY created_at DESC, id DESC").all();
  const items = store.db.prepare("SELECT id, product_id AS productId, quantity FROM selection_list_items WHERE selection_list_id = ? ORDER BY id ASC");
  return rows.map((row) => ({ ...row, items: items.all(row.id) }));
}

export function requestQuoteFromSelectionList(store, actor, input) {
  institutionActor(actor);
  const selectionListId = required(input?.selectionListId, "Selection list ID");
  const list = store.db.prepare("SELECT id, organization_id AS organizationId FROM selection_lists WHERE id = ?").get(selectionListId);
  if (!list) throw new Error("Selection list does not exist.");
  const actorOrg = requireOrganizationForActor(store, actor);
  if (actorOrg && actorOrg !== list.organizationId) throw new Error("Selection list access is denied.");
  const items = store.db.prepare("SELECT product_id AS productId, quantity FROM selection_list_items WHERE selection_list_id = ? ORDER BY id ASC").all(selectionListId);
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
  beginImmediateWithRetry(store.db);
  try {
    store.db.prepare("INSERT INTO b2b_quotes (id, organization_id, selection_list_id, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(quote.id, quote.organizationId, quote.selectionListId, quote.status, quote.createdBy, quote.createdAt, quote.updatedAt);
    const insertItem = store.db.prepare("INSERT INTO b2b_quote_items (id, quote_id, product_id, quantity, unit_price_usd) VALUES (?, ?, ?, ?, NULL)");
    for (const item of items) insertItem.run(id(), quote.id, item.productId, item.quantity);
    store.db.exec("COMMIT");
  } catch (error) {
    store.db.exec("ROLLBACK");
    throw error;
  }
  store.log("b2b_quote_requested", { result: "accepted", quote_id: quote.id, organization_id: quote.organizationId, status: quote.status });
  return publicQuote(store, quote, { blind: true });
}

export function listInstitutionQuotes(store, actor) {
  institutionActor(actor);
  const actorOrg = requireOrganizationForActor(store, actor);
  const rows = actorOrg
    ? store.db.prepare("SELECT id, organization_id AS organizationId, selection_list_id AS selectionListId, status, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt FROM b2b_quotes WHERE organization_id = ? ORDER BY updated_at DESC, id DESC").all(actorOrg)
    : store.db.prepare("SELECT id, organization_id AS organizationId, selection_list_id AS selectionListId, status, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt FROM b2b_quotes ORDER BY updated_at DESC, id DESC").all();
  return rows.map((row) => publicQuote(store, row, { blind: true }));
}

export function getInstitutionQuote(store, actor, quoteId) {
  institutionActor(actor);
  const quote = quoteRow(store, required(quoteId, "Quote ID"));
  if (!quote) throw new Error("Quote does not exist.");
  const actorOrg = requireOrganizationForActor(store, actor);
  if (actorOrg && actorOrg !== quote.organizationId) throw new Error("Quote access is denied.");
  return publicQuote(store, quote, { blind: true });
}

export function listQuotesPipeline(store, actor) {
  staffActor(actor);
  const rows = store.db.prepare("SELECT id, organization_id AS organizationId, selection_list_id AS selectionListId, status, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt FROM b2b_quotes ORDER BY updated_at DESC, id DESC").all();
  const pipeline = Object.fromEntries(QUOTE_STATUSES.map((status) => [status, []]));
  for (const row of rows) pipeline[row.status].push(publicQuote(store, row, { blind: false }));
  return pipeline;
}

export function getStaffQuote(store, actor, quoteId) {
  staffActor(actor);
  const quote = quoteRow(store, required(quoteId, "Quote ID"));
  if (!quote) throw new Error("Quote does not exist.");
  return publicQuote(store, quote, { blind: false });
}

export function transitionQuoteStatus(store, actor, input) {
  staffActor(actor);
  const quoteId = required(input?.quoteId, "Quote ID");
  const nextStatus = required(input?.status, "Status");
  if (!QUOTE_STATUSES.includes(nextStatus)) throw new Error("Quote status is invalid.");
  const quote = quoteRow(store, quoteId);
  if (!quote) throw new Error("Quote does not exist.");
  const allowed = TRANSITIONS[quote.status] || [];
  if (!allowed.includes(nextStatus)) throw new Error(`Cannot transition quote from ${quote.status} to ${nextStatus}.`);
  const updatedAt = store.clock();
  store.db.prepare("UPDATE b2b_quotes SET status = ?, updated_at = ? WHERE id = ?").run(nextStatus, updatedAt, quoteId);
  store.log("b2b_quote_status_changed", { result: "accepted", quote_id: quoteId, from_status: quote.status, to_status: nextStatus });
  return publicQuote(store, { ...quote, status: nextStatus, updatedAt }, { blind: false });
}

export function setQuoteItemPrices(store, actor, input) {
  staffActor(actor);
  const quoteId = required(input?.quoteId, "Quote ID");
  const quote = quoteRow(store, quoteId);
  if (!quote) throw new Error("Quote does not exist.");
  if (!["draft", "sent", "negotiating"].includes(quote.status)) throw new Error("Quote prices can only be set before a terminal status.");
  if (!Array.isArray(input?.items) || input.items.length === 0) throw new Error("At least one quote item price is required.");
  beginImmediateWithRetry(store.db);
  try {
    for (const entry of input.items) {
      const itemId = required(entry?.id, "Quote item ID");
      const unitPriceUsd = normalizeMoney(entry?.unitPriceUsd);
      const row = store.db.prepare("SELECT id FROM b2b_quote_items WHERE id = ? AND quote_id = ?").get(itemId, quoteId);
      if (!row) throw new Error("Quote item does not exist on this quote.");
      store.db.prepare("UPDATE b2b_quote_items SET unit_price_usd = ? WHERE id = ?").run(unitPriceUsd, itemId);
    }
    const updatedAt = store.clock();
    store.db.prepare("UPDATE b2b_quotes SET updated_at = ? WHERE id = ?").run(updatedAt, quoteId);
    store.db.exec("COMMIT");
  } catch (error) {
    store.db.exec("ROLLBACK");
    throw error;
  }
  store.log("b2b_quote_prices_set", { result: "accepted", quote_id: quoteId, item_count: input.items.length });
  return getStaffQuote(store, actor, quoteId);
}

export const B2B_QUOTE_STATUSES = QUOTE_STATUSES;
