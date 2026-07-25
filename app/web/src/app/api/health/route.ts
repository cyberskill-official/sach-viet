import { NextResponse } from "next/server";
import { openSqliteDatabase } from "@/lib/sqlite.mjs";

/**
 * Liveness/readiness probe: confirms the process can open DATABASE_PATH and run SELECT 1.
 * Used by Compose healthchecks; keep dependency-light (no auth, no business stores).
 */
export async function GET() {
  let db;
  try {
    db = openSqliteDatabase(undefined, { busyTimeoutMs: 1000 });
    const row = db.prepare("SELECT 1 AS ok").get();
    if (row?.ok !== 1) {
      return NextResponse.json({ ok: false, db: "unexpected" }, { status: 503 });
    }
    return NextResponse.json({ ok: true, db: "ok" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        reason: error instanceof Error ? error.message : "health_failed",
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
