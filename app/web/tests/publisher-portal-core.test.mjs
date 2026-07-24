import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createCatalogStore, createCategory, createProduct } from "../src/lib/catalog-core.mjs";
import {
  allocatePublisherSales,
  computePublisherRoyalties,
  createPublisherPayoutInstruction,
  createPublisherPortalStore,
  createPublishingRequest,
  getPublisherDashboard,
  getRoyaltyActivationGate,
  listPublisherMarcRecords,
  listPublishingRequests,
  registerPublisherMarcRecord,
  withdrawPublishingRequest,
} from "../src/lib/publisher-portal-core.mjs";

function harness() {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-publisher-"));
  const dbPath = join(directory, "publisher.sqlite");
  const catalog = createCatalogStore({ dbPath, log: () => {} });
  const publisher = createPublisherPortalStore({ dbPath, log: () => {} });
  createCategory(catalog, { slug: "books", name: "Books" });
  const product = createProduct(catalog, { categorySlug: "books", slug: "book-one", title: "Book One" });
  return {
    directory,
    catalog,
    publisher,
    product,
    pub: { id: "pub-a", role: "publisher" },
    other: { id: "pub-b", role: "publisher" },
    admin: { id: "admin-1", role: "admin" },
    customer: { id: "cust", role: "customer" },
  };
}

test("publisher can create list and withdraw own publishing requests", () => {
  const ctx = harness();
  try {
    assert.throws(
      () => createPublishingRequest(ctx.publisher, ctx.customer, { title: "X", storageKey: "private/x" }),
      /Publisher access/,
    );
    assert.throws(
      () =>
        createPublishingRequest(ctx.publisher, ctx.pub, {
          title: "Catalog spring",
          storageKey: "https://cdn.example/file.pdf",
        }),
      /public URL/,
    );

    const created = createPublishingRequest(ctx.publisher, ctx.pub, {
      title: "Catalog spring",
      notes: "Vietnamese titles",
      storageKey: "private/catalog-spring",
    });
    assert.equal(created.publisherId, ctx.pub.id);
    assert.equal(created.status, "submitted");
    assert.equal(created.title, "Catalog spring");
    assert.equal("storageKey" in created, false);

    const listed = listPublishingRequests(ctx.publisher, ctx.pub);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, created.id);

    const otherList = listPublishingRequests(ctx.publisher, ctx.other);
    assert.equal(otherList.length, 0);
    assert.throws(
      () => withdrawPublishingRequest(ctx.publisher, ctx.other, { requestId: created.id }),
      /another publisher/,
    );

    const withdrawn = withdrawPublishingRequest(ctx.publisher, ctx.pub, { requestId: created.id });
    assert.equal(withdrawn.status, "withdrawn");
    assert.throws(
      () => withdrawPublishingRequest(ctx.publisher, ctx.pub, { requestId: created.id }),
      /already withdrawn/,
    );
  } finally {
    ctx.publisher.close();
    ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("publisher can register and list private MARC metadata for existing products", () => {
  const ctx = harness();
  try {
    assert.throws(
      () =>
        registerPublisherMarcRecord(ctx.publisher, ctx.pub, {
          productId: "missing",
          storageKey: "private/marc-1",
        }),
      /Product does not exist/,
    );
    assert.throws(
      () =>
        registerPublisherMarcRecord(ctx.publisher, ctx.pub, {
          productId: ctx.product.id,
          storageKey: "https://cdn.example/marc.mrc",
        }),
      /public URL/,
    );

    const registered = registerPublisherMarcRecord(ctx.publisher, ctx.pub, {
      productId: ctx.product.id,
      storageKey: "private/marc-book-one",
    });
    assert.equal(registered.publisherId, ctx.pub.id);
    assert.equal(registered.productId, ctx.product.id);
    assert.equal("storageKey" in registered, false);

    const listed = listPublisherMarcRecords(ctx.publisher, ctx.pub);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].productId, ctx.product.id);
    assert.equal("storageKey" in listed[0], false);

    const otherList = listPublisherMarcRecords(ctx.publisher, ctx.other);
    assert.equal(otherList.length, 0);

    const institutionTables = ctx.publisher.db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'institution_marc_records'`)
      .get();
    assert.equal(institutionTables, undefined);
  } finally {
    ctx.publisher.close();
    ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("publisher dashboard returns policy-pending financial placeholders under activation gate", () => {
  const ctx = harness();
  try {
    createPublishingRequest(ctx.publisher, ctx.pub, {
      title: "Titles",
      storageKey: "private/titles",
    });
    registerPublisherMarcRecord(ctx.publisher, ctx.pub, {
      productId: ctx.product.id,
      storageKey: "private/marc",
    });

    const gate = getRoyaltyActivationGate(ctx.publisher);
    assert.equal(gate.status, "pending");
    assert.equal(gate.financialActivationAllowed, false);
    assert.ok(gate.unresolvedDecisionAreas.includes("rate_and_split"));

    const dashboard = getPublisherDashboard(ctx.publisher, ctx.pub);
    assert.equal(dashboard.publisherId, ctx.pub.id);
    assert.equal(dashboard.nonFinancial.submittedPublishingRequestCount, 1);
    assert.equal(dashboard.nonFinancial.marcRecordCount, 1);
    assert.equal(dashboard.royalties.policyPending, true);
    assert.equal(dashboard.sales.policyPending, true);
    assert.equal(dashboard.contracts.policyPending, true);
    assert.equal(dashboard.activationGate.financialActivationAllowed, false);
    assert.equal("amountUsd" in dashboard.royalties, false);
    assert.equal("totalUsd" in dashboard.sales, false);

    assert.throws(() => getPublisherDashboard(ctx.publisher, ctx.customer), /Publisher access/);
  } finally {
    ctx.publisher.close();
    ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("financial activation paths refuse while decision-register acceptance is absent", () => {
  const ctx = harness();
  try {
    assert.throws(
      () => computePublisherRoyalties(ctx.publisher, ctx.pub, {}),
      /activation gate pending/,
    );
    assert.throws(
      () => allocatePublisherSales(ctx.publisher, ctx.pub, {}),
      /activation gate pending/,
    );
    assert.throws(
      () => createPublisherPayoutInstruction(ctx.publisher, ctx.pub, {}),
      /activation gate pending/,
    );
  } finally {
    ctx.publisher.close();
    ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});
