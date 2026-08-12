import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createAuthorPortalStore, getAuthorDashboard } from "@/lib/author-portal-core.mjs";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const authorId = new URL(request.url).searchParams.get("authorId") || undefined;
    const store = await createAuthorPortalStore();
    try {
      return NextResponse.json({ dashboard: await getAuthorDashboard(store, session.user, { authorId }) });
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
