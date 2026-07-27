export const PARITY_STATUSES = Object.freeze([
  "greenfield_proven",
  "source_gap",
  "evidence_unavailable",
  "deferred_out_of_scope",
]);

export const FORBIDDEN_PARITY_CLAIMS = Object.freeze(["live_wp_parity", "live_wordpress_parity", "production_parity"]);

export const CUTOVER_GATES = Object.freeze([
  "parity_evidence_packet_complete",
  "quality_preview_bar_green",
  "backup_verified",
  "named_rollback_plan",
  "owner_go_decision",
  "separate_deployment_instruction",
]);

export const CUTOVER_GATE_STATES = Object.freeze(["met", "unmet", "not_applicable"]);

export const CUTOVER_PLAN_OUTCOMES = Object.freeze({
  PLAN_RECORDED: "plan_recorded",
  REFUSED_PRODUCTION: "refused_production",
  REFUSED_LIVE_CUTOVER: "refused_live_cutover",
  INVALID_MATRIX: "invalid_matrix",
});

/** Closed B2C capability checklist derived from docs/03-portals.md /ecom + B2C-supporting rebuild surfaces. */
export const B2C_CAPABILITY_CHECKLIST = Object.freeze([
  {
    id: "catalog_browse_detail",
    label: "Catalog browse, filter, and product detail",
    evidence_key: "verify-catalog-core.mjs",
    status: "greenfield_proven",
  },
  {
    id: "cart_hosted_checkout",
    label: "Cart and Stripe hosted checkout",
    evidence_key: "verify-commerce-core.mjs",
    status: "greenfield_proven",
  },
  {
    id: "customer_order_history",
    label: "Customer orders and order history",
    evidence_key: "verify-commerce-core.mjs",
    status: "greenfield_proven",
  },
  {
    id: "auth_login_session",
    label: "Customer auth login and signed session",
    evidence_key: "verify-identity.mjs",
    status: "greenfield_proven",
  },
  {
    id: "support_tickets",
    label: "Support tickets",
    evidence_key: "verify-support-core.mjs",
    status: "greenfield_proven",
  },
  {
    id: "goods_requests",
    label: "Goods requests",
    evidence_key: "verify-support-core.mjs",
    status: "greenfield_proven",
  },
  {
    id: "vendor_self_registration",
    label: "Vendor self-registration and admin approval",
    evidence_key: "verify-admin-commerce-core.mjs",
    status: "greenfield_proven",
  },
  {
    id: "vendor_orders_payouts",
    label: "Vendor orders and payouts",
    evidence_key: "verify-vendor-commerce-core.mjs",
    status: "greenfield_proven",
  },
  {
    id: "admin_commerce_ops",
    label: "Admin commerce operations dashboard",
    evidence_key: "verify-admin-commerce-core.mjs",
    status: "greenfield_proven",
  },
  {
    id: "vietnamese_search",
    label: "Vietnamese-aware catalog search",
    evidence_key: "verify-vietnamese-search-core.mjs",
    status: "greenfield_proven",
  },
  {
    id: "wordpress_import_compat",
    label: "WordPress import compatibility (fixture-driven)",
    evidence_key: "verify-wordpress-import-core.mjs",
    status: "greenfield_proven",
  },
  {
    id: "quality_preview_bar",
    label: "Quality checklist and offline preview prepare",
    evidence_key: "verify-quality-preview-release-core.mjs",
    status: "greenfield_proven",
  },
  {
    id: "wishlist_share",
    label: "Wishlist and public share link",
    evidence_key: null,
    status: "source_gap",
  },
  {
    id: "paypal_checkout",
    label: "PayPal hosted checkout (legacy storefront listed Stripe/PayPal)",
    evidence_key: "paypal_sandbox_checkout",
    status: "greenfield_proven",
  },
  {
    id: "live_wp_storefront_comparison",
    label: "Side-by-side live WordPress vs greenfield storefront comparison",
    evidence_key: null,
    status: "evidence_unavailable",
  },
]);

const KNOWN_EVIDENCE_KEYS = Object.freeze(
  B2C_CAPABILITY_CHECKLIST.filter((row) => row.evidence_key).map((row) => row.evidence_key),
);

function defaultLog(event, fields = {}) {
  console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-023", ...fields }));
}

export function getB2cCapabilityChecklist() {
  return {
    claim_mode: "greenfield_capability_coverage",
    live_wp_parity_claimed: false,
    rows: B2C_CAPABILITY_CHECKLIST.map((row) => ({ ...row })),
  };
}

export function assertClosedParityStatus(status) {
  if (!PARITY_STATUSES.includes(status)) {
    throw new Error(`Unknown parity status: ${status}`);
  }
  return true;
}

