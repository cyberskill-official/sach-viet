import { randomBytes } from "node:crypto";
import { normalizeRole } from "./access.mjs";
import { ensureAuthLegacyColumns, normalizeEmail } from "./auth-core.mjs";
import { ensureCommerceLegacyColumns } from "./commerce-core.mjs";
import { beginImmediateWithRetry } from "./db.mjs";

function identifier() {
  return randomBytes(16).toString("hex");
}

function defaultLog(event, fields = {}) {
  console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-021", ...fields }));
}

function requireAdmin(actor) {
  if (normalizeRole(actor?.role) !== "admin") {
    throw new Error("Admin access is required.");
  }
}

function normalizeMoney(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(4);
  }
  if (typeof value !== "string" || value.trim() === "") return null;
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,4})?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  return `${whole}.${fraction.padEnd(4, "0")}`;
}

function isPhpassHash(value) {
  return typeof value === "string" && (value.startsWith("$P$") || value.startsWith("$H$")) && value.length >= 34;
}

/** No-op: wordpress_import_runs and wordpress_import_outcomes schema is applied by the initial migration. */
export function ensureWordpressImportRunSchema() {}

export function ensureWordpressImportSchema(authStore, commerceStore) {
  ensureAuthLegacyColumns(authStore);
  ensureCommerceLegacyColumns(commerceStore);
  ensureWordpressImportRunSchema(authStore);
}

export function validateWordpressImportFixture(fixture) {
  if (!fixture || typeof fixture !== "object") throw new Error("Import fixture is required.");
  const users = Array.isArray(fixture.users) ? fixture.users : [];
  const orders = Array.isArray(fixture.orders) ? fixture.orders : [];
  for (const user of users) {
    if (!user?.legacyWpUserId || !normalizeEmail(user.email) || !isPhpassHash(user.passwordHash)) {
      throw new Error("Each fixture user requires legacyWpUserId, email, and a PHPass passwordHash.");
    }
  }
  for (const order of orders) {
    if (!order?.legacyWpOrderId || !normalizeEmail(order.billingEmail) || !normalizeMoney(order.totalUsd)) {
      throw new Error("Each fixture order requires legacyWpOrderId, billingEmail, and totalUsd.");
    }
    if (!Array.isArray(order.items) || order.items.length === 0) {
      throw new Error("Each fixture order requires at least one item.");
    }
  }
  return { users, orders };
}

function recordOutcome(db, runId, entityType, legacyId, outcome, reason, createdAt) {
  db.prepare(
    `INSERT INTO wordpress_import_outcomes
      (id, run_id, entity_type, legacy_id, outcome, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(identifier(), runId, entityType, legacyId || null, outcome, reason || null, createdAt);
}

function importUser(authStore, user, mode, runId, counts, createdAt, pendingUsers) {
  const email = normalizeEmail(user.email);
  const legacyId = String(user.legacyWpUserId);
  const existingLegacy = authStore.db
    .prepare("SELECT id FROM users WHERE legacy_wp_user_id = ?")
    .get(legacyId);
  if (existingLegacy) {
    counts.skipped += 1;
    recordOutcome(authStore.db, runId, "user", legacyId, "skipped_duplicate", "legacy_wp_user_id", createdAt);
    pendingUsers.set(email, existingLegacy.id);
    return;
  }
  const existingEmail = authStore.db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existingEmail) {
    counts.rejected += 1;
    recordOutcome(authStore.db, runId, "user", legacyId, "rejected", "email_exists", createdAt);
    return;
  }
  const userId = identifier();
  if (mode === "apply") {
    const role = user.role === "admin" || user.role === "customer" || user.role === "vendor" ? user.role : "customer";
    authStore.db
      .prepare(
        "INSERT INTO users (id, email, password_hash, role, created_at, legacy_wp_user_id) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(userId, email, user.passwordHash, role, createdAt, legacyId);
  }
  pendingUsers.set(email, userId);
  counts.accepted += 1;
  recordOutcome(authStore.db, runId, "user", legacyId, "accepted", mode, createdAt);
}

function importOrder(authStore, commerceStore, order, mode, runId, counts, createdAt, pendingUsers) {
  const legacyId = String(order.legacyWpOrderId);
  const existing = commerceStore.db
    .prepare("SELECT id FROM orders WHERE legacy_wp_order_id = ?")
    .get(legacyId);
  if (existing) {
    counts.skipped += 1;
    recordOutcome(authStore.db, runId, "order", legacyId, "skipped_duplicate", "legacy_wp_order_id", createdAt);
    return;
  }
  const email = normalizeEmail(order.billingEmail);
  const totalUsd = normalizeMoney(order.totalUsd);
  const persisted = email ? authStore.db.prepare("SELECT id FROM users WHERE email = ?").get(email) : null;
  const userId = persisted?.id || pendingUsers.get(email);
  if (!userId || !totalUsd) {
    counts.unmatched += 1;
    recordOutcome(
      authStore.db,
      runId,
      "order",
      legacyId,
      "unmatched",
      userId ? "invalid_total" : "billing_email_unresolved",
      createdAt,
    );
    return;
  }
  if (mode === "apply") {
    const orderId = identifier();
    beginImmediateWithRetry(commerceStore.db);
    try {
      commerceStore.db
        .prepare(
          `INSERT INTO orders
            (id, user_id, status, currency, subtotal_usd, created_at, updated_at, legacy_wp_order_id)
           VALUES (?, ?, 'paid', 'USD', ?, ?, ?, ?)`,
        )
        .run(orderId, userId, totalUsd, createdAt, createdAt, legacyId);
      const insertItem = commerceStore.db.prepare(
        `INSERT INTO order_items
          (id, order_id, product_id, vendor_offer_id, title, unit_price_usd, quantity, plastic_cover, gift_wrap, legacy_wp_order_item_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
      );
      for (const item of order.items) {
        const unitPrice = normalizeMoney(item.unitPriceUsd) || "0.0000";
        const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
        const itemLegacy = item.legacyWpOrderItemId ? String(item.legacyWpOrderItemId) : null;
        insertItem.run(
          identifier(),
          orderId,
          item.productId ? String(item.productId) : `legacy:product:${legacyId}`,
          item.vendorOfferId ? String(item.vendorOfferId) : `legacy:offer:${legacyId}`,
          typeof item.title === "string" && item.title.trim() ? item.title.trim() : "Imported item",
          unitPrice,
          quantity,
          itemLegacy,
        );
      }
      commerceStore.db.exec("COMMIT");
    } catch (error) {
      commerceStore.db.exec("ROLLBACK");
      throw error;
    }
  }
  counts.accepted += 1;
  recordOutcome(authStore.db, runId, "order", legacyId, "accepted", mode, createdAt);
}

