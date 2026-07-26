import { NextResponse } from "next/server";
import pg from "pg";

/**
 * Liveness/readiness probe: confirms the process can reach DATABASE_URL and run SELECT 1.
 * Uses async `pg` directly (not synckit) so serverless health cannot hang on worker spawn.
 */
export const runtime = "nodejs";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      { ok: false, db: "error", reason: "DATABASE_URL missing" },
      { status: 503 },
    );
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 8_000,
    // Supabase pooler presents a chain that some runtimes reject when
    // rejectUnauthorized is forced true; health must fail fast, not hang.
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query("SELECT 1 AS ok");
    const ok = Number(result.rows?.[0]?.ok) === 1;
    if (!ok) {
      return NextResponse.json({ ok: false, db: "unexpected" }, { status: 503 });
    }
    return NextResponse.json({ ok: true, db: "ok" }, { status: 200 });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "health_failed";
    console.error(JSON.stringify({ event: "health_probe_failed", result: "failed", reason, db: "error" }));
    return NextResponse.json({ ok: false, db: "error", reason }, { status: 503 });
  } finally {
    try {
      await client.end();
    } catch {
      // ignore close errors on the health path
    }
  }
}
