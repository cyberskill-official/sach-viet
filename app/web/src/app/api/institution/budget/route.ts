import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import {
  createInstitutionBuyerStore,
  getInstitutionBudget,
  upsertInstitutionBudget,
} from "@/lib/institution-buyer-core.mjs";

async function sessionFor(request: Request) {
  return await readSession(await getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const organizationId = new URL(request.url).searchParams.get("organizationId") || undefined;
    const store = await createInstitutionBuyerStore();
    try {
      return NextResponse.json({ budget: await getInstitutionBudget(store, session.user, { organizationId }) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Budget is unavailable." }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createInstitutionBuyerStore();
    try {
      return NextResponse.json({ budget: await upsertInstitutionBudget(store, session.user, await request.json()) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Budget update failed." }, { status: 400 });
  }
}
