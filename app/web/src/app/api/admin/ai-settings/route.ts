import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { assertAiChatEnabled, createAiSettingsStore, getAiSettings, updateAiSettings } from "@/lib/ai-settings-core.mjs";

async function sessionFrom(request: Request) {
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
    const session = await sessionFrom(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
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