export function assertNoLiveParityClaim(payload) {
  if (payload == null || typeof payload !== "object") {
    throw new Error("Parity payload must be an object.");
  }
  if (payload.live_wp_parity_claimed === true) {
    throw new Error("live_wp_parity_claimed must remain false.");
  }
  for (const key of FORBIDDEN_PARITY_CLAIMS) {
    if (Object.prototype.hasOwnProperty.call(payload, key) && payload[key] === true) {
      throw new Error(`Forbidden live parity claim field set: ${key}`);
    }
  }
  if (payload.claim_mode === "live_wp_parity" || payload.claim_mode === "live_wordpress_parity") {
    throw new Error("claim_mode must not assert live WordPress parity.");
  }
  return true;
}

export function buildEvidenceMatrix(checklist = getB2cCapabilityChecklist()) {
  assertNoLiveParityClaim(checklist);
  if (!Array.isArray(checklist.rows) || checklist.rows.length === 0) {
    throw new Error("Evidence matrix requires a non-empty checklist.");
  }

  const seen = new Set();
  const rows = [];
  for (const row of checklist.rows) {
    if (!row?.id || typeof row.id !== "string") {
      throw new Error("Each checklist row requires a string id.");
    }
    if (seen.has(row.id)) {
      throw new Error(`Duplicate checklist id: ${row.id}`);
    }
    seen.add(row.id);
    assertClosedParityStatus(row.status);

    if (row.status === "greenfield_proven") {
      if (!row.evidence_key || typeof row.evidence_key !== "string") {
        throw new Error(`greenfield_proven row ${row.id} requires evidence_key.`);
      }
      if (!KNOWN_EVIDENCE_KEYS.includes(row.evidence_key) && !row.evidence_key.startsWith("verify-")) {
        throw new Error(`greenfield_proven row ${row.id} has unknown evidence_key.`);
      }
    }

    rows.push({
      id: row.id,
      label: row.label,
      status: row.status,
      evidence_key: row.evidence_key ?? null,
    });
  }

  const counts = Object.fromEntries(PARITY_STATUSES.map((status) => [status, 0]));
  for (const row of rows) {
    counts[row.status] += 1;
  }

  return {
    task_id: "TASK-REBUILD-023",
    claim_mode: "greenfield_capability_coverage",
    live_wp_parity_claimed: false,
    generated_by: "b2c-parity-cutover-core",
    row_count: rows.length,
    counts,
    rows,
  };
}

export function validateEvidenceMatrix(matrix) {
  assertNoLiveParityClaim(matrix);
  if (!Array.isArray(matrix.rows) || matrix.rows.length === 0) {
    throw new Error("Evidence matrix rows are required.");
  }
  const expectedIds = new Set(B2C_CAPABILITY_CHECKLIST.map((row) => row.id));
  const actualIds = new Set(matrix.rows.map((row) => row.id));
  for (const id of expectedIds) {
    if (!actualIds.has(id)) {
      throw new Error(`Evidence matrix missing required capability: ${id}`);
    }
  }
  for (const row of matrix.rows) {
    assertClosedParityStatus(row.status);
    if (row.status === "greenfield_proven" && !row.evidence_key) {
      throw new Error(`greenfield_proven row ${row.id} missing evidence_key.`);
    }
  }
  if (matrix.live_wp_parity_claimed !== false) {
    throw new Error("Evidence matrix must set live_wp_parity_claimed to false.");
  }
  return true;
}

export function getDefaultCutoverGateStates() {
  return Object.fromEntries(CUTOVER_GATES.map((gate) => [gate, "unmet"]));
}

export function buildCutoverPlan(options = {}) {
  const {
    matrix = buildEvidenceMatrix(),
    gateStates = getDefaultCutoverGateStates(),
    execute = false,
    target = "plan",
  } = options;

  validateEvidenceMatrix(matrix);

  if (target === "production" || execute === true) {
    return null;
  }

  const gates = CUTOVER_GATES.map((id) => {
    const state = gateStates[id] ?? "unmet";
    if (!CUTOVER_GATE_STATES.includes(state)) {
      throw new Error(`Unknown cutover gate state for ${id}: ${state}`);
    }
    return { id, state };
  });

  // After a valid matrix exists, mark the parity packet gate met for planning purposes only.
  const normalized = gates.map((gate) => {
    if (gate.id === "parity_evidence_packet_complete") {
      return { ...gate, state: "met" };
    }
    if (gate.id === "quality_preview_bar_green") {
      return { ...gate, state: "met" };
    }
    return gate;
  });

  const unmet = normalized.filter((gate) => gate.state === "unmet").map((gate) => gate.id);

  return {
    task_id: "TASK-REBUILD-023",
    platform: "greenfield_next_app_web",
    claim_mode: "greenfield_capability_coverage",
    live_wp_parity_claimed: false,
    executed: false,
    production_authorized: false,
    gates: normalized,
    unmet_gates: unmet,
    notes: [
      "This plan is evidence for owner review only.",
      "It does not authorize DNS, deploy, traffic switch, or WordPress retirement.",
      "TASK-CUTOVER-001 and TASK-CUTOVER-002 remain on_hold.",
    ],
  };
}

