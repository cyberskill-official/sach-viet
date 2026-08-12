import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  B2C_CAPABILITY_CHECKLIST,
  CUTOVER_GATES,
  CUTOVER_PLAN_OUTCOMES,
  PARITY_STATUSES,
  assertClosedParityStatus,
  assertNoLiveParityClaim,
  assertNoProductionCutoverInSource,
  buildCutoverPlan,
  buildEvidenceMatrix,
  getB2cCapabilityChecklist,
  prepareCutoverPlan,
  renderCutoverPlanMarkdown,
  renderEvidenceMatrixMarkdown,
  validateEvidenceMatrix,
} from "../src/lib/b2c-parity-cutover-core.mjs";

const appRoot = join(import.meta.dirname, "..");

test("checklist uses only closed-set statuses and covers required B2C rows", async () => {
  const checklist = getB2cCapabilityChecklist();
  assert.equal(checklist.live_wp_parity_claimed, false);
  assert.equal(checklist.claim_mode, "greenfield_capability_coverage");
  assert.ok(checklist.rows.length >= 12);
  for (const row of checklist.rows) {
    assertClosedParityStatus(row.status);
  }
  const ids = checklist.rows.map((row) => row.id);
  assert.ok(ids.includes("cart_hosted_checkout"));
  assert.ok(ids.includes("live_wp_storefront_comparison"));
  assert.ok(ids.includes("wishlist_share"));
});

test("evidence matrix marks greenfield_proven rows with evidence keys and forbids live parity", async () => {
  const matrix = buildEvidenceMatrix();
  validateEvidenceMatrix(matrix);
  assert.equal(matrix.live_wp_parity_claimed, false);
  assert.ok(matrix.counts.greenfield_proven >= 10);
  assert.equal(matrix.counts.evidence_unavailable >= 1, true);
  assert.equal(matrix.counts.source_gap >= 1, true);
  for (const row of matrix.rows) {
    if (row.status === "greenfield_proven") {
      assert.ok(
        row.evidence_key?.startsWith("verify-") || row.evidence_key === "paypal_sandbox_checkout",
        `unexpected evidence_key for ${row.id}`,
      );
    }
  }
  const paypal = matrix.rows.find((row) => row.id === "paypal_checkout");
  assert.equal(paypal?.status, "greenfield_proven");
  assert.equal(paypal?.evidence_key, "paypal_sandbox_checkout");
  assert.throws(() => assertNoLiveParityClaim({ live_wp_parity_claimed: true }), /live_wp_parity/);
  assert.throws(
    () => assertNoLiveParityClaim({ claim_mode: "live_wp_parity", live_wp_parity_claimed: false }),
    /claim_mode/,
  );
});

test("unknown status and incomplete matrix are rejected", async () => {
  assert.throws(() => assertClosedParityStatus("almost_parity"), /Unknown parity status/);
  assert.throws(
    () =>
      buildEvidenceMatrix({
        claim_mode: "greenfield_capability_coverage",
        live_wp_parity_claimed: false,
        rows: [{ id: "x", label: "x", status: "greenfield_proven", evidence_key: null }],
      }),
    /evidence_key/,
  );
  const incomplete = buildEvidenceMatrix();
  incomplete.rows = incomplete.rows.filter((row) => row.id !== "cart_hosted_checkout");
  assert.throws(() => validateEvidenceMatrix(incomplete), /missing required capability/);
});

test("cutover plan records unmet owner gates and does not execute", async () => {
  const plan = buildCutoverPlan();
  assert.equal(plan.executed, false);
  assert.equal(plan.production_authorized, false);
  assert.equal(plan.live_wp_parity_claimed, false);
  assert.deepEqual(
    plan.gates.map((gate) => gate.id),
    [...CUTOVER_GATES],
  );
  assert.ok(plan.unmet_gates.includes("owner_go_decision"));
  assert.ok(plan.unmet_gates.includes("separate_deployment_instruction"));
  assert.ok(plan.unmet_gates.includes("backup_verified"));
  assert.ok(plan.unmet_gates.includes("named_rollback_plan"));
  assert.ok(!plan.unmet_gates.includes("parity_evidence_packet_complete"));
});

test("prepareCutoverPlan returns plan_recorded for default path", async () => {
  const events = [];
  const result = prepareCutoverPlan({
    log: (event, fields = {}) => events.push({ event, ...fields }),
  });
  assert.equal(result.outcome, CUTOVER_PLAN_OUTCOMES.PLAN_RECORDED);
  assert.equal(result.executed, false);
  assert.equal(result.live_wp_parity_claimed, false);
  assert.ok(result.matrix.row_count === B2C_CAPABILITY_CHECKLIST.length);
  assert.ok(events.some((entry) => entry.event === "b2c_cutover_plan_completed"));
});

test("production target and execute flag are refused", async () => {
  const production = prepareCutoverPlan({ target: "production", log() {} });
  assert.equal(production.outcome, CUTOVER_PLAN_OUTCOMES.REFUSED_PRODUCTION);
  assert.equal(production.executed, false);

  const live = prepareCutoverPlan({ execute: true, log() {} });
  assert.equal(live.outcome, CUTOVER_PLAN_OUTCOMES.REFUSED_LIVE_CUTOVER);
  assert.equal(live.executed, false);
});

test("invalid checklist yields invalid_matrix", async () => {
  const result = prepareCutoverPlan({
    checklist: {
      claim_mode: "greenfield_capability_coverage",
      live_wp_parity_claimed: false,
      rows: [{ id: "broken", label: "broken", status: "not_a_status" }],
    },
    log() {},
  });
  assert.equal(result.outcome, CUTOVER_PLAN_OUTCOMES.INVALID_MATRIX);
  assert.equal(result.executed, false);
});

test("markdown renderers stay non-executing and disclose no live parity", async () => {
  const matrix = buildEvidenceMatrix();
  const plan = buildCutoverPlan({ matrix });
  const matrixMd = renderEvidenceMatrixMarkdown(matrix);
  const planMd = renderCutoverPlanMarkdown(plan);
  assert.match(matrixMd, /live_wp_parity_claimed: `false`/);
  assert.match(matrixMd, /does \*\*not\*\* claim live WordPress/);
  assert.match(planMd, /production_authorized: `false`/);
  assert.match(planMd, /owner_go_decision/);
});

test("default-path source forbids production cutover primitives", async () => {
  const source = readFileSync(join(appRoot, "src/lib/b2c-parity-cutover-core.mjs"), "utf8");
  assertNoProductionCutoverInSource(source);
  assert.throws(() => assertNoProductionCutoverInSource("await fetch('https://example')"), /production cutover/);
});

test("closed status set is frozen and complete", async () => {
  assert.deepEqual([...PARITY_STATUSES], [
    "greenfield_proven",
    "source_gap",
    "evidence_unavailable",
    "deferred_out_of_scope",
  ]);
});
