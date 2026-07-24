import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import {
  createNotificationStore,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from "@/lib/notification-core.mjs";

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
    const store = createNotificationStore();
    try {
      return NextResponse.json(getUserNotificationPreferences(store, session.user));
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Preferences are unavailable." }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createNotificationStore();
    try {
      return NextResponse.json(updateUserNotificationPreferences(store, session.user, await request.json()));
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Preference update failed." }, { status: 400 });
  }
}
