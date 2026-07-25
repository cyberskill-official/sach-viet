import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { openSqliteDatabase } from "./sqlite.mjs";
import { isKnownRole } from "./access.mjs";

const PHPASS_ITOA64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function encodePhpass64(input, count) {
  let output = "";
  let i = 0;
  do {
    let value = input[i++];
    output += PHPASS_ITOA64[value & 0x3f];
    if (i < count) value |= input[i] << 8;
    output += PHPASS_ITOA64[(value >> 6) & 0x3f];
    if (i++ >= count) break;
    if (i < count) value |= input[i] << 16;
    output += PHPASS_ITOA64[(value >> 12) & 0x3f];
    if (i++ >= count) break;
    output += PHPASS_ITOA64[(value >> 18) & 0x3f];
  } while (i < count);
  return output;
}

function cryptPhpassPrivate(password, setting) {
  const id = setting.slice(0, 3);
  if (id !== "$P$" && id !== "$H$") return "*0";
  const countLog2 = PHPASS_ITOA64.indexOf(setting[3]);
  if (countLog2 < 7 || countLog2 > 30) return "*0";
  const count = 1 << countLog2;
  const salt = setting.slice(4, 12);
  if (salt.length !== 8) return "*0";
  let hash = createHash("md5").update(Buffer.concat([Buffer.from(salt, "binary"), Buffer.from(password, "utf8")])).digest();
  for (let i = 0; i < count; i += 1) {
    hash = createHash("md5").update(Buffer.concat([hash, Buffer.from(password, "utf8")])).digest();
  }
  return setting.slice(0, 12) + encodePhpass64(hash, 16);
}

export function hashPhpassPassword(password, { countLog2 = 8, salt } = {}) {
  if (typeof password !== "string" || password.length < 1) {
    throw new Error("Password is required for PHPass hashing.");
  }
  const saltBytes = salt ? Buffer.from(String(salt).slice(0, 8), "utf8") : randomBytes(6);
  const encodedSalt = salt && String(salt).length === 8 ? String(salt) : encodePhpass64(saltBytes, 6).slice(0, 8);
  const setting = `$P$${PHPASS_ITOA64[countLog2]}${encodedSalt}`;
  return cryptPhpassPrivate(password, setting);
}

export function verifyPhpassPassword(password, storedHash) {
  if (typeof password !== "string" || typeof storedHash !== "string") return false;
  if (!storedHash.startsWith("$P$") && !storedHash.startsWith("$H$")) return false;
  const computed = cryptPhpassPrivate(password, storedHash);
  return computed.length === storedHash.length && constantTimeEqual(computed, storedHash);
}

const COOKIE_NAME = "sv_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
let cachedStore;

function defaultNow() {
  return Date.now();
}

function defaultLog(event, fields = {}) {
  console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-002", ...fields }));
}

function constantTimeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function requireSessionSecret(secret) {
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

export function normalizeEmail(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function hashPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must have at least 8 characters.");
  }
  const salt = randomBytes(16).toString("base64url");
  const digest = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${digest}`;
}

export function verifyPassword(password, storedHash) {
  if (typeof password !== "string" || typeof storedHash !== "string") return false;
  if (storedHash.startsWith("$P$") || storedHash.startsWith("$H$")) {
    return verifyPhpassPassword(password, storedHash);
  }
  const [algorithm, salt, expected] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const actual = scryptSync(password, salt, 64).toString("base64url");
  return constantTimeEqual(actual, expected);
}

export function ensureAuthLegacyColumns(store) {
  const columns = store.db.prepare("PRAGMA table_info(users)").all().map((row) => row.name);
  if (!columns.includes("legacy_wp_user_id")) {
    store.db.exec("ALTER TABLE users ADD COLUMN legacy_wp_user_id TEXT");
  }
  store.db.exec("CREATE UNIQUE INDEX IF NOT EXISTS users_legacy_wp_user_id_uq ON users(legacy_wp_user_id) WHERE legacy_wp_user_id IS NOT NULL");
}

export function createAuthStore({ dbPath, now = defaultNow, log = defaultLog } = {}) {
  const db = openSqliteDatabase(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS login_attempts (
      email TEXT PRIMARY KEY,
      failures INTEGER NOT NULL,
      window_started_at INTEGER NOT NULL,
      locked_until INTEGER NOT NULL
    ) STRICT;
  `);
  return { db, now, log, close: () => db.close() };
}

export function getAuthStore() {
  const path = process.env.DATABASE_PATH || "/data/sachviet.sqlite";
  if (!cachedStore || cachedStore.path !== path) {
    cachedStore?.store.close();
    cachedStore = { path, store: createAuthStore({ dbPath: path }) };
  }
  return cachedStore.store;
}

export function resetAuthStoreForTests() {
  cachedStore?.store.close();
  cachedStore = undefined;
}

