import { NextResponse } from "next/server";
import { clearSessionCookieOptions, COOKIE_NAME, getAuthStore, revokeSession } from "@/lib/auth-core.mjs";

export async function POST(request: Request) {
  try {
    await revokeSession(
      await getAuthStore(),
      request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1],
      process.env.AUTH_SESSION_SECRET,
    );
  } catch {
    /* still clear cookie */
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", clearSessionCookieOptions());
  return response;
}
