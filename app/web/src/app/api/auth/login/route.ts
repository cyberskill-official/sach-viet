import { NextResponse } from "next/server";
import { bootstrapFirstAdmin, getAuthStore, login, safeRedirect } from "@/lib/auth-core.mjs";

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
  const store = getAuthStore();
  try {
    bootstrapFirstAdmin(store);
    const result = login(store, {
      email: body.email,
      password: body.password,
      sessionSecret: process.env.AUTH_SESSION_SECRET,
      clientKey: clientKeyFromRequest(request),
    });
    if (!("user" in result)) {
      const response = NextResponse.json(
        { error: "Invalid email or password." },
        { status: result.reason === "throttled" ? 429 : 401 },
      );
      if (typeof result.retryAfterMs === "number" && result.retryAfterMs > 0) {
        response.headers.set("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
      }
      return response;
    }
    const response = NextResponse.json({ user: result.user, redirectTo: safeRedirect(body.redirect) });
    response.headers.append("Set-Cookie", result.cookie);
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
