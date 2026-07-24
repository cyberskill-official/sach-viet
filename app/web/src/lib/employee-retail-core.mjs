import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { canAccessPortal, normalizeRole } from "./access.mjs";

const identifier = () => randomBytes(16).toString("hex");
const required = (value, label) => {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`);
  return value.trim();
};

function employeeActor(user) {
  if (!user?.id) throw new Error("Authentication is required.");
  if (!canAccessPortal(user.role, "employee")) throw new Error("Employee access is required.");
  return normalizeRole(user.role);
}

function retailActor(user) {
  if (!user?.id) throw new Error("Authentication is required.");
  if (!canAccessPortal(user.role, "retail")) throw new Error("Retail access is required.");
  return normalizeRole(user.role);
}

function homeConfigActor(user) {
  employeeActor(user);
}

function tableExists(db, name) {
  return Boolean(db.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?").get(name));
}

function countRows(db, table, whereSql = "", params = []) {
  if (!tableExists(db, table)) return 0;
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}${whereSql ? ` WHERE ${whereSql}` : ""}`).get(...params);
  return Number(row?.count || 0);
}

export function createEmployeeRetailStore({
  dbPath,
  clock = () => Date.now(),
  log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-009", ...fields })),
} = {}) {
  const path = dbPath || process.env.DATABASE_PATH || "/data/sachviet.sqlite";
  if (!existsSync(dirname(path))) mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS home_sections (
      id TEXT PRIMARY KEY,
      section_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL CHECK (is_enabled IN (0, 1)),
      updated_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS home_sections_sort_idx ON home_sections(sort_order ASC, section_key ASC);
  `);
  return { db, clock, log, close: () => db.close() };
}

export function getEmployeeDashboard(store, actor) {
  employeeActor(actor);
  const pendingApplications = tableExists(store.db, "vendor_applications")
    ? store.db.prepare(`
        SELECT id, user_id AS userId, status, created_at AS createdAt, updated_at AS updatedAt
        FROM vendor_applications
        WHERE status = 'pending'
        ORDER BY created_at DESC, id DESC
      `).all()
    : [];
  return {
    orderCount: countRows(store.db, "orders"),
    paidOrderCount: countRows(store.db, "orders", "status = ?", ["paid"]),
    openTicketCount: countRows(store.db, "support_tickets", "status = ?", ["open"]),
    openGoodsRequestCount: countRows(store.db, "goods_requests", "status = ?", ["open"]),
    pendingVendorApplicationCount: pendingApplications.length,
    approvalQueue: pendingApplications,
  };
}

export function listHomeSections(store, actor) {
  homeConfigActor(actor);
  return store.db.prepare(`
    SELECT id, section_key AS sectionKey, title, body, sort_order AS sortOrder,
           is_enabled AS isEnabled, updated_by AS updatedBy, created_at AS createdAt, updated_at AS updatedAt
    FROM home_sections
    ORDER BY sort_order ASC, section_key ASC
  `).all().map((row) => ({ ...row, isEnabled: row.isEnabled === 1 }));
}

export function upsertHomeSection(store, actor, input) {
  homeConfigActor(actor);
  const sectionKey = required(input?.sectionKey, "Section key");
  if (!/^[a-z][a-z0-9_]{1,63}$/.test(sectionKey)) throw new Error("Section key must be a lowercase snake_case identifier.");
  const title = required(input?.title, "Section title");
  const body = typeof input?.body === "string" ? input.body : "";
  if (body.length > 4000) throw new Error("Section body is too long.");
  const sortOrder = Number.isInteger(input?.sortOrder) ? input.sortOrder : 0;
  const isEnabled = input?.isEnabled === false ? 0 : 1;
  const existing = store.db.prepare("SELECT id, created_at FROM home_sections WHERE section_key = ?").get(sectionKey);
  const timestamp = store.clock();
  if (existing) {
    store.db.prepare(`
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
  store.db.prepare(`
    INSERT INTO home_sections (id, section_key, title, body, sort_order, is_enabled, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(section.id, section.sectionKey, section.title, section.body, section.sortOrder, isEnabled, section.updatedBy, section.createdAt, section.updatedAt);
  store.log("home_section_created", { result: "accepted", section_id: section.id, section_key: section.sectionKey });
  return section;
}

export function listRetailOrders(store, actor) {
  retailActor(actor);
  if (!tableExists(store.db, "orders")) return [];
  return store.db.prepare(`
    SELECT id, status, currency, subtotal_usd AS subtotalUsd, created_at AS createdAt, updated_at AS updatedAt
    FROM orders
    ORDER BY created_at DESC, id DESC
  `).all();
}
