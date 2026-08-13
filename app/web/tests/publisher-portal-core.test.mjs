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
import { seedStoredKey } from "./helpers/stored-object.mjs";

async function harness() {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-publisher-"));
  const dbPath = join(directory, "publisher.sqlite");
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  const publisher = await createPublisherPortalStore({ dbPath, log: () => {} });
  await createCategory(catalog, { slug: "books", name: "Books" });
  const product = await createProduct(catalog, { categorySlug: "books", slug: "book-one", title: "Book One" });
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

test("publisher can create list and withdraw own publishing requests", async () => {
  const ctx = await harness();
  try {
    await assert.rejects(async () => await createPublishingRequest(ctx.publisher, ctx.customer, { title: "X", storageKey: "private/x" }),
      /Publisher access/,
    );
    await assert.rejects(async () =>
        await createPublishingRequest(ctx.publisher, ctx.pub, {
          title: "Catalog spring",
          storageKey: "https://cdn.example/file.pdf",
        }),
      /public URL/,
    );

    await seedStoredKey(ctx.publisher, "private/catalog-spring");
    const created = await createPublishingRequest(ctx.publisher, ctx.pub, {
      title: "Catalog spring",
      notes: "Vietnamese titles",
      storageKey: "private/catalog-spring",
    });
    assert.equal(created.publisherId, ctx.pub.id);
    assert.equal(created.status, "submitted");
    assert.equal(created.title, "Catalog spring");
    assert.equal("storageKey" in created, false);

    const listed = await listPublishingRequests(ctx.publisher, ctx.pub);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, created.id);

    const otherList = await listPublishingRequests(ctx.publisher, ctx.other);
    assert.equal(otherList.length, 0);
    await assert.rejects(async () => await withdrawPublishingRequest(ctx.publisher, ctx.other, { requestId: created.id }),
      /another publisher/,
    );

    const withdrawn = await withdrawPublishingRequest(ctx.publisher, ctx.pub, { requestId: created.id });
    assert.equal(withdrawn.status, "withdrawn");
    await assert.rejects(async () => await withdrawPublishingRequest(ctx.publisher, ctx.pub, { requestId: created.id }),
      /already withdrawn/,
    );
  } finally {
    await ctx.publisher.close();
    await ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("publisher can register and list private MARC metadata for existing products", async () => {
  const ctx = await harness();
  try {
    await assert.rejects(async () =>
        await registerPublisherMarcRecord(ctx.publisher, ctx.pub, {
          productId: "missing",
          storageKey: "private/marc-1",
        }),
      /Product does not exist/,
    );
    await assert.rejects(async () =>
        await registerPublisherMarcRecord(ctx.publisher, ctx.pub, {
          productId: ctx.product.id,
          storageKey: "https://cdn.example/marc.mrc",
        }),
      /public URL/,
    );

    await seedStoredKey(ctx.publisher, "private/marc-book-one");
    const registered = await registerPublisherMarcRecord(ctx.publisher, ctx.pub, {
      productId: ctx.product.id,
      storageKey: "private/marc-book-one",
    });
    assert.equal(registered.publisherId, ctx.pub.id);
    assert.equal(registered.productId, ctx.product.id);
    assert.equal("storageKey" in registered, false);

    const listed = await listPublisherMarcRecords(ctx.publisher, ctx.pub);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].productId, ctx.product.id);
    assert.equal("storageKey" in listed[0], false);

    const otherList = await listPublisherMarcRecords(ctx.publisher, ctx.other);
    assert.equal(otherList.length, 0);

    // publisher-portal-core must not write into the institution_marc_records domain table
    const institutionRecordCount = (await ctx.publisher.db
      .prepare("SELECT COUNT(*) AS count FROM institution_marc_records")
      .get()).count;
    assert.equal(institutionRecordCount, 0);
  } finally {
    await ctx.publisher.close();
    await ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("publisher dashboard returns policy-pending financial placeholders under activation gate", async () => {
  const ctx = await harness();
  try {
    await seedStoredKey(ctx.publisher, "private/titles");
    await seedStoredKey(ctx.publisher, "private/marc");
    await createPublishingRequest(ctx.publisher, ctx.pub, {
      title: "Titles",
      storageKey: "private/titles",
    });
    await registerPublisherMarcRecord(ctx.publisher, ctx.pub, {
      productId: ctx.product.id,
      storageKey: "private/marc",
    });

    const gate = await getRoyaltyActivationGate(ctx.publisher);
    assert.equal(gate.status, "pending");
    assert.equal(gate.financialActivationAllowed, false);
    assert.ok(gate.unresolvedDecisionAreas.includes("rate_and_split"));

    const dashboard = await getPublisherDashboard(ctx.publisher, ctx.pub);
    assert.equal(dashboard.publisherId, ctx.pub.id);
    assert.equal(dashboard.nonFinancial.submittedPublishingRequestCount, 1);
    assert.equal(dashboard.nonFinancial.marcRecordCount, 1);
    assert.equal(dashboard.royalties.policyPending, true);
    assert.equal(dashboard.sales.policyPending, true);
    assert.equal(dashboard.contracts.policyPending, true);
    assert.equal(dashboard.activationGate.financialActivationAllowed, false);
    assert.equal("amountUsd" in dashboard.royalties, false);
    assert.equal("totalUsd" in dashboard.sales, false);

    await assert.rejects(async () => await getPublisherDashboard(ctx.publisher, ctx.customer), /Publisher access/);
  } finally {
    await ctx.publisher.close();
    await ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("financial activation paths refuse while decision-register acceptance is absent", async () => {
  const ctx = await harness();
  try {
    await assert.rejects(
      () => computePublisherRoyalties(ctx.publisher, ctx.pub, {}),
      /activation gate pending/,
    );
    await assert.rejects(
      () => allocatePublisherSales(ctx.publisher, ctx.pub, {}),
      /activation gate pending/,
    );
    await assert.rejects(
      () => createPublisherPayoutInstruction(ctx.publisher, ctx.pub, {}),
      /activation gate pending/,
    );
  } finally {
    await ctx.publisher.close();
    await ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});
