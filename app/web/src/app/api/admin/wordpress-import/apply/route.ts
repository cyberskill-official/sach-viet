import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createCommerceStore } from "@/lib/commerce-core.mjs";
import { applyWordpressImportAsAdmin } from "@/lib/wordpress-import-core.mjs";
import { commerceMutationsDisabledMessage, commerceMutationsEnabled } from "@/lib/commerce-kill-switch.mjs";
import { assertNotProductionRetired } from "@/lib/production-retirement.mjs";

export async function POST(request: Request) {
  try {
    assertNotProductionRetired("WordPress import apply");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "WordPress import apply is retired on Production." },
      { status: 410 },
    );
  }
  if (!commerceMutationsEnabled()) {
    return NextResponse.json({ error: commerceMutationsDisabledMessage() }, { status: 503 });
  }
  const commerce = await createCommerceStore();
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const mode = body?.mode === "dry_run" ? "dry_run" : "apply";
    const result = await applyWordpressImportAsAdmin(await getAuthStore(), commerce, auth.user, body?.fixture, { mode });
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "WordPress import apply failed." },
      { status: error instanceof Error && error.message.includes("Admin") ? 403 : 400 },
    );
  } finally {
    await commerce.close();
  }
}
