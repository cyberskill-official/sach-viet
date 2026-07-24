import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createPublisherPortalStore, withdrawPublishingRequest } from "@/lib/publisher-portal-core.mjs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const store = createPublisherPortalStore();
    try {
      return NextResponse.json({
        publishingRequest: withdrawPublishingRequest(store, session.user, {
          requestId: id,
          publisherId: body?.publisherId,
        }),
      });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publishing request could not be withdrawn." },
      { status: 403 },
    );
  }
}
