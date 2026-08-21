import { randomBytes } from "node:crypto";
import { openDatabase } from "./db.mjs";
import { hashPassword, normalizeEmail, verifyPassword } from "./auth-core.mjs";
import { normalizeLocale } from "./web-foundations.mjs";

const identifier = () => randomBytes(16).toString("hex");
const required = (value, name) => {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${name} is required.`);
  return value.trim();
};

function normalizeAccountCountry(value) {
  const country = typeof value === "string" && value.trim() ? value.trim().toUpperCase() : "US";
  if (country !== "US" && country !== "VN") {
    throw new Error("Address country must be US or VN under interim DEC-COM-001.");
  }
  return country;
}

function requireUser(user) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  return user;
}

export async function createAccountStore({
  dbPath,
  now = () => Date.now(),
  log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-UI-002", ...fields })),
} = {}) {
  const db = await openDatabase(dbPath);
  return { db, now, log, close: () => db.close() };
}

export async function getAccount(store, user) {
  requireUser(user);
  const row = await store.db
    .prepare("SELECT id, email, role, locale, created_at AS createdAt FROM users WHERE id = ?")
    .get(user.id);
  if (!row) throw new Error("Account does not exist.");
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    locale: normalizeLocale(row.locale),
    createdAt: row.createdAt,
  };
}

export async function updateAccount(store, user, input = {}) {
  requireUser(user);
  const current = await getAccount(store, user);
  let email = current.email;
  let locale = current.locale;
  if (input.email !== undefined) {
    const normalized = normalizeEmail(input.email);
    if (!normalized) throw new Error("A valid email is required.");
    const taken = await store.db.prepare("SELECT id FROM users WHERE email = ? AND id <> ?").get(normalized, user.id);
    if (taken) throw new Error("An account with this email already exists.");
    email = normalized;
  }
  if (input.locale !== undefined) {
    locale = normalizeLocale(input.locale);
    if (input.locale && input.locale !== locale && input.locale !== "vi" && input.locale !== "en") {
      throw new Error("Locale must be vi or en.");
    }
  }
  await store.db.prepare("UPDATE users SET email = ?, locale = ? WHERE id = ?").run(email, locale, user.id);
  store.log("account_updated", { result: "accepted" });
  return { id: user.id, email, role: current.role, locale, createdAt: current.createdAt };
}

export async function changeAccountPassword(store, user, input = {}) {
  requireUser(user);
  const currentPassword = required(input.currentPassword, "Current password");
  const nextPassword = required(input.password, "Password");
  const row = await store.db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id);
  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    throw new Error("Current password is incorrect.");
  }
  await store.db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(nextPassword), user.id);
  store.log("account_password_changed", { result: "accepted" });
  return { ok: true };
}

export async function listAddresses(store, user, { after, limit = 24 } = {}) {
  requireUser(user);
  const capped = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const clauses = ["user_id = ?"];
  const params = [user.id];
  if (after) {
    const cursor = await store.db
      .prepare("SELECT created_at AS createdAt, id FROM user_addresses WHERE id = ? AND user_id = ?")
      .get(after, user.id);
    if (cursor) {
      clauses.push("(created_at, id) < (?, ?)");
      params.push(cursor.createdAt, cursor.id);
    }
  }
  const rows = await store.db
    .prepare(
      `SELECT id, user_id AS userId, label, line1, line2, city, region, postal_code AS postalCode,
              country, created_at AS createdAt, updated_at AS updatedAt
       FROM user_addresses
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
    )
    .all(...params, capped + 1);
  const hasMore = rows.length > capped;
  const items = hasMore ? rows.slice(0, capped) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

export async function createAddress(store, user, input = {}) {
  requireUser(user);
  const address = {
    id: identifier(),
    userId: user.id,
    label: required(input.label, "Address label"),
    line1: required(input.line1, "Address line"),
    line2: typeof input.line2 === "string" && input.line2.trim() ? input.line2.trim() : null,
    city: required(input.city, "City"),
    region: typeof input.region === "string" && input.region.trim() ? input.region.trim() : null,
    postalCode: typeof input.postalCode === "string" && input.postalCode.trim() ? input.postalCode.trim() : null,
    country: normalizeAccountCountry(input.country),
    createdAt: store.now(),
    updatedAt: store.now(),
  };
  await store.db
    .prepare(
      `INSERT INTO user_addresses
        (id, user_id, label, line1, line2, city, region, postal_code, country, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      address.id,
      address.userId,
      address.label,
      address.line1,
      address.line2,
      address.city,
      address.region,
      address.postalCode,
      address.country,
      address.createdAt,
      address.updatedAt,
    );
  store.log("account_address_created", { result: "accepted" });
  return address;
}

export async function deleteAddress(store, user, addressId) {
  requireUser(user);
  const id = required(addressId, "Address ID");
  const existing = await store.db.prepare("SELECT id FROM user_addresses WHERE id = ? AND user_id = ?").get(id, user.id);
  if (!existing) throw new Error("Address does not exist.");
  await store.db.prepare("DELETE FROM user_addresses WHERE id = ? AND user_id = ?").run(id, user.id);
  store.log("account_address_deleted", { result: "accepted" });
  return { ok: true, id };
}
