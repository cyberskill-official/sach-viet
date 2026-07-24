import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  B2C_CAPABILITY_CHECKLIST,
  CUTOVER_PLAN_OUTCOMES,
  PARITY_STATUSES,
  assertNoLiveParityClaim,
  assertNoProductionCutoverInSource,
  buildEvidenceMatrix,
  getB2cCapabilityChecklist,
  prepareCutoverPlan,
  validateEvidenceMatrix,
} from "../src/lib/b2c-parity-cutover-core.mjs";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/b2c-parity-cutover-core.mjs"), "utf8");
const operations = readFileSync(resolve(root, "OPERATIONS.md"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

for (const required of [
  "getB2cCapabilityChecklist",
  "buildEvidenceMatrix",
  "validateEvidenceMatrix",
  "buildCutoverPlan",
  "prepareCutoverPlan",
  "assertNoLiveParityClaim",
  "assertNoProductionCutoverInSource",
  "greenfield_proven",
  "evidence_unavailable",
  "refused_production",
  "refused_live_cutover",
  "plan_recorded",
]) {
  if (!source.includes(required)) {
    throw new Error(`B2C parity/cutover core is missing ${required}.`);
  }
}

assertNoProductionCutoverInSource(source);

const checklist = getB2cCapabilityChecklist();
assertNoLiveParityClaim(checklist);
if (checklist.rows.length !== B2C_CAPABILITY_CHECKLIST.length) {
  throw new Error("Checklist length drifted from B2C_CAPABILITY_CHECKLIST.");
}
for (const row of checklist.rows) {
  if (!PARITY_STATUSES.includes(row.status)) {
    throw new Error(`Checklist row ${row.id} has unknown status ${row.status}.`);
  }
}

const matrix = buildEvidenceMatrix(checklist);
validateEvidenceMatrix(matrix);
if (matrix.live_wp_parity_claimed !== false) {
  throw new Error("Matrix must not claim live WP parity.");
}
if (matrix.counts.evidence_unavailable < 1) {
  throw new Error("Matrix must record at least one evidence_unavailable row for missing live comparison.");
}

const recorded = prepareCutoverPlan({ log() {} });
if (recorded.outcome !== CUTOVER_PLAN_OUTCOMES.PLAN_RECORDED || recorded.executed !== false) {
  throw new Error("Default prepare must record a non-executing plan.");
}
if (!recorded.plan.unmet_gates.includes("owner_go_decision")) {
  throw new Error("Cutover plan must leave owner_go_decision unmet.");
}

const production = prepareCutoverPlan({ target: "production", log() {} });
if (production.outcome !== CUTOVER_PLAN_OUTCOMES.REFUSED_PRODUCTION) {
  throw new Error("Production target must refuse.");
}

const live = prepareCutoverPlan({ execute: true, log() {} });
if (live.outcome !== CUTOVER_PLAN_OUTCOMES.REFUSED_LIVE_CUTOVER) {
  throw new Error("Execute flag must refuse live cutover.");
}

if (!packageJson.scripts.verify.includes("verify-b2c-parity-cutover-core.mjs")) {
  throw new Error("npm run verify must wire b2c-parity-cutover verification.");
}

for (const marker of [
  "B2C evidence matrix",
  "greenfield capability coverage",
  "live WordPress",
  "cutover plan",
  "owner go",
  "Do not deploy",
]) {
  if (!operations.includes(marker)) {
    throw new Error(`OPERATIONS.md is missing B2C parity/cutover marker: ${marker}`);
  }
}

const qualityCore = readFileSync(resolve(root, "src/lib/quality-preview-release-core.mjs"), "utf8");
if (!qualityCore.includes("preparePreviewRelease")) {
  throw new Error("Quality/preview release core must remain intact.");
}

const wordpressImport = readFileSync(resolve(root, "src/lib/wordpress-import-core.mjs"), "utf8");
if (!wordpressImport.includes("importWordpressFixture")) {
  throw new Error("WordPress import core must remain intact.");
}

console.info(
  JSON.stringify({
    event: "b2c_parity_cutover_core_verified",
    task_id: "TASK-REBUILD-023",
    result: "passed",
    plan_outcome: recorded.outcome,
    greenfield_proven: matrix.counts.greenfield_proven,
    evidence_unavailable: matrix.counts.evidence_unavailable,
  }),
);
