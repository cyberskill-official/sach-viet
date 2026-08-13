import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { assertAiChatEnabled, createAiSettingsStore, getAiSettings, updateAiSettings } from "@/lib/ai-settings-core.mjs";

async function sessionFrom(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
  return await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
}

function statusFor(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("retired on Production")) return 410;
  if (message.includes("Administrator access")) return 403;
  if (message.includes("AI_SETTINGS_SECRET")) return 400;
  return 400;
}

export async function GET(request: Request) {
  try {
    assertAiChatEnabled();
    const session = await sessionFrom(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createAiSettingsStore();
    try {
      return NextResponse.json({ settings: await getAiSettings(store, session.user) });
    } finally {
      await store.close();
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
    assertAiChatEnabled();
    const session = await sessionFrom(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const store = await createAiSettingsStore();
    try {
      return NextResponse.json({ settings: await updateAiSettings(store, session.user, body) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI settings could not be saved." },
      { status: statusFor(error) },
    );
  }
}
