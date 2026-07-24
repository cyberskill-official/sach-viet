import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import {
  createInstitutionBuyerStore,
  getInstitutionBudget,
  upsertInstitutionBudget,
} from "@/lib/institution-buyer-core.mjs";

function sessionFor(request: Request) {
  return readSession(getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const organizationId = new URL(request.url).searchParams.get("organizationId") || undefined;
    const store = createInstitutionBuyerStore();
    try {
      return NextResponse.json({ budget: getInstitutionBudget(store, session.user, { organizationId }) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Budget is unavailable." }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createInstitutionBuyerStore();
    try {
      return NextResponse.json({ budget: upsertInstitutionBudget(store, session.user, await request.json()) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Budget update failed." }, { status: 400 });
  }
}
