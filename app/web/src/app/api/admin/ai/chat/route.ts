import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { adminAiChat, createAiSettingsStore } from "@/lib/ai-settings-core.mjs";

function sessionFrom(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
  return readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
}

function statusFor(error: unknown) {
  const message = error instanceof Error ? error.message : "";
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
    const session = sessionFrom(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const store = createAiSettingsStore();
    try {
      const reply = await adminAiChat(store, session.user, {
        message: typeof body.message === "string" ? body.message : undefined,
        messages: Array.isArray(body.messages) ? body.messages : undefined,
      });
      return NextResponse.json({ reply });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI chat failed." },
      { status: statusFor(error) },
    );
  }
}
