import { NextResponse } from "next/server";
import { COOKIE_NAME, expiredCookie, getAuthStore, revokeSession } from "@/lib/auth-core.mjs";

export async function POST(request: Request) {
  try {
    await revokeSession(await getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
  } catch {}
  const response = NextResponse.json({ ok: true });
  response.headers.append("Set-Cookie", expiredCookie());
  return response;
}
