import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { getIntegrationStatus } from "@/lib/email-zalo-integrations-core.mjs";
import { createNotificationStore } from "@/lib/notification-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createNotificationStore();
    try {
      return NextResponse.json({ status: getIntegrationStatus(store, auth.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Integration status is unavailable." },
      { status: 403 },
    );
  }
}
