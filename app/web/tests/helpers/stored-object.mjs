import { putStoredObject } from "../../src/lib/storage-core.mjs";

export async function seedStoredKey(store, key, body = "fixture-bytes") {
  return putStoredObject(store, {
    key,
    bytes: Buffer.from(body),
    contentType: "application/octet-stream",
    ownerId: "fixture",
  });
}
