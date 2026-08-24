import { randomBytes } from "node:crypto";
import { openDatabase, tableExists } from "./db.mjs";
import { assertPermission, normalizeRole } from "./access.mjs";

const identifier = () => randomBytes(16).toString("hex");
const required = (value, label) => {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`);
  return value.trim();
};

function employeeActor(user) {
  assertPermission(user, "employee.dashboard", "Employee access is required.");
  return normalizeRole(user.role);
}

function retailActor(user) {
  assertPermission(user, "retail.orders", "Retail access is required.");
  return normalizeRole(user.role);
}

function homeConfigActor(user) {
  employeeActor(user);
}

async function countRows(db, table, whereSql = "", params = []) {
  if (!await tableExists(db, table)) return 0;
  const row = await db.prepare(`SELECT COUNT(*) AS count FROM ${table}${whereSql ? ` WHERE ${whereSql}` : ""}`).get(...params);
  return Number(row?.count || 0);
}

export async function createEmployeeRetailStore({
  dbPath,
  clock = () => Date.now(),
  log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-009", ...fields })),
} = {}) {
  const db = await openDatabase(dbPath);
  return { db, clock, log, close: () => db.close() };
}

export async function getEmployeeDashboard(store, actor) {
  employeeActor(actor);
  const pendingApplications = await tableExists(store.db, "vendor_applications")
    ? await store.db.prepare(`
        SELECT id, user_id AS userId, status, created_at AS createdAt, updated_at AS updatedAt
        FROM vendor_applications
        WHERE status = 'pending'
        ORDER BY created_at DESC, id DESC
      `).all()
    : [];
  return {
    orderCount: await countRows(store.db, "orders"),
    paidOrderCount: await countRows(store.db, "orders", "status = ?", ["paid"]),
    openTicketCount: await countRows(store.db, "support_tickets", "status = ?", ["open"]),
    openGoodsRequestCount: await countRows(store.db, "goods_requests", "status = ?", ["open"]),
    pendingVendorApplicationCount: pendingApplications.length,
    approvalQueue: pendingApplications,
  };
}

export async function listHomeSections(store, actor) {
  homeConfigActor(actor);
  return (await store.db.prepare(`
    SELECT id, section_key AS sectionKey, title, body, sort_order AS sortOrder,
           is_enabled AS isEnabled, updated_by AS updatedBy, created_at AS createdAt, updated_at AS updatedAt
    FROM home_sections
    ORDER BY sort_order ASC, section_key ASC
  `).all()).map((row) => ({ ...row, isEnabled: row.isEnabled === 1 }));
}

export async function upsertHomeSection(store, actor, input) {
  homeConfigActor(actor);
  const sectionKey = required(input?.sectionKey, "Section key");
  if (!/^[a-z][a-z0-9_]{1,63}$/.test(sectionKey)) throw new Error("Section key must be a lowercase snake_case identifier.");
  const title = required(input?.title, "Section title");
  const body = typeof input?.body === "string" ? input.body : "";
  if (body.length > 4000) throw new Error("Section body is too long.");
  const sortOrder = Number.isInteger(input?.sortOrder) ? input.sortOrder : 0;
  const isEnabled = input?.isEnabled === false ? 0 : 1;
  const existing = await store.db.prepare("SELECT id, created_at FROM home_sections WHERE section_key = ?").get(sectionKey);
  const timestamp = store.clock();
  if (existing) {
    await store.db.prepare(`
      UPDATE home_sections
      SET title = ?, body = ?, sort_order = ?, is_enabled = ?, updated_by = ?, updated_at = ?
      WHERE id = ?
    `).run(title, body, sortOrder, isEnabled, actor.id, timestamp, existing.id);
    store.log("home_section_updated", { result: "accepted", section_id: existing.id, section_key: sectionKey });
    return {
      id: existing.id,
      sectionKey,
      title,
      body,
      sortOrder,
      isEnabled: isEnabled === 1,
      updatedBy: actor.id,
      createdAt: existing.created_at,
      updatedAt: timestamp,
    };
  }
  const section = {
    id: identifier(),
    sectionKey,
    title,
    body,
    sortOrder,
    isEnabled: isEnabled === 1,
    updatedBy: actor.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await store.db.prepare(`
    INSERT INTO home_sections (id, section_key, title, body, sort_order, is_enabled, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(section.id, section.sectionKey, section.title, section.body, section.sortOrder, isEnabled, section.updatedBy, section.createdAt, section.updatedAt);
  store.log("home_section_created", { result: "accepted", section_id: section.id, section_key: section.sectionKey });
  return section;
}

/**
 * @param {*} store
 * @param {*} actor
 * @param {{ after?: string, limit?: number, paidOnly?: boolean }} [options]
 */
export async function listRetailOrders(store, actor, { after, limit = 50, paidOnly = true } = {}) {
  retailActor(actor);
  if (!await tableExists(store.db, "orders")) return { items: [], nextCursor: null };
  const capped = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const clauses = paidOnly ? ["status = 'paid'"] : [];
  const params = [];
  if (after) {
    const cursor = await store.db.prepare("SELECT created_at AS createdAt, id FROM orders WHERE id = ?").get(after);
    if (cursor) {
      clauses.push("(created_at, id) < (?, ?)");
      params.push(cursor.createdAt, cursor.id);
    }
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await store.db.prepare(`
    SELECT id, status, currency, subtotal_usd AS subtotalUsd, created_at AS createdAt, updated_at AS updatedAt
    FROM orders
    ${where}
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `).all(...params, capped + 1);
  const hasMore = rows.length > capped;
  const page = hasMore ? rows.slice(0, capped) : rows;
  const itemStmt = store.db.prepare(`
    SELECT id, title, quantity, unit_price_usd AS unitPriceUsd, fulfillment_status AS fulfillmentStatus
    FROM order_items WHERE order_id = ? ORDER BY id ASC
  `);
  const items = [];
  for (const order of page) {
    items.push({ ...order, items: await itemStmt.all(order.id) });
  }
  return { items, nextCursor: hasMore ? page[page.length - 1].id : null };
}

export async function setRetailOrderItemFulfillment(store, actor, input = {}) {
  retailActor(actor);
  const orderItemId = required(input.orderItemId, "Order item ID");
  const fulfillmentStatus = required(input.fulfillmentStatus, "Fulfillment status");
  if (!["packing", "shipped", "delivered"].includes(fulfillmentStatus)) {
    throw new Error("Fulfillment status must be packing, shipped, or delivered.");
  }
  const row = await store.db.prepare(`
    SELECT order_items.id, orders.status AS orderStatus
    FROM order_items JOIN orders ON orders.id = order_items.order_id
    WHERE order_items.id = ?
  `).get(orderItemId);
  if (!row) throw new Error("Order item does not exist.");
  if (row.orderStatus !== "paid") throw new Error("Fulfillment overlay applies to paid orders only.");
  await store.db.prepare("UPDATE order_items SET fulfillment_status = ? WHERE id = ?")
    .run(fulfillmentStatus, orderItemId);
  store.log("retail_fulfillment_updated", {
    result: "accepted",
    order_item_id: orderItemId,
    fulfillment_status: fulfillmentStatus,
  });
  return { orderItemId, fulfillmentStatus, orderStatus: row.orderStatus };
}
