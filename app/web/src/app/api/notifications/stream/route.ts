import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createOwnerNotificationSseStream } from "@/lib/live-notifications-core.mjs";
import { createNotificationStore } from "@/lib/notification-core.mjs";

function sessionFor(request: Request) {
  return readSession(
    getAuthStore(),
    request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1],
    process.env.AUTH_SESSION_SECRET,
  );
}

export async function GET(request: Request) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
    const store = createNotificationStore();
    const stream = createOwnerNotificationSseStream({
      store,
      user: session.user,
      cursor,
      signal: request.signal,
      onClose: () => store.close(),
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Live notifications are unavailable." },
      { status: 403 },
    );
  }
}
