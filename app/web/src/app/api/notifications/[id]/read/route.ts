import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createNotificationStore, markNotificationRead } from "@/lib/notification-core.mjs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const store = await createNotificationStore();
    try {
      return NextResponse.json({ notification: await markNotificationRead(store, auth.user, id) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mark-read failed." }, { status: 400 });
  }
}
