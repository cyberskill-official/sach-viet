import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import {
  createNotificationStore,
  getVendorNotificationPreferences,
  updateVendorNotificationPreferences,
} from "@/lib/notification-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createNotificationStore();
    try {
      return NextResponse.json(await getVendorNotificationPreferences(store, auth.user));
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Vendor preferences are unavailable." }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createNotificationStore();
    try {
      return NextResponse.json(await updateVendorNotificationPreferences(store, auth.user, await request.json()));
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Vendor preference update failed." }, { status: 400 });
  }
}
