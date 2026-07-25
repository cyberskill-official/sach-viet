import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import { beginImmediateWithRetry, openDatabase } from "../src/lib/db.mjs";

test("two Postgres sessions on the same schema can each commit without interference", () => {
  const dbPath = `/tmp/sachviet-pg-concurrency-${randomUUID()}`;

  // db1 creates the shared schema and probe table.
  const db1 = openDatabase(dbPath);
  const db2 = openDatabase(dbPath, { skipMigrations: true });

  try {
    db1.exec(
      "CREATE TABLE IF NOT EXISTS concurrency_probe (id TEXT PRIMARY KEY, writer TEXT NOT NULL, iteration INTEGER NOT NULL)",
    );

    // Two interleaved transactions: both begin, both write different rows, both commit.
    beginImmediateWithRetry(db1);
    beginImmediateWithRetry(db2);

    db1.prepare("INSERT INTO concurrency_probe (id, writer, iteration) VALUES (?, ?, ?)").run(
      "writer-a-0",
      "writer-a",
      0,
    );
    db2.prepare("INSERT INTO concurrency_probe (id, writer, iteration) VALUES (?, ?, ?)").run(
      "writer-b-0",
      "writer-b",
      0,
    );

    db1.exec("COMMIT");
    db2.exec("COMMIT");

    const { total } = db1
      .prepare("SELECT COUNT(*) AS total FROM concurrency_probe")
      .get();
    assert.equal(total, 2, "both writers must have committed their rows");
  } finally {
    db1.close();
    db2.close();
  }
});

test("beginImmediateWithRetry retries on serialization conflicts without throwing", () => {
  const dbPath = `/tmp/sachviet-pg-retry-${randomUUID()}`;
  const db = openDatabase(dbPath);

  try {
    db.exec(
      "CREATE TABLE IF NOT EXISTS retry_probe (id TEXT PRIMARY KEY, value TEXT NOT NULL)",
    );

    // Perform multiple write transactions sequentially; none should throw.
    for (let i = 0; i < 5; i += 1) {
      beginImmediateWithRetry(db, { retries: 3, backoffMs: 10 });
      db.prepare("INSERT INTO retry_probe (id, value) VALUES (?, ?)").run(
        `row-${i}`,
        `value-${i}`,
      );
      db.exec("COMMIT");
    }

    const { total } = db.prepare("SELECT COUNT(*) AS total FROM retry_probe").get();
    assert.equal(total, 5, "all writes must be committed");
  } finally {
    db.close();
  }
});
