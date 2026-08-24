import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createAuthorPortalStore, getAuthorManuscriptRequest } from "@/lib/author-portal-core.mjs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const authorId = new URL(request.url).searchParams.get("authorId") || undefined;
    const store = await createAuthorPortalStore();
    try {
      return NextResponse.json({
        manuscriptRequest: await getAuthorManuscriptRequest(store, auth.user, {
          requestId: id,
          authorId,
        }),
      });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Manuscript request is unavailable." },
      { status: 403 },
    );
  }
}
