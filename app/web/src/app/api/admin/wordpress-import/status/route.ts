import { NextResponse } from "next/server";
import { getAuthStore } from "@/lib/auth-core.mjs";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { getWordpressImportStatus } from "@/lib/wordpress-import-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    return NextResponse.json({ status: await getWordpressImportStatus(await getAuthStore(), auth.user) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "WordPress import status is unavailable." },
      { status: 403 },
    );
  }
}
