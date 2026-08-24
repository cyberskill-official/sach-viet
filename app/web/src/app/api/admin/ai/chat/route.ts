import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { adminAiChat, assertAiChatEnabled, createAiSettingsStore } from "@/lib/ai-settings-core.mjs";

async function sessionFrom(request: Request) {
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
