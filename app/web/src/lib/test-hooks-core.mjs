import { timingSafeEqual } from "node:crypto";
import { normalizeEmail } from "./auth-core.mjs";
import { getOrderCommsEntry } from "./order-comms-outbox-core.mjs";

export const TEST_HOOK_SECRET_HEADER = "x-test-hook-secret";
export const TEST_HOOK_SECRET_MIN_LENGTH = 16;

function readHeader(headers, name) {
  if (!headers) return "";
  if (typeof headers.get === "function") return headers.get(name) || "";
  return headers[name] || headers[name.toLowerCase()] || "";
}

function secretsMatch(provided, expected) {
  if (typeof provided !== "string" || typeof expected !== "string") return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

/**
 * Local `next start` smokes only. Never on Vercel (Preview or Production),
 * even if TEST_HOOKS_ENABLED is accidentally set.
 */
export function testHooksEnabled(env = process.env) {
  if (env.VERCEL === "1" || env.VERCEL_ENV === "production") return false;
  if (env.TEST_HOOKS_ENABLED !== "1") return false;
  const secret = typeof env.TEST_HOOK_SECRET === "string" ? env.TEST_HOOK_SECRET.trim() : "";
  return secret.length >= TEST_HOOK_SECRET_MIN_LENGTH;
}

/**
 * @param {Headers | Record<string, string>} headers
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 * @returns {{ ok: true } | { ok: false, status: number, message: string }}
 */
export function authorizeTestHook(headers, env = process.env) {
  if (!testHooksEnabled(env)) {
    return { ok: false, status: 404, message: "Not found." };
  }
  const provided = readHeader(headers, TEST_HOOK_SECRET_HEADER);
  if (!secretsMatch(provided, env.TEST_HOOK_SECRET)) {
    return { ok: false, status: 401, message: "Unauthorized." };
  }
  return { ok: true };
}

/**
 * Read the plaintext identity.verify token from the leased outbox (hashed in users).
 * @returns {Promise<null | { email: string, token: string }>}
 */
export async function readIdentityVerifyHookToken(store, email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;
  const user = await store.db.prepare("SELECT id, email FROM users WHERE email = ?").get(normalizedEmail);
  if (!user) return null;
  const entry = await getOrderCommsEntry(store, user.id, { kind: "identity.verify" });
  const token = entry?.payload && typeof entry.payload === "object" ? entry.payload.token : null;
  if (typeof token !== "string" || token.length < 16) return null;
  return { email: user.email, token };
}
