import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createAiSettingsStore, getAiSettings, updateAiSettings } from "@/lib/ai-settings-core.mjs";

function sessionFrom(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
  return readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
}

function statusFor(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Administrator access")) return 403;
  if (message.includes("AI_SETTINGS_SECRET")) return 400;
  return 400;
}

export async function GET(request: Request) {
  try {
    const session = sessionFrom(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createAiSettingsStore();
    try {
      return NextResponse.json({ settings: getAiSettings(store, session.user) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI settings are unavailable." },
      { status: statusFor(error) },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = sessionFrom(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const store = createAiSettingsStore();
    try {
      return NextResponse.json({ settings: updateAiSettings(store, session.user, body) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI settings could not be saved." },
      { status: statusFor(error) },
    );
  }
}
