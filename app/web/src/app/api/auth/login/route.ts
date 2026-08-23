import { NextResponse } from "next/server";
import { defaultHomeForRole } from "@/lib/access.mjs";
import {
  bootstrapFirstAdmin,
  COOKIE_NAME,
  getAuthStore,
  login,
  safeRedirect,
  sessionCookieOptions,
  syncAdminEmailFromEnv,
  syncAdminPasswordFromEnv,
} from "@/lib/auth-core.mjs";

function clientKeyFromRequest(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid login request." }, { status: 400 });
  const store = await getAuthStore();
  try {
    await bootstrapFirstAdmin(store);
    await syncAdminEmailFromEnv(store);
    await syncAdminPasswordFromEnv(store);
    const result = await login(store, {
      email: body.email,
      password: body.password,
      sessionSecret: process.env.AUTH_SESSION_SECRET,
      clientKey: clientKeyFromRequest(request),
    });
    if (!("user" in result)) {
      const message =
        result.reason === "unverified" ? "Email is not verified." : "Invalid email or password.";
      const response = NextResponse.json(
        { error: message },
        { status: result.reason === "throttled" ? 429 : result.reason === "unverified" ? 403 : 401 },
      );
      if (typeof result.retryAfterMs === "number" && result.retryAfterMs > 0) {
        response.headers.set("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
      }
      return response;
    }
    const requested = safeRedirect(body.redirect);
    const redirectTo = requested === "/" ? defaultHomeForRole(result.user.role) : requested;
    const response = NextResponse.json({ user: result.user, redirectTo });
    response.cookies.set(COOKIE_NAME, result.token, sessionCookieOptions(result.expiresAt));
    return response;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "auth_login_failed",
        result: "failed",
        reason: error instanceof Error ? error.message : "auth_not_configured",
      }),
    );
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }
}
