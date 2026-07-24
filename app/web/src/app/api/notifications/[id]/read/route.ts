import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createNotificationStore, markNotificationRead } from "@/lib/notification-core.mjs";

function sessionFor(request: Request) {
  return readSession(
    getAuthStore(),
    request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1],
    process.env.AUTH_SESSION_SECRET,
  );
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const { id } = await context.params;
    const store = createNotificationStore();
    try {
      return NextResponse.json({ notification: markNotificationRead(store, session.user, id) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mark-read failed." }, { status: 400 });
  }
}
