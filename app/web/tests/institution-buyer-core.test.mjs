import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  addOrganizationMember,
  addSelectionListItem,
  createB2bQuoteStore,
  createOrganization,
  createSelectionList,
  requestQuoteFromSelectionList,
  setQuoteItemPrices,
  transitionQuoteStatus,
} from "../src/lib/b2b-quote-core.mjs";
import {
  convertWonQuoteToOrder,
  createB2bOrderStore,
  getInstitutionOrder,
  transitionOrderStatus,
} from "../src/lib/b2b-order-core.mjs";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";
import { seedStoredKey } from "./helpers/stored-object.mjs";
import {
  createInstitutionBuyerStore,
  getInstitutionBudget,
  getInstitutionMarcRecord,
  listInstitutionMarcRecords,
  registerInstitutionMarcRecord,
  submitInstitutionPurchaseOrder,
  upsertInstitutionBudget,
} from "../src/lib/institution-buyer-core.mjs";

async function harness() {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-institution-buyer-"));
  const dbPath = join(directory, "buyer.sqlite");
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  const quotes = await createB2bQuoteStore({ dbPath, log: () => {} });
  const orders = await createB2bOrderStore({ dbPath, log: () => {} });
  const buyer = await createInstitutionBuyerStore({ dbPath, log: () => {} });
  await createCategory(catalog, { slug: "books", name: "Books" });
  const product = await createProduct(catalog, { categorySlug: "books", slug: "book-one", title: "Book One" });
  const otherProduct = await createProduct(catalog, { categorySlug: "books", slug: "book-two", title: "Book Two" });
  await writeVendorOffer(catalog, { id: "vendor-a", role: "vendor" }, { productId: product.id, vendorId: "vendor-a", priceUsd: "12.50", stockQuantity: 5 });
  return {
    directory,
    catalog,
    quotes,
    orders,
    buyer,
    product,
    otherProduct,
    staff: { id: "staff-b2b", role: "employee_b2b" },
    librarian: { id: "lib-a", role: "school_librarian" },
    other: { id: "lib-b", role: "school_librarian" },
    customer: { id: "cust", role: "customer" },
  };
}

async function awaitingPoOrder(ctx) {
  const org = await createOrganization(ctx.quotes, ctx.staff, { name: "Harris County Library" });
  await addOrganizationMember(ctx.quotes, ctx.staff, { organizationId: org.id, userId: ctx.librarian.id });
  const list = await createSelectionList(ctx.quotes, ctx.librarian, { title: "Spring titles" });
  await addSelectionListItem(ctx.quotes, ctx.librarian, { selectionListId: list.id, productId: ctx.product.id, quantity: 2 });
  const quote = await requestQuoteFromSelectionList(ctx.quotes, ctx.librarian, { selectionListId: list.id });
  await setQuoteItemPrices(ctx.quotes, ctx.staff, { quoteId: quote.id, items: [{ id: quote.items[0].id, unitPriceUsd: "9.99" }] });
  await transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "sent" });
  await transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "negotiating" });
  await transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "won" });
  const order = await convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: quote.id });
  return { org, quote, order };
}

