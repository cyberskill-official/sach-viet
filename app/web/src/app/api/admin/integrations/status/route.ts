import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { getIntegrationStatus } from "@/lib/email-zalo-integrations-core.mjs";
import { createNotificationStore } from "@/lib/notification-core.mjs";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createNotificationStore();
    try {
      return NextResponse.json({ status: getIntegrationStatus(store, session.user) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Integration status is unavailable." },
      { status: 403 },
    );
  }
}
