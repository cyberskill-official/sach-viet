import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    return NextResponse.json({ user: auth.user });
  } catch {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }
}
