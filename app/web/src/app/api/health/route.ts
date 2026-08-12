import { NextResponse } from "next/server";
import { getSharedPool, resolveDatabaseUrl, sslOptionsForDatabaseUrl } from "@/lib/db.mjs";

export const runtime = "nodejs";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      { ok: false, db: "error", reason: "DATABASE_URL missing" },
      { status: 503 },
    );
  }

  const pool = getSharedPool(resolveDatabaseUrl(databaseUrl));
  try {
    const result = await pool.query("SELECT 1 AS ok");
    const ok = Number(result.rows?.[0]?.ok) === 1;
    if (!ok) {
      return NextResponse.json({ ok: false, db: "unexpected" }, { status: 503 });
    }
    return NextResponse.json(
      { ok: true, db: "ok", tls: Boolean(sslOptionsForDatabaseUrl(databaseUrl)) },
      { status: 200 },
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : "health_failed";
    console.error(JSON.stringify({ event: "health_probe_failed", result: "failed", reason, db: "error" }));
    return NextResponse.json({ ok: false, db: "error", reason }, { status: 503 });
  }
}
