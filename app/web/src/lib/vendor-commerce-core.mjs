import { randomBytes } from "node:crypto";
import { beginImmediateWithRetry, isUniqueViolationError, openDatabase } from "./db.mjs";
import { canAccessOwnedRecord, normalizeRole } from "./access.mjs";

const identifier = () => randomBytes(16).toString("hex");
const required = (value, label) => { if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`); return value.trim(); };
function normalizeMoney(value) {
  const normalized = typeof value === "number" ? String(value) : value;
  if (typeof normalized !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/.test(normalized)) {
    throw new Error("Money must be a non-negative decimal USD value with up to four decimal places.");
  }
  const [whole, fraction = ""] = normalized.split(".");
  return `${whole}.${fraction.padEnd(4, "0")}`;
}
function moneyUnits(value) { const [whole, fraction = ""] = value.split("."); return BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0")); }
function moneyString(value) { return `${value / 10000n}.${String(value % 10000n).padStart(4, "0")}`; }
function vendorActor(user) {
  if (!user?.id) throw new Error("Authentication is required.");
  const role = normalizeRole(user.role);
  if (role !== "vendor" && role !== "admin") throw new Error("Vendor access is required.");
  return role;
}
function adminOnly(user) {
  if (!user?.id || normalizeRole(user.role) !== "admin") throw new Error("Administrator access is required.");
}
function resolveVendorId(actor, requestedVendorId) {
  const role = vendorActor(actor);
  if (role === "admin") return required(requestedVendorId, "Vendor ID");
  if (requestedVendorId && requestedVendorId !== actor.id) throw new Error("You cannot read another vendor's records.");
  return actor.id;
}

export async function createVendorCommerceStore({ dbPath, clock = () => Date.now(), log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-008", ...fields })) } = {}) {
  const db = await openDatabase(dbPath);
  return { db, clock, log, close: () => db.close() };
}

export async function listVendorIncomingOrders(store, actor, input = {}) {
  const vendorId = resolveVendorId(actor, input.vendorId);
  if (!canAccessOwnedRecord(actor, vendorId)) throw new Error("You cannot read this vendor's orders.");
  return await store.db.prepare(`
    SELECT orders.id AS orderId, orders.status, orders.currency, order_items.id AS orderItemId,
           order_items.title, order_items.unit_price_usd AS unitPriceUsd, order_items.quantity,
           order_items.vendor_offer_id AS vendorOfferId, orders.created_at AS createdAt
    FROM order_items
    JOIN orders ON orders.id = order_items.order_id
    JOIN vendor_offers ON vendor_offers.id = order_items.vendor_offer_id
    WHERE vendor_offers.vendor_id = ?
    ORDER BY orders.created_at DESC, order_items.id DESC
  `).all(vendorId);
}

export async function createVendorPayout(store, actor, input) {
  adminOnly(actor);
  const vendorId = required(input?.vendorId, "Vendor ID");
  const amountUsd = normalizeMoney(input?.amountUsd);
  if (!Array.isArray(input?.orderItemIds) || input.orderItemIds.length === 0) throw new Error("At least one order item is required.");
  const orderItemIds = [...new Set(input.orderItemIds.map((id) => required(id, "Order item ID")))];
  const payout = { id: identifier(), vendorId, amountUsd, createdBy: actor.id, createdAt: store.clock() };
  await beginImmediateWithRetry(store.db);
  try {
    for (const orderItemId of orderItemIds) {
      const row = await store.db.prepare(`
        SELECT order_items.id, vendor_offers.vendor_id AS vendorId
        FROM order_items
        JOIN vendor_offers ON vendor_offers.id = order_items.vendor_offer_id
        WHERE order_items.id = ?
      `).get(orderItemId);
      if (!row) throw new Error("Order item does not exist.");
      if (row.vendorId !== vendorId) throw new Error("Order item does not belong to this vendor.");
    }
    await store.db.prepare("INSERT INTO payouts (id, vendor_id, amount_usd, created_by, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(payout.id, payout.vendorId, payout.amountUsd, payout.createdBy, payout.createdAt);
    const insertItem = store.db.prepare("INSERT INTO payout_items (id, payout_id, order_item_id) VALUES (?, ?, ?)");
    for (const orderItemId of orderItemIds) {
      try { await insertItem.run(identifier(), payout.id, orderItemId); }
      catch (error) {
        if (isUniqueViolationError(error)) throw new Error("Order item is already included in a payout.");
        throw error;
      }
    }
    await store.db.exec("COMMIT");
  } catch (error) {
    await store.db.exec("ROLLBACK");
    throw error;
  }
  store.log("vendor_payout_created", { result: "accepted", payout_id: payout.id, vendor_id: vendorId, item_count: orderItemIds.length });
  return { id: payout.id, vendorId: payout.vendorId, amountUsd: payout.amountUsd, orderItemIds, createdAt: payout.createdAt };
}

export async function listVendorPayouts(store, actor, input = {}) {
  const vendorId = resolveVendorId(actor, input.vendorId);
  if (!canAccessOwnedRecord(actor, vendorId)) throw new Error("You cannot read this vendor's payouts.");
  const payouts = await store.db.prepare("SELECT id, vendor_id AS vendorId, amount_usd AS amountUsd, created_at AS createdAt FROM payouts WHERE vendor_id = ? ORDER BY created_at DESC, id DESC").all(vendorId);
  const items = store.db.prepare("SELECT payout_id AS payoutId, order_item_id AS orderItemId FROM payout_items WHERE payout_id = ? ORDER BY order_item_id ASC");
  const result = [];
  for (const payout of payouts) {
    const rows = await items.all(payout.id);
    result.push({ ...payout, orderItemIds: rows.map((row) => row.orderItemId) });
  }
  return result;
}

export async function listAdminPayouts(store, actor) {
  adminOnly(actor);
  const payouts = await store.db.prepare("SELECT id, vendor_id AS vendorId, amount_usd AS amountUsd, created_by AS createdBy, created_at AS createdAt FROM payouts ORDER BY created_at DESC, id DESC LIMIT 100").all();
  const items = store.db.prepare("SELECT order_item_id AS orderItemId FROM payout_items WHERE payout_id = ? ORDER BY order_item_id ASC");
  const result = [];
  for (const payout of payouts) {
    const rows = await items.all(payout.id);
    result.push({ ...payout, orderItemIds: rows.map((row) => row.orderItemId) });
  }
  return result;
}

export async function getVendorDashboard(store, actor, input = {}) {
  const vendorId = resolveVendorId(actor, input.vendorId);
  if (!canAccessOwnedRecord(actor, vendorId)) throw new Error("You cannot read this vendor's dashboard.");
  const lines = await store.db.prepare(`
    SELECT orders.status, order_items.unit_price_usd AS unitPriceUsd, order_items.quantity
    FROM order_items
    JOIN orders ON orders.id = order_items.order_id
    JOIN vendor_offers ON vendor_offers.id = order_items.vendor_offer_id
    WHERE vendor_offers.vendor_id = ?
  `).all(vendorId);
  const paidLineTotalUsd = lines.filter((line) => line.status === "paid")
    .reduce((sum, line) => sum + moneyUnits(line.unitPriceUsd) * BigInt(line.quantity), 0n);
  const payouts = await store.db.prepare("SELECT amount_usd FROM payouts WHERE vendor_id = ?").all(vendorId);
  const payoutTotalUsd = payouts.reduce((sum, payout) => sum + moneyUnits(payout.amount_usd), 0n);
  return {
    vendorId,
    incomingOrderLineCount: lines.length,
    paidOrderLineCount: lines.filter((line) => line.status === "paid").length,
    paidLineTotalUsd: moneyString(paidLineTotalUsd),
    payoutCount: payouts.length,
    payoutTotalUsd: moneyString(payoutTotalUsd),
  };
}
