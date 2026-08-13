import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Process liveness only. Readiness (DB, migrations, outbox, env) lives at GET /api/ready. */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
