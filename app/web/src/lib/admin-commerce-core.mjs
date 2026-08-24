import { randomBytes } from "node:crypto";
import { beginImmediateWithRetry, isUniqueViolationError, openDatabase } from "./db.mjs";
import { assertPermission, normalizeRole } from "./access.mjs";

const identifier = () => randomBytes(16).toString("hex");
const required = (value, label) => { if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`); return value.trim(); };
const adminOnly = (user) => { assertPermission(user, "admin.vendors.review", "Administrator access is required."); };

function moneyUnits(value) { const [whole, fraction = ""] = value.split("."); return BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0")); }
function moneyString(value) { return `${value / 10000n}.${String(value % 10000n).padStart(4, "0")}`; }

export async function createAdminCommerceStore({ dbPath, clock = () => Date.now(), log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-007", ...fields })) } = {}) {
  const db = await openDatabase(dbPath);
  return { db, clock, log, close: () => db.close() };
}

export async function submitVendorApplication(store, user) {
  if (!user?.id || normalizeRole(user.role) !== "customer") throw new Error("Only signed-in customers can submit a vendor application.");
  const application = { id: identifier(), userId: user.id, status: "pending" };
  try {
    await store.db.prepare("INSERT INTO vendor_applications (id, user_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(application.id, application.userId, application.status, store.clock(), store.clock());
  } catch (error) {
    if (isUniqueViolationError(error)) throw new Error("A vendor application already exists for this user.");
    throw error;
  }
  store.log("vendor_application_submitted", { result: "accepted", vendor_application_id: application.id });
  return application;
}

export async function listVendorApplications(store, actor) {
  adminOnly(actor);
  return await store.db.prepare("SELECT id, user_id AS userId, status, rejection_reason AS rejectionReason, created_at AS createdAt, updated_at AS updatedAt FROM vendor_applications ORDER BY created_at DESC, id DESC").all();
}

export async function resolveVendorApplication(store, actor, input) {
  adminOnly(actor);
  const applicationId = required(input?.applicationId, "Vendor application ID");
  const decision = required(input?.decision, "Vendor application decision");
  if (!["approved", "rejected"].includes(decision)) throw new Error("Vendor application decision must be approved or rejected.");
  const rejectionReason = decision === "rejected" ? required(input?.rejectionReason, "Rejection reason") : null;
  const application = await store.db.prepare("SELECT id, user_id, status FROM vendor_applications WHERE id = ?").get(applicationId);
  if (!application || application.status !== "pending") throw new Error("Only a pending vendor application can be resolved.");
  await beginImmediateWithRetry(store.db);
  try {
    if (decision === "approved") {
      const user = await store.db.prepare("SELECT role FROM users WHERE id = ?").get(application.user_id);
      if (!user || normalizeRole(user.role) !== "customer") throw new Error("Vendor applicant is not an eligible customer.");
      await store.db.prepare("UPDATE users SET role = 'vendor' WHERE id = ?").run(application.user_id);
    }
    await store.db.prepare("UPDATE vendor_applications SET status = ?, rejection_reason = ?, updated_at = ? WHERE id = ? AND status = 'pending'").run(decision, rejectionReason, store.clock(), application.id);
    await store.db.exec("COMMIT");
  } catch (error) {
    await store.db.exec("ROLLBACK");
    throw error;
  }
  store.log("vendor_application_resolved", { result: "accepted", vendor_application_id: application.id, decision });
  return { id: application.id, userId: application.user_id, status: decision, rejectionReason };
}

export async function getAdminCommerceDashboard(store, actor) {
  adminOnly(actor);
  const totals = await store.db.prepare("SELECT COUNT(*) AS order_count, SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_order_count FROM orders").get();
  const paidOrders = await store.db.prepare("SELECT subtotal_usd FROM orders WHERE status = 'paid'").all();
  const paidRevenueUsd = paidOrders.reduce((sum, order) => sum + moneyUnits(order.subtotal_usd), 0n);
  const orders = await store.db.prepare("SELECT id, status, currency, subtotal_usd AS subtotalUsd, created_at AS createdAt FROM orders ORDER BY created_at DESC, id DESC LIMIT 20").all();
  return { orderCount: Number(totals.order_count), paidOrderCount: Number(totals.paid_order_count), paidRevenueUsd: moneyString(paidRevenueUsd), recentOrders: orders };
}
