// Worker used by sqlite-concurrency.test.mjs: performs write transactions
// against a shared database to contend with a sibling worker.
import { parentPort, workerData } from "node:worker_threads";
import { beginImmediateWithRetry, openSqliteDatabase } from "../../src/lib/sqlite.mjs";

const { dbPath, writerId, iterations } = workerData;
const db = openSqliteDatabase(dbPath);
const insert = db.prepare("INSERT INTO concurrency_probe (id, writer, iteration) VALUES (?, ?, ?)");

for (let iteration = 0; iteration < iterations; iteration += 1) {
  beginImmediateWithRetry(db);
  try {
    insert.run(`${writerId}-${iteration}`, writerId, iteration);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

db.close();
parentPort.postMessage({ writerId, completed: iterations });
