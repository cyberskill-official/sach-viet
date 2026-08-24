import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createAuthorPortalStore, getAuthorDashboard } from "@/lib/author-portal-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const authorId = new URL(request.url).searchParams.get("authorId") || undefined;
    const store = await createAuthorPortalStore();
    try {
      return NextResponse.json({ dashboard: await getAuthorDashboard(store, auth.user, { authorId }) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Author dashboard is unavailable." },
      { status: 403 },
    );
  }
}
