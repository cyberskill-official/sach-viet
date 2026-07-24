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
import {
  createInstitutionBuyerStore,
  getInstitutionBudget,
  getInstitutionMarcRecord,
  listInstitutionMarcRecords,
  registerInstitutionMarcRecord,
  submitInstitutionPurchaseOrder,
  upsertInstitutionBudget,
} from "../src/lib/institution-buyer-core.mjs";

function harness() {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-institution-buyer-"));
  const dbPath = join(directory, "buyer.sqlite");
  const catalog = createCatalogStore({ dbPath, log: () => {} });
  const quotes = createB2bQuoteStore({ dbPath, log: () => {} });
  const orders = createB2bOrderStore({ dbPath, log: () => {} });
  const buyer = createInstitutionBuyerStore({ dbPath, log: () => {} });
  createCategory(catalog, { slug: "books", name: "Books" });
  const product = createProduct(catalog, { categorySlug: "books", slug: "book-one", title: "Book One" });
  const otherProduct = createProduct(catalog, { categorySlug: "books", slug: "book-two", title: "Book Two" });
  writeVendorOffer(catalog, { id: "vendor-a", role: "vendor" }, { productId: product.id, vendorId: "vendor-a", priceUsd: "12.50", stockQuantity: 5 });
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

function awaitingPoOrder(ctx) {
  const org = createOrganization(ctx.quotes, ctx.staff, { name: "Harris County Library" });
  addOrganizationMember(ctx.quotes, ctx.staff, { organizationId: org.id, userId: ctx.librarian.id });
  const list = createSelectionList(ctx.quotes, ctx.librarian, { title: "Spring titles" });
  addSelectionListItem(ctx.quotes, ctx.librarian, { selectionListId: list.id, productId: ctx.product.id, quantity: 2 });
  const quote = requestQuoteFromSelectionList(ctx.quotes, ctx.librarian, { selectionListId: list.id });
  setQuoteItemPrices(ctx.quotes, ctx.staff, { quoteId: quote.id, items: [{ id: quote.items[0].id, unitPriceUsd: "9.99" }] });
  transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "sent" });
  transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "negotiating" });
  transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "won" });
  const order = convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: quote.id });
  return { org, quote, order };
}

