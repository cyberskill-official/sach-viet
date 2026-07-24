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
  attachArtifact,
  convertWonQuoteToOrder,
  createB2bOrderStore,
  getInstitutionOrder,
  getStaffOrder,
  listInstitutionOrders,
  listStaffOrders,
  transitionOrderStatus,
} from "../src/lib/b2b-order-core.mjs";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";

function harness() {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-b2b-order-"));
  const dbPath = join(directory, "b2b.sqlite");
  const catalog = createCatalogStore({ dbPath, log: () => {} });
  const quotes = createB2bQuoteStore({ dbPath, log: () => {} });
  const orders = createB2bOrderStore({ dbPath, log: () => {} });
  createCategory(catalog, { slug: "books", name: "Books" });
  const product = createProduct(catalog, { categorySlug: "books", slug: "book-one", title: "Book One" });
  writeVendorOffer(catalog, { id: "vendor-a", role: "vendor" }, { productId: product.id, vendorId: "vendor-a", priceUsd: "12.50", stockQuantity: 5 });
  return {
    directory,
    catalog,
    quotes,
    orders,
    product,
    staff: { id: "staff-b2b", role: "employee_b2b" },
    librarian: { id: "lib-a", role: "school_librarian" },
    other: { id: "lib-b", role: "school_librarian" },
    customer: { id: "cust", role: "customer" },
  };
}

function wonQuote(ctx) {
  const org = createOrganization(ctx.quotes, ctx.staff, { name: "Harris County Library" });
  addOrganizationMember(ctx.quotes, ctx.staff, { organizationId: org.id, userId: ctx.librarian.id });
  const list = createSelectionList(ctx.quotes, ctx.librarian, { title: "Spring titles" });
  addSelectionListItem(ctx.quotes, ctx.librarian, { selectionListId: list.id, productId: ctx.product.id, quantity: 2 });
  const quote = requestQuoteFromSelectionList(ctx.quotes, ctx.librarian, { selectionListId: list.id });
  setQuoteItemPrices(ctx.quotes, ctx.staff, { quoteId: quote.id, items: [{ id: quote.items[0].id, unitPriceUsd: "9.99" }] });
  transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "sent" });
  transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "negotiating" });
  transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "won" });
  return { org, quote };
}

