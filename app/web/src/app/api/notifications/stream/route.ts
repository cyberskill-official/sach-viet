import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createOwnerNotificationSseStream } from "@/lib/live-notifications-core.mjs";
import { createNotificationStore } from "@/lib/notification-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
    const store = await createNotificationStore();
    const stream = createOwnerNotificationSseStream({
      store,
      user: auth.user,
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
