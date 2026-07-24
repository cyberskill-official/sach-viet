import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createEmployeeRetailStore, listHomeSections, upsertHomeSection } from "@/lib/employee-retail-core.mjs";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createEmployeeRetailStore();
    try {
      return NextResponse.json({ sections: listHomeSections(store, session.user) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Home sections are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const body = await request.json();
    const store = createEmployeeRetailStore();
    try {
      return NextResponse.json({ section: upsertHomeSection(store, session.user, body) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Home section write failed." }, { status: 403 });
  }
}