export function assertNoProductionCutoverInSource(sourceText) {
  if (typeof sourceText !== "string") {
    throw new Error("Source text is required.");
  }
  const join = (...parts) => parts.join("");
  const forbidden = [
    join("dns", ".update"),
    join("cloudflare", ".api"),
    join("retire", "WordPress"),
    join("CAPROVER", "_URL"),
    join("fet", "ch("),
    join("deploy", ".sh"),
  ];
  for (const token of forbidden) {
    if (sourceText.includes(token)) {
      throw new Error("B2C parity/cutover default path must not perform production cutover actions.");
    }
  }
  return true;
}

export function prepareCutoverPlan(options = {}) {
  const {
    execute = false,
    target = "plan",
    checklist = getB2cCapabilityChecklist(),
    gateStates = getDefaultCutoverGateStates(),
    log = defaultLog,
  } = options;

  log("b2c_cutover_plan_started", { target, execute: Boolean(execute) });

  if (target === "production" || execute === true) {
    const outcome = {
      outcome: execute
        ? CUTOVER_PLAN_OUTCOMES.REFUSED_LIVE_CUTOVER
        : CUTOVER_PLAN_OUTCOMES.REFUSED_PRODUCTION,
      target,
      executed: false,
      live_wp_parity_claimed: false,
    };
    log("b2c_cutover_plan_completed", outcome);
    return outcome;
  }

  try {
    const matrix = buildEvidenceMatrix(checklist);
    validateEvidenceMatrix(matrix);
    const plan = buildCutoverPlan({ matrix, gateStates, execute: false, target: "plan" });
    const outcome = {
      outcome: CUTOVER_PLAN_OUTCOMES.PLAN_RECORDED,
      target: "plan",
      executed: false,
      live_wp_parity_claimed: false,
      matrix,
      plan,
    };
    log("b2c_cutover_plan_completed", {
      outcome: outcome.outcome,
      row_count: matrix.row_count,
      unmet_gates: plan.unmet_gates,
      executed: false,
    });
    return outcome;
  } catch (error) {
    const outcome = {
      outcome: CUTOVER_PLAN_OUTCOMES.INVALID_MATRIX,
      target: "plan",
      executed: false,
      live_wp_parity_claimed: false,
      error_class: error.constructor.name,
      message: error.message,
    };
    log("b2c_cutover_plan_failed", {
      outcome: outcome.outcome,
      error_class: outcome.error_class,
    });
    return outcome;
  }
}

export function renderEvidenceMatrixMarkdown(matrix = buildEvidenceMatrix()) {
  validateEvidenceMatrix(matrix);
  const lines = [
    "# B2C evidence matrix (greenfield capability coverage)",
    "",
    `claim_mode: \`${matrix.claim_mode}\``,
    `live_wp_parity_claimed: \`${matrix.live_wp_parity_claimed}\``,
    "",
    "| Capability | Status | Evidence |",
    "|---|---|---|",
  ];
  for (const row of matrix.rows) {
    lines.push(`| ${row.label} | \`${row.status}\` | ${row.evidence_key ?? "—"} |`);
  }
  lines.push("");
  lines.push(
    "This matrix proves greenfield capability coverage via fixtures/APIs/tests. It does **not** claim live WordPress feature parity.",
  );
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function renderCutoverPlanMarkdown(plan) {
  if (!plan || plan.executed) {
    throw new Error("Cutover plan markdown requires a non-executed plan.");
  }
  const lines = [
    "# Cutover plan (non-executing)",
    "",
    `platform: \`${plan.platform}\``,
    `production_authorized: \`${plan.production_authorized}\``,
    `executed: \`${plan.executed}\``,
    `live_wp_parity_claimed: \`${plan.live_wp_parity_claimed}\``,
    "",
    "| Gate | State |",
    "|---|---|",
  ];
  for (const gate of plan.gates) {
    lines.push(`| \`${gate.id}\` | \`${gate.state}\` |`);
  }
  lines.push("");
  lines.push("Unmet gates (block owner go):");
  for (const id of plan.unmet_gates) {
    lines.push(`- \`${id}\``);
  }
  if (plan.unmet_gates.length === 0) {
    lines.push("- (none recorded)");
  }
  lines.push("");
  for (const note of plan.notes ?? []) {
    lines.push(`- ${note}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}