export function bootstrapFirstAdmin(store, environment = process.env) {
  const email = normalizeEmail(environment.BOOTSTRAP_ADMIN_EMAIL);
  const passwordHash = environment.BOOTSTRAP_ADMIN_PASSWORD_HASH;
  const sessionSecret = environment.AUTH_SESSION_SECRET;
  if (!email || !passwordHash || !sessionSecret) return { created: false, reason: "not_configured" };
  requireSessionSecret(sessionSecret);
  const count = store.db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (count > 0) return { created: false, reason: "users_exist" };
  store.db.prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(randomBytes(16).toString("hex"), email, passwordHash, "admin", store.now());
  store.log("auth_bootstrap_completed", { result: "created" });
  return { created: true, reason: "created" };
}

function lockState(store, email) {
  const attempt = store.db.prepare("SELECT failures, window_started_at, locked_until FROM login_attempts WHERE email = ?").get(email);
  if (!attempt || attempt.locked_until <= store.now()) return null;
  return attempt;
}

function recordFailure(store, email) {
  const current = store.db.prepare("SELECT failures, window_started_at FROM login_attempts WHERE email = ?").get(email);
  const at = store.now();
  const failures = !current || at - current.window_started_at > LOGIN_WINDOW_MS ? 1 : current.failures + 1;
  const windowStartedAt = !current || at - current.window_started_at > LOGIN_WINDOW_MS ? at : current.window_started_at;
  const lockedUntil = failures >= MAX_LOGIN_FAILURES ? at + LOGIN_LOCK_MS : 0;
  store.db.prepare(`INSERT INTO login_attempts (email, failures, window_started_at, locked_until) VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET failures = excluded.failures, window_started_at = excluded.window_started_at, locked_until = excluded.locked_until`)
    .run(email, failures, windowStartedAt, lockedUntil);
  return lockedUntil > at;
}

function clearFailures(store, email) {
  store.db.prepare("DELETE FROM login_attempts WHERE email = ?").run(email);
}

export function createSessionCookie(store, user, sessionSecret) {
  const secret = requireSessionSecret(sessionSecret);
  const id = randomBytes(32).toString("base64url");
  const expiresAt = store.now() + SESSION_DURATION_MS;
  store.db.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .run(id, user.id, expiresAt, store.now());
  const signature = createHmac("sha256", secret).update(id).digest("base64url");
  const token = `${id}.${signature}`;
  return { token, expiresAt, cookie: serializeCookie(token, expiresAt, store.now()) };
}

export function serializeCookie(token, expiresAt, now = Date.now()) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.floor((expiresAt - now) / 1000))}${secure}`;
}

export function expiredCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function readSession(store, token, sessionSecret) {
  if (typeof token !== "string") return null;
  const [id, signature] = token.split(".");
  if (!id || !signature) return null;
  const expected = createHmac("sha256", requireSessionSecret(sessionSecret)).update(id).digest("base64url");
  if (!constantTimeEqual(signature, expected)) {
    store.log("auth_session_rejected", { reason: "signature", result: "rejected" });
    return null;
  }
  const session = store.db.prepare(`SELECT sessions.id, sessions.expires_at, users.id AS user_id, users.email, users.role
    FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id = ?`).get(id);
  if (!session) return null;
  if (session.expires_at <= store.now()) {
    store.db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
    store.log("auth_session_rejected", { reason: "expired", result: "rejected" });
    return null;
  }
  return { id, user: { id: session.user_id, email: session.email, role: session.role }, expiresAt: session.expires_at };
}

export function revokeSession(store, token, sessionSecret) {
  const session = readSession(store, token, sessionSecret);
  if (session) store.db.prepare("DELETE FROM sessions WHERE id = ?").run(session.id);
  store.log("auth_logout_completed", { result: session ? "revoked" : "noop" });
}

export function login(store, { email, password, sessionSecret }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || typeof password !== "string") return { ok: false, reason: "invalid" };
  if (lockState(store, normalizedEmail)) {
    store.log("auth_login_throttled", { result: "rejected" });
    return { ok: false, reason: "throttled" };
  }
  const user = store.db.prepare("SELECT id, email, password_hash, role FROM users WHERE email = ?").get(normalizedEmail);
  if (!user || !isKnownRole(user.role) || !verifyPassword(password, user.password_hash)) {
    const locked = recordFailure(store, normalizedEmail);
    store.log(locked ? "auth_login_throttled" : "auth_login_rejected", { reason: locked ? "threshold" : "credentials", result: "rejected" });
    return { ok: false, reason: locked ? "throttled" : "invalid" };
  }
  clearFailures(store, normalizedEmail);
  const session = createSessionCookie(store, user, sessionSecret);
  store.log("auth_login_succeeded", { role: user.role, result: "accepted" });
  return { ok: true, user: { id: user.id, email: user.email, role: user.role }, ...session };
}

export function safeRedirect(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export { COOKIE_NAME, LOGIN_LOCK_MS, MAX_LOGIN_FAILURES, SESSION_DURATION_MS };
