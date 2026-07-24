import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/wordpress-import-core.mjs"), "utf8");
for (const required of [
  "importWordpressFixture",
  "getWordpressImportStatus",
  "applyWordpressImportAsAdmin",
  "dry_run",
  "apply",
  "legacy_wp_user_id",
  "legacy_wp_order_id",
  "billing_email_unresolved",
  "skipped_duplicate",
  "unmatched",
]) {
  if (!source.includes(required)) throw new Error(`WordPress import core is missing ${required}.`);
}
if (/createConnection\(|mysql2|better-sqlite3-mysql|wordpress\/wp-admin|require\(['\"]php|class WpImport/i.test(source)) {
  throw new Error("WordPress import core must not revive WP runtime or MySQL clients.");
}
const auth = readFileSync(resolve(root, "src/lib/auth-core.mjs"), "utf8");
if (!auth.includes("verifyPhpassPassword") || !auth.includes("$P$")) {
  throw new Error("Auth core must verify PHPass hashes for imported accounts.");
}
const statusRoute = readFileSync(resolve(root, "src/app/api/admin/wordpress-import/status/route.ts"), "utf8");
const applyRoute = readFileSync(resolve(root, "src/app/api/admin/wordpress-import/apply/route.ts"), "utf8");
if (!statusRoute.includes("getWordpressImportStatus") || !applyRoute.includes("applyWordpressImportAsAdmin")) {
  throw new Error("Admin wordpress-import routes must wire status and apply helpers.");
}
const migration = readFileSync(
  resolve(root, "../../docs/tasks/migration/TASK-MIGRATION-001-reconcile-wp-order-items/spec.md"),
  "utf8",
);
if (!migration.includes("status: on_hold")) {
  throw new Error("TASK-MIGRATION-001 must remain on_hold.");
}
console.info(JSON.stringify({ event: "wordpress_import_core_verified", task_id: "TASK-REBUILD-021", result: "passed" }));
