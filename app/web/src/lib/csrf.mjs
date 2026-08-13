/**
 * Same-origin check for cookie-authenticated mutations (TASK-SEC-001).
 * Webhooks are excluded by the caller.
 * Loopback aliases (127.0.0.1 ↔ localhost) match so local `next start` smokes
 * work when Next.js reports one host and the browser Origin uses the other.
 */
function canonicalOrigin(value) {
  const url = new URL(value);
  if (url.hostname === "127.0.0.1") url.hostname = "localhost";
  return url.origin.replace(/\/$/, "");
}

export function isSameOriginRequest(request, { allowedOrigins = [] } = {}) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowed = new Set(
    [url.origin, ...allowedOrigins.filter((value) => typeof value === "string" && value.length > 0)].map(canonicalOrigin),
  );
  if (origin) {
    try {
      return allowed.has(canonicalOrigin(origin));
    } catch {
      return false;
    }
  }
  if (referer) {
    try {
      return allowed.has(canonicalOrigin(referer));
    } catch {
      return false;
    }
  }
  // Non-browser clients (tests, curl) omit Origin/Referer. Allow when neither is present.
  return true;
}

export function rejectCrossOrigin(request) {
  if (isSameOriginRequest(request)) return null;
  return { error: "Invalid origin.", status: 403 };
}
