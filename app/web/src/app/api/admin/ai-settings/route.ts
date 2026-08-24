import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { assertAiChatEnabled, createAiSettingsStore, getAiSettings, updateAiSettings } from "@/lib/ai-settings-core.mjs";

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
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createAiSettingsStore();
    try {
      return NextResponse.json({ settings: await getAiSettings(store, auth.user) });
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
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await request.json().catch(() => ({}));
    const store = await createAiSettingsStore();
    try {
      return NextResponse.json({ settings: await updateAiSettings(store, auth.user, body) });
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
