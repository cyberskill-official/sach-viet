import { NextResponse } from "next/server";
import { bootstrapFirstAdmin, getAuthStore, login, safeRedirect } from "@/lib/auth-core.mjs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid login request." }, { status: 400 });
  const store = getAuthStore();
  try {
    bootstrapFirstAdmin(store);
    const result = login(store, { email: body.email, password: body.password, sessionSecret: process.env.AUTH_SESSION_SECRET });
    if (!("user" in result)) return NextResponse.json({ error: "Invalid email or password." }, { status: result.reason === "throttled" ? 429 : 401 });
    const response = NextResponse.json({ user: result.user, redirectTo: safeRedirect(body.redirect) });
    response.headers.append("Set-Cookie", result.cookie);
    return response;
  } catch {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }
}
