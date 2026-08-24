/**
 * Shared HTTP authorization helpers for Route Handlers.
 * Prefer these over ad-hoc readSession + role string compares.
 */
import { COOKIE_NAME, getAuthStore, readSession } from "./auth-core.mjs";
import {
  API_ERROR_CODES,
  createRequestId,
  jsonError,
  sessionTokenFrom,
} from "./api-contract.mjs";
import {
  assertPermission,
  can,
  permissionForApiPath,
} from "./access.mjs";

function tokenFrom(request) {
  return (
    sessionTokenFrom(request) ||
    request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1] ||
    undefined
  );
}

/**
 * @param {Request} request
 * @returns {Promise<{ ok: true, session: object, user: object, requestId: string } | { ok: false, response: Response }>}
 */
export async function requireSession(request) {
  const requestId = createRequestId(request);
  try {
    const session = await readSession(await getAuthStore(), tokenFrom(request), process.env.AUTH_SESSION_SECRET);
    if (!session?.user) {
      return {
        ok: false,
        response: jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId }),
      };
    }
    return { ok: true, session, user: session.user, requestId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication is not configured.";
    if (/not configured|AUTH_SESSION_SECRET/i.test(message)) {
      return {
        ok: false,
        response: jsonError(API_ERROR_CODES.not_configured, "Authentication is not configured.", {
          status: 503,
          requestId,
        }),
      };
    }
    return {
      ok: false,
      response: jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId }),
    };
  }
}

/**
 * @param {Request} request
 * @param {string} permission
 * @param {{ message?: string }} [options]
 */
export async function requirePermission(request, permission, options = {}) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth;
  if (!can(auth.user, permission)) {
    return {
      ok: false,
      response: jsonError(
        API_ERROR_CODES.forbidden,
        options.message || "Access denied.",
        { status: 403, requestId: auth.requestId },
      ),
    };
  }
  return auth;
}

/**
 * Resolve permission from the request URL + method, then enforce it.
 * @param {Request} request
 * @param {{ permission?: string, message?: string }} [options]
 */
export async function requireApiPermission(request, options = {}) {
  const url = new URL(request.url);
  const permission = options.permission || permissionForApiPath(url.pathname, request.method);
  if (!permission) {
    return requireSession(request);
  }
  return requirePermission(request, permission, { message: options.message });
}

/**
 * Domain-core friendly throw helper (re-export shape).
 * @param {{ role?: string, id?: string } | null | undefined} user
 * @param {string} permission
 * @param {string} [message]
 */
export function requirePermissionOrThrow(user, permission, message) {
  return assertPermission(user, permission, message);
}