test("institution buyer can upsert and read an informational organization budget", async () => {
  const ctx = await harness();
  try {
    const { org } = await awaitingPoOrder(ctx);
    await assert.rejects(async () => await upsertInstitutionBudget(ctx.buyer, ctx.customer, { amountUsd: "100.00" }), /Institution access/);
    await assert.rejects(async () => await getInstitutionBudget(ctx.buyer, ctx.librarian), /Budget does not exist/);

    const budget = await upsertInstitutionBudget(ctx.buyer, ctx.librarian, { amountUsd: "2500.5" });
    assert.equal(budget.organizationId, org.id);
    assert.equal(budget.amountUsd, "2500.5000");
    assert.equal(budget.currency, "USD");

    const otherOrg = await createOrganization(ctx.quotes, ctx.staff, { name: "Other Library" });
    await addOrganizationMember(ctx.quotes, ctx.staff, { organizationId: otherOrg.id, userId: ctx.other.id });
    await assert.rejects(async () => await upsertInstitutionBudget(ctx.buyer, ctx.librarian, { organizationId: otherOrg.id, amountUsd: "1.00" }),
      /Budget access is denied/,
    );

    const reread = await getInstitutionBudget(ctx.buyer, ctx.librarian);
    assert.equal(reread.amountUsd, "2500.5000");

    const before = await ctx.orders.db.prepare("SELECT status FROM b2b_orders").all();
    await upsertInstitutionBudget(ctx.buyer, ctx.librarian, { amountUsd: "2600.00" });
    const after = await ctx.orders.db.prepare("SELECT status FROM b2b_orders").all();
    assert.deepEqual(after, before);
  } finally {
    await ctx.buyer.close();
    await ctx.orders.close();
    await ctx.quotes.close();
    await ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("institution buyer can submit a purchase_order artifact without changing order status", async () => {
  const ctx = await harness();
  try {
    const { order } = await awaitingPoOrder(ctx);
    await assert.rejects(async () => await submitInstitutionPurchaseOrder(ctx.buyer, ctx.customer, {
        orderId: order.id,
        referenceNumber: "PO-1",
        storageKey: "private/po-1",
      }),
      /Institution access/,
    );
    await assert.rejects(async () => await submitInstitutionPurchaseOrder(ctx.buyer, ctx.librarian, {
        orderId: order.id,
        referenceNumber: "PO-1",
        storageKey: "https://example.com/po.pdf",
      }),
      /public URL/,
    );

    await seedStoredKey(ctx.buyer, "private/po-hcpl-22");
    const submission = await submitInstitutionPurchaseOrder(ctx.buyer, ctx.librarian, {
      orderId: order.id,
      referenceNumber: "PO-HCPL-22",
      storageKey: "private/po-hcpl-22",
    });
    assert.equal(submission.status, "awaiting_po");
    assert.equal(submission.artifacts.length, 1);
    assert.equal(submission.artifacts[0].kind, "purchase_order");
    assert.equal(submission.artifacts[0].referenceNumber, "PO-HCPL-22");
    assert.equal("storageKey" in submission.artifacts[0], false);

    const blind = await getInstitutionOrder(ctx.orders, ctx.librarian, order.id);
    assert.equal(blind.status, "awaiting_po");
    assert.equal(blind.artifacts[0].referenceNumber, "PO-HCPL-22");
    assert.equal("storageKey" in blind.artifacts[0], false);
    assert.equal(JSON.stringify(blind).includes("vendor"), false);

    const otherOrg = await createOrganization(ctx.quotes, ctx.staff, { name: "Other Library" });
    await addOrganizationMember(ctx.quotes, ctx.staff, { organizationId: otherOrg.id, userId: ctx.other.id });
    await assert.rejects(async () => await submitInstitutionPurchaseOrder(ctx.buyer, ctx.other, {
        orderId: order.id,
        referenceNumber: "PO-X",
        storageKey: "private/x",
      }),
      /Order access is denied/,
    );
  } finally {
    await ctx.buyer.close();
    await ctx.orders.close();
    await ctx.quotes.close();
    await ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("MARC delivery is entitlement-gated to confirmed organization order products", async () => {
  const ctx = await harness();
  try {
    const { order } = await awaitingPoOrder(ctx);
    await assert.rejects(async () => await registerInstitutionMarcRecord(ctx.buyer, ctx.librarian, {
        productId: ctx.product.id,
        storageKey: "private/marc-1",
      }),
      /B2B staff access/,
    );
    await assert.rejects(async () => await registerInstitutionMarcRecord(ctx.buyer, ctx.staff, {
        productId: ctx.product.id,
        storageKey: "https://cdn.example/marc.mrc",
      }),
      /public URL/,
    );

    await seedStoredKey(ctx.buyer, "private/marc-book-one");
    await seedStoredKey(ctx.buyer, "private/marc-book-two");
    const registered = await registerInstitutionMarcRecord(ctx.buyer, ctx.staff, {
      productId: ctx.product.id,
      storageKey: "private/marc-book-one",
    });
    assert.equal(registered.storageKey, "private/marc-book-one");
    await registerInstitutionMarcRecord(ctx.buyer, ctx.staff, {
      productId: ctx.otherProduct.id,
      storageKey: "private/marc-book-two",
    });

    assert.deepEqual(await listInstitutionMarcRecords(ctx.buyer, ctx.librarian), []);
    await assert.rejects(async () => await getInstitutionMarcRecord(ctx.buyer, ctx.librarian, ctx.product.id), /MARC access is denied/);

    await seedStoredKey(ctx.buyer, "private/po-hcpl-22");
    await submitInstitutionPurchaseOrder(ctx.buyer, ctx.librarian, {
      orderId: order.id,
      referenceNumber: "PO-HCPL-22",
      storageKey: "private/po-hcpl-22",
    });
    await transitionOrderStatus(ctx.orders, ctx.staff, { orderId: order.id, status: "confirmed" });

    const listed = await listInstitutionMarcRecords(ctx.buyer, ctx.librarian);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].productId, ctx.product.id);
    assert.equal("storageKey" in listed[0], false);

    const detail = await getInstitutionMarcRecord(ctx.buyer, ctx.librarian, ctx.product.id);
    assert.equal(detail.storageKey, "private/marc-book-one");
    await assert.rejects(async () => await getInstitutionMarcRecord(ctx.buyer, ctx.librarian, ctx.otherProduct.id), /MARC access is denied/);
  } finally {
    await ctx.buyer.close();
    await ctx.orders.close();
    await ctx.quotes.close();
    await ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});
