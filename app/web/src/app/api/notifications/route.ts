import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createNotificationStore, listNotifications } from "@/lib/notification-core.mjs";

async function sessionFor(request: Request) {
  return await readSession(
    await getAuthStore(),
    request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1],
    process.env.AUTH_SESSION_SECRET,
  );
}

export async function GET(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createNotificationStore();
    try {
      const url = new URL(request.url);
      const after = url.searchParams.get("after") ?? undefined;
      const limitParam = url.searchParams.get("limit");
      const limit = limitParam ? Number(limitParam) : 50;
      return NextResponse.json(await listNotifications(store, session.user, { after, limit }));
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Notifications are unavailable." }, { status: 403 });
  }
}
