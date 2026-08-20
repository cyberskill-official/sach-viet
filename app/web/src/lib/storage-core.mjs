import { createHash } from "node:crypto";
import { openDatabase } from "./db.mjs";
import { resolveStorageMode, STORAGE_MODES } from "./storage-backend.mjs";

function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function createStorageStore({ dbPath, clock = () => Date.now(), log = () => {}, env = process.env } = {}) {
  const mode = resolveStorageMode(env);
  if (mode === STORAGE_MODES.supabase) {
    // Scaffold only: Supabase object I/O is deferred to the dedicated PKG-08 package.
    // Refuse writes so Production cannot silently claim supabase mode without implementation.
    throw new Error("Supabase Storage backend is scaffolded but not enabled. Unset STORAGE_BACKEND or use postgres.");
  }
  const db = await openDatabase(dbPath);
  return { db, clock, log, mode, close: () => db.close() };
}

export async function putStoredObject(store, { bytes, contentType = "application/octet-stream", ownerId = null, key = null }) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (buffer.length < 1) throw new Error("Stored object cannot be empty.");
  if (buffer.length > 5 * 1024 * 1024) throw new Error("Stored object is too large.");
  const digest = sha256Hex(buffer);
  const objectKey = key || `sha256:${digest}`;
  if (objectKey.startsWith("http://") || objectKey.startsWith("https://")) {
    throw new Error("Storage key must not be a public URL.");
  }
  await store.db
    .prepare(
      `INSERT INTO stored_objects
         (key, content_type, byte_length, sha256, owner_id, body, created_at, backend, scan_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'postgres', 'unscanned')
       ON CONFLICT (key) DO NOTHING`,
    )
    .run(objectKey, contentType, buffer.length, digest, ownerId, buffer, store.clock());
  store.log?.("stored_object_put", { result: "accepted", key: objectKey, backend: "postgres" });
  return { key: objectKey, sha256: digest, byteLength: buffer.length, contentType, backend: "postgres" };
}

export async function requireStoredObjectKey(store, storageKey) {
  if (typeof storageKey !== "string" || storageKey.trim() === "") throw new Error("Storage key is required.");
  const key = storageKey.trim();
  if (key.startsWith("http://") || key.startsWith("https://")) {
    throw new Error("Storage key must not be a public URL.");
  }
  const row = await store.db.prepare("SELECT key FROM stored_objects WHERE key = ?").get(key);
  if (!row) throw new Error("Storage object does not exist.");
  return key;
}

export async function getStoredObject(store, key) {
  const row = await store.db
    .prepare("SELECT key, content_type AS contentType, byte_length AS byteLength, sha256, body FROM stored_objects WHERE key = ?")
    .get(key);
  if (!row) return null;
  return row;
}
