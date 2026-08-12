// Reusable Postgres writer worker: performs write transactions against a shared
// Postgres schema to contend with a sibling worker. Kept for future Worker-thread
// concurrency tests; pg-concurrency.test.mjs currently uses in-process sessions.
import { parentPort, workerData } from "node:worker_threads";
import { beginImmediateWithRetry, openDatabase } from "../../src/lib/db.mjs";

const { dbPath, schema, writerId, iterations } = workerData;

// Use explicit schema + skipMigrations so the worker does not race on CREATE SCHEMA
// against the main-thread setup connection (which keeps the schema alive).
const db = await openDatabase(dbPath, { schema, skipMigrations: true });
const insert = db.prepare("INSERT INTO concurrency_probe (id, writer, iteration) VALUES (?, ?, ?)");

for (let iteration = 0; iteration < iterations; iteration += 1) {
  await beginImmediateWithRetry(db);
  try {
    await insert.run(`${writerId}-${iteration}`, writerId, iteration);
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

await db.close();
parentPort.postMessage({ writerId, completed: iterations });
