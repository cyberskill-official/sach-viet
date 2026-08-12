import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createAuthorPortalStore, getAuthorManuscriptRequest } from "@/lib/author-portal-core.mjs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const { id } = await context.params;
    const authorId = new URL(request.url).searchParams.get("authorId") || undefined;
    const store = await createAuthorPortalStore();
    try {
      return NextResponse.json({
        manuscriptRequest: await getAuthorManuscriptRequest(store, session.user, {
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
