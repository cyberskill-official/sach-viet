import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { computeRoyaltyStatement, computeVendorSettlement } from "@/lib/finance-policy-core.mjs";

/** Admin-only settlement / royalty compute previews from DEC-SET / DEC-ROY rates. */
export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid compute request." }, { status: 400 });

    const kind = typeof body.kind === "string" ? body.kind.trim() : "";
    if (kind === "settlement") {
      return NextResponse.json({ settlement: computeVendorSettlement(body) });
    }
    if (kind === "royalty") {
      return NextResponse.json({ royalty: computeRoyaltyStatement(body) });
    }
    return NextResponse.json({ error: "kind must be settlement or royalty." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Finance compute failed." }, { status: 400 });
  }
}
