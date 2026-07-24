import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createAuthorPortalStore, withdrawAuthorManuscriptRequest } from "@/lib/author-portal-core.mjs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const store = createAuthorPortalStore();
    try {
      return NextResponse.json({
        manuscriptRequest: withdrawAuthorManuscriptRequest(store, session.user, {
          requestId: id,
          authorId: body?.authorId,
        }),
      });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Manuscript request could not be withdrawn." },
      { status: 403 },
    );
  }
}