test("institution buyer can upsert and read an informational organization budget", () => {
  const ctx = harness();
  try {
    const { org } = awaitingPoOrder(ctx);
    assert.throws(() => upsertInstitutionBudget(ctx.buyer, ctx.customer, { amountUsd: "100.00" }), /Institution access/);
    assert.throws(() => getInstitutionBudget(ctx.buyer, ctx.librarian), /Budget does not exist/);

    const budget = upsertInstitutionBudget(ctx.buyer, ctx.librarian, { amountUsd: "2500.5" });
    assert.equal(budget.organizationId, org.id);
    assert.equal(budget.amountUsd, "2500.5000");
    assert.equal(budget.currency, "USD");

    const otherOrg = createOrganization(ctx.quotes, ctx.staff, { name: "Other Library" });
    addOrganizationMember(ctx.quotes, ctx.staff, { organizationId: otherOrg.id, userId: ctx.other.id });
    assert.throws(
      () => upsertInstitutionBudget(ctx.buyer, ctx.librarian, { organizationId: otherOrg.id, amountUsd: "1.00" }),
      /Budget access is denied/,
    );

    const reread = getInstitutionBudget(ctx.buyer, ctx.librarian);
    assert.equal(reread.amountUsd, "2500.5000");

    const before = ctx.orders.db.prepare("SELECT status FROM b2b_orders").all();
    upsertInstitutionBudget(ctx.buyer, ctx.librarian, { amountUsd: "2600.00" });
    const after = ctx.orders.db.prepare("SELECT status FROM b2b_orders").all();
    assert.deepEqual(after, before);
  } finally {
    ctx.buyer.close();
    ctx.orders.close();
    ctx.quotes.close();
    ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("institution buyer can submit a purchase_order artifact without changing order status", () => {
  const ctx = harness();
  try {
    const { order } = awaitingPoOrder(ctx);
    assert.throws(
      () => submitInstitutionPurchaseOrder(ctx.buyer, ctx.customer, {
        orderId: order.id,
        referenceNumber: "PO-1",
        storageKey: "private/po-1",
      }),
      /Institution access/,
    );
    assert.throws(
      () => submitInstitutionPurchaseOrder(ctx.buyer, ctx.librarian, {
        orderId: order.id,
        referenceNumber: "PO-1",
        storageKey: "https://example.com/po.pdf",
      }),
      /public URL/,
    );

    const submission = submitInstitutionPurchaseOrder(ctx.buyer, ctx.librarian, {
      orderId: order.id,
      referenceNumber: "PO-HCPL-22",
      storageKey: "private/po-hcpl-22",
    });
    assert.equal(submission.status, "awaiting_po");
    assert.equal(submission.artifacts.length, 1);
    assert.equal(submission.artifacts[0].kind, "purchase_order");
    assert.equal(submission.artifacts[0].referenceNumber, "PO-HCPL-22");
    assert.equal("storageKey" in submission.artifacts[0], false);

    const blind = getInstitutionOrder(ctx.orders, ctx.librarian, order.id);
    assert.equal(blind.status, "awaiting_po");
    assert.equal(blind.artifacts[0].referenceNumber, "PO-HCPL-22");
    assert.equal("storageKey" in blind.artifacts[0], false);
    assert.equal(JSON.stringify(blind).includes("vendor"), false);

    const otherOrg = createOrganization(ctx.quotes, ctx.staff, { name: "Other Library" });
    addOrganizationMember(ctx.quotes, ctx.staff, { organizationId: otherOrg.id, userId: ctx.other.id });
    assert.throws(
      () => submitInstitutionPurchaseOrder(ctx.buyer, ctx.other, {
        orderId: order.id,
        referenceNumber: "PO-X",
        storageKey: "private/x",
      }),
      /Order access is denied/,
    );
  } finally {
    ctx.buyer.close();
    ctx.orders.close();
    ctx.quotes.close();
    ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("MARC delivery is entitlement-gated to confirmed organization order products", () => {
  const ctx = harness();
  try {
    const { order } = awaitingPoOrder(ctx);
    assert.throws(
      () => registerInstitutionMarcRecord(ctx.buyer, ctx.librarian, {
        productId: ctx.product.id,
        storageKey: "private/marc-1",
      }),
      /B2B staff access/,
    );
    assert.throws(
      () => registerInstitutionMarcRecord(ctx.buyer, ctx.staff, {
        productId: ctx.product.id,
        storageKey: "https://cdn.example/marc.mrc",
      }),
      /public URL/,
    );

    const registered = registerInstitutionMarcRecord(ctx.buyer, ctx.staff, {
      productId: ctx.product.id,
      storageKey: "private/marc-book-one",
    });
    assert.equal(registered.storageKey, "private/marc-book-one");
    registerInstitutionMarcRecord(ctx.buyer, ctx.staff, {
      productId: ctx.otherProduct.id,
      storageKey: "private/marc-book-two",
    });

    assert.deepEqual(listInstitutionMarcRecords(ctx.buyer, ctx.librarian), []);
    assert.throws(() => getInstitutionMarcRecord(ctx.buyer, ctx.librarian, ctx.product.id), /MARC access is denied/);

    submitInstitutionPurchaseOrder(ctx.buyer, ctx.librarian, {
      orderId: order.id,
      referenceNumber: "PO-HCPL-22",
      storageKey: "private/po-hcpl-22",
    });
    transitionOrderStatus(ctx.orders, ctx.staff, { orderId: order.id, status: "confirmed" });

    const listed = listInstitutionMarcRecords(ctx.buyer, ctx.librarian);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].productId, ctx.product.id);
    assert.equal("storageKey" in listed[0], false);

    const detail = getInstitutionMarcRecord(ctx.buyer, ctx.librarian, ctx.product.id);
    assert.equal(detail.storageKey, "private/marc-book-one");
    assert.throws(() => getInstitutionMarcRecord(ctx.buyer, ctx.librarian, ctx.otherProduct.id), /MARC access is denied/);
  } finally {
    ctx.buyer.close();
    ctx.orders.close();
    ctx.quotes.close();
    ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});
