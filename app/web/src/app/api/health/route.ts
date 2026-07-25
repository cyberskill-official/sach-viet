import { NextResponse } from "next/server";
import { openDatabase } from "@/lib/db.mjs";

/**
 * Liveness/readiness probe: confirms the process can reach DATABASE_URL and run SELECT 1.
 * Used by Compose healthchecks; keep dependency-light (no auth, no business stores).
 */
export async function GET() {
  let db;
  try {
    db = openDatabase(undefined, { skipMigrations: true });
    const row = db.prepare("SELECT 1 AS ok").get();
    if (row?.ok !== 1) {
      return NextResponse.json({ ok: false, db: "unexpected" }, { status: 503 });
    }
    return NextResponse.json({ ok: true, db: "ok" }, { status: 200 });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "health_failed";
    console.error(JSON.stringify({ event: "health_probe_failed", result: "failed", reason, db: "error" }));
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        reason,
      },
      { status: 503 },
    );
  } finally {
    try {
      db?.close();
    } catch {
      // ignore close errors on the health path
    }
  }
}
