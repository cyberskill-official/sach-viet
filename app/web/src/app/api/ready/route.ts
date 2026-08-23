import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getReadiness } from "@/lib/ready-core.mjs";

export const runtime = "nodejs";

export async function GET() {
  const requestId = randomBytes(8).toString("hex");
  try {
    const readiness = await getReadiness();
    if (!readiness.ok) {
      return NextResponse.json(
        { ...readiness, error: { code: "not_ready", message: "Service is not ready.", requestId } },
        { status: 503 },
      );
    }
    return NextResponse.json(readiness, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        migration: { latest: null },
        outbox: { oldestPendingAgeMs: null },
        env: {},
        release: { sha: null, deploymentEnv: null },
        schema: { name: "public", targetDeferred: "app" },
        storage: { mode: "postgres_bytea", supabaseEnvPresent: {} },
        identity: { userCount: null, adminCount: null, bootstrapEligible: null },
        error: { code: "not_ready", message: "Service is not ready.", requestId },
      },
      { status: 503 },
    );
  }
}
