import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PREPARE_OUTCOMES,
  QUALITY_CHECK_IDS,
  assertNoNetworkDeployInSource,
  detectPreviewCredentials,
  getQualityChecklist,
  preparePreviewRelease,
  validatePreviewPackaging,
} from "../src/lib/quality-preview-release-core.mjs";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/quality-preview-release-core.mjs"), "utf8");
const prepareScript = readFileSync(resolve(root, "scripts/prepare-preview-release.mjs"), "utf8");
const operations = readFileSync(resolve(root, "OPERATIONS.md"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

for (const required of [
  "getQualityChecklist",
  "validatePreviewPackaging",
  "preparePreviewRelease",
  "prepared_local",
  "refused_production",
  "refused_unauthorized_remote",
  "detectPreviewCredentials",
  "assertNoNetworkDeployInSource",
]) {
  if (!source.includes(required)) {
    throw new Error(`Quality/preview release core is missing ${required}.`);
  }
}

assertNoNetworkDeployInSource(source);
assertNoNetworkDeployInSource(prepareScript);

const checklist = getQualityChecklist();
const ids = checklist.checks.map((check) => check.id);
if (JSON.stringify(ids) !== JSON.stringify([...QUALITY_CHECK_IDS])) {
  throw new Error("Quality checklist ids drifted from QUALITY_CHECK_IDS.");
}

validatePreviewPackaging(root);

const absent = preparePreviewRelease({
  rootPath: root,
  credentials: { present: false, source: null },
  log() {},
});
if (absent.outcome !== PREPARE_OUTCOMES.PREPARED_LOCAL || absent.deployed !== false) {
  throw new Error("Credential-absent prepare must return prepared_local without deploying.");
}

const production = preparePreviewRelease({
  rootPath: root,
  target: "production",
  credentials: { present: true, source: "CAPROVER_APP_TOKEN" },
  log() {},
});
if (production.outcome !== PREPARE_OUTCOMES.REFUSED_PRODUCTION) {
  throw new Error("Production prepare must refuse.");
}

const unauthorized = preparePreviewRelease({
  rootPath: root,
  authorizeRemote: true,
  credentials: detectPreviewCredentials({ CAPROVER_APP_TOKEN: "not-a-real-token" }),
  log() {},
});
if (unauthorized.outcome !== PREPARE_OUTCOMES.REFUSED_UNAUTHORIZED_REMOTE) {
  throw new Error("Unauthorized remote prepare must refuse.");
}

if (!packageJson.scripts.verify.includes("verify-quality-preview-release-core.mjs")) {
  throw new Error("npm run verify must wire quality-preview-release verification.");
}
if (!operations.includes("run-gates.sh") || !operations.includes("prepared_local")) {
  throw new Error("OPERATIONS.md must document CyberOS gates and prepared_local.");
}

const wordpressImport = readFileSync(resolve(root, "src/lib/wordpress-import-core.mjs"), "utf8");
if (!wordpressImport.includes("importWordpressFixture")) {
  throw new Error("WordPress import core must remain intact.");
}

console.info(
  JSON.stringify({
    event: "quality_preview_release_core_verified",
    task_id: "TASK-REBUILD-022",
    result: "passed",
    prepare_outcome: absent.outcome,
  }),
);
