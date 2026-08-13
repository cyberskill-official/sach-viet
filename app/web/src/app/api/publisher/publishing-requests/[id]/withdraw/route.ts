import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createPublisherPortalStore, withdrawPublishingRequest } from "@/lib/publisher-portal-core.mjs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const store = await createPublisherPortalStore();
    try {
      return NextResponse.json({
        publishingRequest: await withdrawPublishingRequest(store, session.user, {
          requestId: id,
          publisherId: body?.publisherId,
        }),
      });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publishing request could not be withdrawn." },
      { status: 403 },
    );
  }
}
