import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createAuthorPortalStore, withdrawAuthorManuscriptRequest } from "@/lib/author-portal-core.mjs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const store = await createAuthorPortalStore();
    try {
      return NextResponse.json({
        manuscriptRequest: await withdrawAuthorManuscriptRequest(store, auth.user, {
          requestId: id,
          authorId: body?.authorId,
        }),
      });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Manuscript request could not be withdrawn." },
      { status: 403 },
    );
  }
}
