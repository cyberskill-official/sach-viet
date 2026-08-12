/**
 * Same-origin check for cookie-authenticated mutations (TASK-SEC-001).
 * Webhooks are excluded by the caller.
 */
export function isSameOriginRequest(request, { allowedOrigins = [] } = {}) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowed = new Set(
    [url.origin, ...allowedOrigins.filter((value) => typeof value === "string" && value.length > 0)].map((value) =>
      value.replace(/\/$/, ""),
    ),
  );
  if (origin) return allowed.has(origin.replace(/\/$/, ""));
  if (referer) {
    try {
      return allowed.has(new URL(referer).origin);
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
