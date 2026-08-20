import { NextResponse } from "next/server";
import { releaseFingerprint } from "@/lib/obs-fingerprint.mjs";

export const runtime = "nodejs";

/** Process liveness only. Readiness (DB, migrations, outbox, env) lives at GET /api/ready. */
export async function GET() {
  return NextResponse.json({ ok: true, release: releaseFingerprint() }, { status: 200 });
}