export function importWordpressFixture(authStore, commerceStore, fixture, { mode = "dry_run", log = defaultLog } = {}) {
  if (mode !== "dry_run" && mode !== "apply") throw new Error("Import mode must be dry_run or apply.");
  ensureWordpressImportSchema(authStore, commerceStore);
  const { users, orders } = validateWordpressImportFixture(fixture);
  const createdAt = authStore.now ? authStore.now() : Date.now();
  const runId = identifier();
  const counts = { accepted: 0, skipped: 0, unmatched: 0, rejected: 0 };
  const pendingUsers = new Map();
  log("wordpress_import_run_started", { result: "started", mode, run_id: runId });
  authStore.db
    .prepare(
      `INSERT INTO wordpress_import_runs
        (id, mode, accepted_count, skipped_count, unmatched_count, rejected_count, created_at)
       VALUES (?, ?, 0, 0, 0, 0, ?)`,
    )
    .run(runId, mode, createdAt);

  for (const user of users) importUser(authStore, user, mode, runId, counts, createdAt, pendingUsers);
  for (const order of orders) importOrder(authStore, commerceStore, order, mode, runId, counts, createdAt, pendingUsers);

  authStore.db
    .prepare(
      `UPDATE wordpress_import_runs
       SET accepted_count = ?, skipped_count = ?, unmatched_count = ?, rejected_count = ?
       WHERE id = ?`,
    )
    .run(counts.accepted, counts.skipped, counts.unmatched, counts.rejected, runId);

  log("wordpress_import_run_completed", {
    result: "completed",
    mode,
    run_id: runId,
    accepted_count: counts.accepted,
    skipped_count: counts.skipped,
    unmatched_count: counts.unmatched,
    rejected_count: counts.rejected,
  });

  return {
    runId,
    mode,
    acceptedCount: counts.accepted,
    skippedCount: counts.skipped,
    unmatchedCount: counts.unmatched,
    rejectedCount: counts.rejected,
  };
}

export function getWordpressImportStatus(authStore, actor) {
  requireAdmin(actor);
  ensureWordpressImportRunSchema(authStore);
  const runs = authStore.db
    .prepare(
      `SELECT id, mode, accepted_count AS acceptedCount, skipped_count AS skippedCount,
              unmatched_count AS unmatchedCount, rejected_count AS rejectedCount, created_at AS createdAt
       FROM wordpress_import_runs
       ORDER BY created_at DESC
       LIMIT 20`,
    )
    .all();
  return {
    adapter: "fixture",
    runtime: "none",
    mysqlClient: false,
    wordpressPhpRuntime: false,
    recentRuns: runs,
  };
}

export function applyWordpressImportAsAdmin(authStore, commerceStore, actor, fixture, { mode = "apply", log = defaultLog } = {}) {
  requireAdmin(actor);
  return importWordpressFixture(authStore, commerceStore, fixture, { mode, log });
}

export function listWordpressImportOutcomes(authStore, runId) {
  return authStore.db
    .prepare(
      `SELECT id, run_id AS runId, entity_type AS entityType, legacy_id AS legacyId,
              outcome, reason, created_at AS createdAt
       FROM wordpress_import_outcomes
       WHERE run_id = ?
       ORDER BY created_at ASC`,
    )
    .all(runId);
}
