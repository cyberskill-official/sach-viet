import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createNotificationStore, listNotifications } from "@/lib/notification-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createNotificationStore();
    try {
      const url = new URL(request.url);
      const after = url.searchParams.get("after") ?? undefined;
      const limitParam = url.searchParams.get("limit");
      const limit = limitParam ? Number(limitParam) : 50;
      return NextResponse.json(await listNotifications(store, auth.user, { after, limit }));
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Notifications are unavailable." }, { status: 403 });
  }
}
