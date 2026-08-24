import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    // Anonymous session probe returns 200 + null user (avoids noisy 401s in DevTools).
    return NextResponse.json({ user: session?.user ?? null });
  } catch {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }
}
