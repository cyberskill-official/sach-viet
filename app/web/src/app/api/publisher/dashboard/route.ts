import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createPublisherPortalStore, getPublisherDashboard } from "@/lib/publisher-portal-core.mjs";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const publisherId = new URL(request.url).searchParams.get("publisherId") || undefined;
    const store = createPublisherPortalStore();
    try {
      return NextResponse.json({ dashboard: getPublisherDashboard(store, session.user, { publisherId }) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publisher dashboard is unavailable." },
      { status: 403 },
    );
  }
}
