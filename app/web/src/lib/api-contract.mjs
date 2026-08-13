import { randomBytes } from "node:crypto";

export const API_ERROR_CODES = Object.freeze({
  unauthenticated: "unauthenticated",
  forbidden: "forbidden",
  not_found: "not_found",
  invalid_request: "invalid_request",
  conflict: "conflict",
  not_configured: "not_configured",
  timeout: "timeout",
  frozen: "frozen",
  internal: "internal",
});

export function createRequestId(request) {
  const header = request?.headers?.get?.("x-request-id");
  if (typeof header === "string" && /^[A-Za-z0-9._-]{8,128}$/.test(header.trim())) {
    return header.trim();
  }
  return randomBytes(8).toString("hex");
}

/**
 * @param {string} code
 * @param {string} message
 * @param {{ status?: number, requestId?: string, headers?: HeadersInit }} [options]
 */
export function jsonError(code, message, { status = 400, requestId, headers } = {}) {
  const id = requestId || randomBytes(8).toString("hex");
  return Response.json(
    { error: { code, message, requestId: id } },
    { status, headers },
  );
}

/**
 * @param {unknown[]} items
 * @param {string | null} [nextCursor]
 * @param {{ status?: number, extra?: Record<string, unknown> }} [options]
 */
export function jsonPage(items, nextCursor, { status = 200, extra } = {}) {
  return Response.json({ items, nextCursor: nextCursor ?? null, ...extra }, { status });
}

/**
 * @param {Record<string, unknown>} body
 * @param {{ status?: number }} [options]
 */
export function jsonOk(body, { status = 200 } = {}) {
  return Response.json(body, { status });
}

export function errorStatusForMessage(message, fallback = 400) {
  const text = typeof message === "string" ? message : "";
  if (/Unauthenticated|signed-in customer is required|Authentication is required/i.test(text)) return 401;
  if (/denied|Administrator|Vendor access|Employee access|Retail access|B2B staff|Institution access|Publisher access|Author access|Admin access|cannot write|cannot read|cannot change|cannot access another/i.test(text)) {
    return 403;
  }
  if (/does not exist|not found/i.test(text)) return 404;
  if (/already exists|already withdrawn|already has an order|already included/i.test(text)) return 409;
  if (/frozen|not configured|AUTH_SESSION_SECRET/i.test(text)) return 503;
  return fallback;
}

export function pageSlice(rows, limit) {
  const capped = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const hasMore = rows.length > capped;
  const items = hasMore ? rows.slice(0, capped) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;
  return { items, nextCursor, limit: capped };
}

export async function readJsonBody(request) {
  const body = await request.json().catch(() => null);
  return body && typeof body === "object" ? body : null;
}

export function sessionTokenFrom(request) {
  return request.headers.get("cookie")?.match(/(?:^|;\s*)sv_session=([^;]+)/)?.[1];
}