test("staff convert a priced won quote into an awaiting_po order once", () => {
  const ctx = harness();
  try {
    const { quote } = wonQuote(ctx);
    assert.throws(() => convertWonQuoteToOrder(ctx.orders, ctx.customer, { quoteId: quote.id }), /B2B staff/);
    assert.throws(() => convertWonQuoteToOrder(ctx.orders, ctx.librarian, { quoteId: quote.id }), /B2B staff/);

    const draft = requestQuoteFromSelectionList(ctx.quotes, ctx.librarian, {
      selectionListId: ctx.quotes.db.prepare("SELECT selection_list_id AS id FROM b2b_quotes WHERE id = ?").get(quote.id).id,
    });
    assert.throws(() => convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: draft.id }), /Only won quotes/);

    const order = convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: quote.id });
    assert.equal(order.status, "awaiting_po");
    assert.equal(order.quoteId, quote.id);
    assert.equal(order.currency, "USD");
    assert.equal(order.subtotalUsd, "19.9800");
    assert.equal(order.items.length, 1);
    assert.equal(order.items[0].productId, ctx.product.id);
    assert.equal(order.items[0].quantity, 2);
    assert.equal(order.items[0].unitPriceUsd, "9.9900");
    assert.equal(Object.hasOwn(order.items[0], "vendorOfferId"), false);
    assert.throws(() => convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: quote.id }), /already has an order/);
    assert.equal(listStaffOrders(ctx.orders, ctx.staff).length, 1);
    assert.equal(getStaffOrder(ctx.orders, ctx.staff, order.id).id, order.id);
  } finally {
    ctx.orders.close();
    ctx.quotes.close();
    ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("conversion refuses unpriced won quotes and leaves the quote pipeline intact", () => {
  const ctx = harness();
  try {
    const org = createOrganization(ctx.quotes, ctx.staff, { name: "District" });
    addOrganizationMember(ctx.quotes, ctx.staff, { organizationId: org.id, userId: ctx.librarian.id });
    const list = createSelectionList(ctx.quotes, ctx.librarian, { title: "Unpriced" });
    addSelectionListItem(ctx.quotes, ctx.librarian, { selectionListId: list.id, productId: ctx.product.id, quantity: 1 });
    const quote = requestQuoteFromSelectionList(ctx.quotes, ctx.librarian, { selectionListId: list.id });
    transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "sent" });
    transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "negotiating" });
    transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "won" });
    assert.throws(() => convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: quote.id }), /unit price/);
    assert.equal(ctx.quotes.db.prepare("SELECT status FROM b2b_quotes WHERE id = ?").get(quote.id).status, "won");
    assert.equal(ctx.orders.db.prepare("SELECT COUNT(*) AS count FROM b2b_orders").get().count, 0);
    assert.equal(ctx.quotes.db.prepare("SELECT COUNT(*) AS count FROM b2b_quotes WHERE id = ?").get(quote.id).count, 1);
  } finally {
    ctx.orders.close();
    ctx.quotes.close();
    ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("staff attach private artifacts and confirm only after a purchase_order exists", () => {
  const ctx = harness();
  try {
    const { quote } = wonQuote(ctx);
    const order = convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: quote.id });
    assert.throws(() => transitionOrderStatus(ctx.orders, ctx.staff, { orderId: order.id, status: "confirmed" }), /purchase_order artifact/);
    assert.throws(
      () => attachArtifact(ctx.orders, ctx.staff, {
        orderId: order.id,
        kind: "purchase_order",
        referenceNumber: "PO-1",
        storageKey: "https://files.example/po.pdf",
      }),
      /public URL/,
    );
    const withContract = attachArtifact(ctx.orders, ctx.staff, {
      orderId: order.id,
      kind: "contract",
      referenceNumber: "CTR-9",
      storageKey: "private:contracts/ctr-9",
    });
    assert.equal(withContract.artifacts.length, 1);
    assert.equal(withContract.artifacts[0].kind, "contract");
    assert.equal(withContract.artifacts[0].storageKey, "private:contracts/ctr-9");
    assert.throws(() => transitionOrderStatus(ctx.orders, ctx.staff, { orderId: order.id, status: "confirmed" }), /purchase_order artifact/);
    const withPo = attachArtifact(ctx.orders, ctx.staff, {
      orderId: order.id,
      kind: "purchase_order",
      referenceNumber: "PO-100",
      storageKey: "private:pos/po-100",
    });
    assert.equal(withPo.artifacts.length, 2);
    assert.equal(transitionOrderStatus(ctx.orders, ctx.staff, { orderId: order.id, status: "confirmed" }).status, "confirmed");
    assert.throws(() => transitionOrderStatus(ctx.orders, ctx.staff, { orderId: order.id, status: "cancelled" }), /Cannot transition/);
  } finally {
    ctx.orders.close();
    ctx.quotes.close();
    ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("institution order reads stay blind and omit storage keys", () => {
  const ctx = harness();
  try {
    const { quote } = wonQuote(ctx);
    const order = convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: quote.id });
    attachArtifact(ctx.orders, ctx.staff, {
      orderId: order.id,
      kind: "purchase_order",
      referenceNumber: "PO-55",
      storageKey: "private:pos/po-55",
    });
    assert.throws(() => listInstitutionOrders(ctx.orders, ctx.customer), /Institution access/);
    assert.throws(() => listInstitutionOrders(ctx.orders, ctx.other), /membership/);
    const listed = listInstitutionOrders(ctx.orders, ctx.librarian);
    assert.equal(listed.length, 1);
    const viewed = getInstitutionOrder(ctx.orders, ctx.librarian, order.id);
    const encoded = JSON.stringify(viewed);
    assert.equal(Object.hasOwn(viewed, "createdBy"), false);
    assert.equal(viewed.artifacts[0].referenceNumber, "PO-55");
    assert.equal(Object.hasOwn(viewed.artifacts[0], "storageKey"), false);
    assert.equal(encoded.includes("vendor"), false);
    assert.equal(encoded.includes("supplier"), false);
    assert.equal(encoded.includes("storageKey"), false);
    assert.equal(encoded.includes("private:pos"), false);
    assert.equal(encoded.includes("session"), false);
    assert.equal(encoded.includes("stripe"), false);
    const otherOrg = createOrganization(ctx.quotes, ctx.staff, { name: "Other" });
    addOrganizationMember(ctx.quotes, ctx.staff, { organizationId: otherOrg.id, userId: ctx.other.id });
    assert.throws(() => getInstitutionOrder(ctx.orders, ctx.other, order.id), /denied/);
    assert.equal(transitionOrderStatus(ctx.orders, ctx.staff, { orderId: order.id, status: "cancelled" }).status, "cancelled");
  } finally {
    ctx.orders.close();
    ctx.quotes.close();
    ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});
