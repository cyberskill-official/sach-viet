import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { adminAiChat, assertAiChatEnabled, createAiSettingsStore } from "@/lib/ai-settings-core.mjs";

function statusFor(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("retired on Production")) return 410;
  if (message.includes("Administrator access")) return 403;
  if (
    message.includes("AI_SETTINGS_SECRET") ||
    message.includes("not configured") ||
    message.includes("required")
  ) {
    return 400;
  }
  if (message.includes("AI provider") || message.includes("timed out")) return 502;
  return 400;
}

export async function POST(request: Request) {
  try {
    assertAiChatEnabled();
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await request.json().catch(() => ({}));
    const store = await createAiSettingsStore();
    try {
      const reply = await adminAiChat(store, auth.user, {
        message: typeof body.message === "string" ? body.message : undefined,
        messages: Array.isArray(body.messages) ? body.messages : undefined,
      });
      return NextResponse.json({ reply });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI chat failed." },
      { status: statusFor(error) },
    );
  }
}
