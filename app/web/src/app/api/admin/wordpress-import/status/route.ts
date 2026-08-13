import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { getWordpressImportStatus } from "@/lib/wordpress-import-core.mjs";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    return NextResponse.json({ status: await getWordpressImportStatus(await getAuthStore(), session.user) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "WordPress import status is unavailable." },
      { status: 403 },
    );
  }
}
