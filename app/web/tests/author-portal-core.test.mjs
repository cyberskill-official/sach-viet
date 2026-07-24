import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  allocateAuthorSales,
  computeAuthorEarnings,
  createAuthorManuscriptRequest,
  createAuthorPortalStore,
  createAuthorPayoutInstruction,
  getAuthorDashboard,
  getAuthorManuscriptRequest,
  getRoyaltyActivationGate,
  listAuthorManuscriptRequests,
  withdrawAuthorManuscriptRequest,
} from "../src/lib/author-portal-core.mjs";

function harness() {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-author-"));
  const dbPath = join(directory, "author.sqlite");
  const author = createAuthorPortalStore({ dbPath, log: () => {} });
  return {
    directory,
    author,
    auth: { id: "author-a", role: "author" },
    other: { id: "author-b", role: "author" },
    admin: { id: "admin-1", role: "admin" },
    customer: { id: "cust", role: "customer" },
  };
}

test("author can create list detail and withdraw own manuscript requests with status log", () => {
  const ctx = harness();
  try {
    assert.throws(
      () => createAuthorManuscriptRequest(ctx.author, ctx.customer, { title: "X", storageKey: "private/x" }),
      /Author access/,
    );
    assert.throws(
      () =>
        createAuthorManuscriptRequest(ctx.author, ctx.auth, {
          title: "Manuscript",
          storageKey: "https://cdn.example/file.pdf",
        }),
      /public URL/,
    );

    const created = createAuthorManuscriptRequest(ctx.author, ctx.auth, {
      title: "Diaspora poetry",
      notes: "Vietnamese manuscript",
      storageKey: "private/diaspora-poetry",
    });
    assert.equal(created.authorId, ctx.auth.id);
    assert.equal(created.status, "submitted");
    assert.equal(created.title, "Diaspora poetry");
    assert.equal("storageKey" in created, false);

    const listed = listAuthorManuscriptRequests(ctx.author, ctx.auth);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, created.id);

    const detail = getAuthorManuscriptRequest(ctx.author, ctx.auth, { requestId: created.id });
    assert.equal(detail.id, created.id);
    assert.equal(detail.logs.length, 1);
    assert.equal(detail.logs[0].status, "submitted");
    assert.equal(detail.logs[0].actorId, ctx.auth.id);
    assert.equal("storageKey" in detail, false);

    const otherList = listAuthorManuscriptRequests(ctx.author, ctx.other);
    assert.equal(otherList.length, 0);
    assert.throws(
      () => getAuthorManuscriptRequest(ctx.author, ctx.other, { requestId: created.id }),
      /another author/,
    );
    assert.throws(
      () => withdrawAuthorManuscriptRequest(ctx.author, ctx.other, { requestId: created.id }),
      /another author/,
    );

    const withdrawn = withdrawAuthorManuscriptRequest(ctx.author, ctx.auth, { requestId: created.id });
    assert.equal(withdrawn.status, "withdrawn");
    const after = getAuthorManuscriptRequest(ctx.author, ctx.auth, { requestId: created.id });
    assert.equal(after.logs.length, 2);
    assert.equal(after.logs[1].status, "withdrawn");
    assert.throws(
      () => withdrawAuthorManuscriptRequest(ctx.author, ctx.auth, { requestId: created.id }),
      /already withdrawn/,
    );
  } finally {
    ctx.author.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("author dashboard returns policy-pending earnings and stages under activation gate", () => {
  const ctx = harness();
  try {
    createAuthorManuscriptRequest(ctx.author, ctx.auth, {
      title: "Titles",
      storageKey: "private/titles",
    });
    const created = createAuthorManuscriptRequest(ctx.author, ctx.auth, {
      title: "Second",
      storageKey: "private/second",
    });
    withdrawAuthorManuscriptRequest(ctx.author, ctx.auth, { requestId: created.id });

    const gate = getRoyaltyActivationGate(ctx.author);
    assert.equal(gate.status, "pending");
    assert.equal(gate.financialActivationAllowed, false);
    assert.ok(gate.unresolvedDecisionAreas.includes("rate_and_split"));

    const dashboard = getAuthorDashboard(ctx.author, ctx.auth);
    assert.equal(dashboard.authorId, ctx.auth.id);
    assert.equal(dashboard.nonFinancial.submittedManuscriptRequestCount, 1);
    assert.equal(dashboard.nonFinancial.withdrawnManuscriptRequestCount, 1);
    assert.equal(dashboard.earnings.policyPending, true);
    assert.equal(dashboard.stages.policyPending, true);
    assert.equal(dashboard.activationGate.financialActivationAllowed, false);
    assert.equal("amountUsd" in dashboard.earnings, false);
    assert.equal("progress" in dashboard.stages, false);

    assert.throws(() => getAuthorDashboard(ctx.author, ctx.customer), /Author access/);
  } finally {
    ctx.author.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("financial activation paths refuse while decision-register acceptance is absent", () => {
  const ctx = harness();
  try {
    assert.throws(
      () => computeAuthorEarnings(ctx.author, ctx.auth, {}),
      /activation gate pending/,
    );
    assert.throws(
      () => allocateAuthorSales(ctx.author, ctx.auth, {}),
      /activation gate pending/,
    );
    assert.throws(
      () => createAuthorPayoutInstruction(ctx.author, ctx.auth, {}),
      /activation gate pending/,
    );
  } finally {
    ctx.author.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});
