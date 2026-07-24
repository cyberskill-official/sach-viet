import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createCommerceStore } from "@/lib/commerce-core.mjs";
import { applyWordpressImportAsAdmin } from "@/lib/wordpress-import-core.mjs";

export async function POST(request: Request) {
  const commerce = createCommerceStore();
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const body = await request.json();
    const mode = body?.mode === "dry_run" ? "dry_run" : "apply";
    const result = applyWordpressImportAsAdmin(getAuthStore(), commerce, session.user, body?.fixture, { mode });
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "WordPress import apply failed." },
      { status: error instanceof Error && error.message.includes("Admin") ? 403 : 400 },
    );
  } finally {
    commerce.close();
  }
}
