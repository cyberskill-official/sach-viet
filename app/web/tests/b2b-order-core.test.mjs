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
import { seedStoredKey } from "./helpers/stored-object.mjs";

async function harness() {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-b2b-order-"));
  const dbPath = join(directory, "b2b.sqlite");
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  const quotes = await createB2bQuoteStore({ dbPath, log: () => {} });
  const orders = await createB2bOrderStore({ dbPath, log: () => {} });
  await createCategory(catalog, { slug: "books", name: "Books" });
  const product = await createProduct(catalog, { categorySlug: "books", slug: "book-one", title: "Book One" });
  await writeVendorOffer(catalog, { id: "vendor-a", role: "vendor" }, { productId: product.id, vendorId: "vendor-a", priceUsd: "12.50", stockQuantity: 5 });
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

async function wonQuote(ctx) {
  const org = await createOrganization(ctx.quotes, ctx.staff, { name: "Harris County Library" });
  await addOrganizationMember(ctx.quotes, ctx.staff, { organizationId: org.id, userId: ctx.librarian.id });
  const list = await createSelectionList(ctx.quotes, ctx.librarian, { title: "Spring titles" });
  await addSelectionListItem(ctx.quotes, ctx.librarian, { selectionListId: list.id, productId: ctx.product.id, quantity: 2 });
  const quote = await requestQuoteFromSelectionList(ctx.quotes, ctx.librarian, { selectionListId: list.id });
  await setQuoteItemPrices(ctx.quotes, ctx.staff, { quoteId: quote.id, items: [{ id: quote.items[0].id, unitPriceUsd: "9.99" }] });
  await transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "sent" });
  await transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "negotiating" });
  await transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "won" });
  return { org, quote };
}

test("staff convert a priced won quote into an awaiting_po order once", async () => {
  const ctx = await harness();
  try {
    const { quote } = await wonQuote(ctx);
    await assert.rejects(async () => await convertWonQuoteToOrder(ctx.orders, ctx.customer, { quoteId: quote.id }), /B2B staff/);
    await assert.rejects(async () => await convertWonQuoteToOrder(ctx.orders, ctx.librarian, { quoteId: quote.id }), /B2B staff/);

    const draft = await requestQuoteFromSelectionList(ctx.quotes, ctx.librarian, {
      selectionListId: (await ctx.quotes.db.prepare("SELECT selection_list_id AS id FROM b2b_quotes WHERE id = ?").get(quote.id)).id,
    });
    await assert.rejects(async () => await convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: draft.id }), /Only won quotes/);

    const order = await convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: quote.id });
    assert.equal(order.status, "awaiting_po");
    assert.equal(order.quoteId, quote.id);
    assert.equal(order.currency, "USD");
    assert.equal(order.subtotalUsd, "19.9800");
    assert.equal(order.items.length, 1);
    assert.equal(order.items[0].productId, ctx.product.id);
    assert.equal(order.items[0].quantity, 2);
    assert.equal(order.items[0].unitPriceUsd, "9.9900");
    assert.equal(Object.hasOwn(order.items[0], "vendorOfferId"), false);
    await assert.rejects(async () => await convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: quote.id }), /already has an order/);
    assert.equal((await listStaffOrders(ctx.orders, ctx.staff)).length, 1);
    assert.equal((await getStaffOrder(ctx.orders, ctx.staff, order.id)).id, order.id);
  } finally {
    await ctx.orders.close();
    await ctx.quotes.close();
    await ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("conversion refuses unpriced won quotes and leaves the quote pipeline intact", async () => {
  const ctx = await harness();
  try {
    const org = await createOrganization(ctx.quotes, ctx.staff, { name: "District" });
    await addOrganizationMember(ctx.quotes, ctx.staff, { organizationId: org.id, userId: ctx.librarian.id });
    const list = await createSelectionList(ctx.quotes, ctx.librarian, { title: "Unpriced" });
    await addSelectionListItem(ctx.quotes, ctx.librarian, { selectionListId: list.id, productId: ctx.product.id, quantity: 1 });
    const quote = await requestQuoteFromSelectionList(ctx.quotes, ctx.librarian, { selectionListId: list.id });
    await transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "sent" });
    await transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "negotiating" });
    await transitionQuoteStatus(ctx.quotes, ctx.staff, { quoteId: quote.id, status: "won" });
    await assert.rejects(async () => await convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: quote.id }), /unit price/);
    assert.equal((await ctx.quotes.db.prepare("SELECT status FROM b2b_quotes WHERE id = ?").get(quote.id)).status, "won");
    assert.equal((await ctx.orders.db.prepare("SELECT COUNT(*) AS count FROM b2b_orders").get()).count, 0);
    assert.equal((await ctx.quotes.db.prepare("SELECT COUNT(*) AS count FROM b2b_quotes WHERE id = ?").get(quote.id)).count, 1);
  } finally {
    await ctx.orders.close();
    await ctx.quotes.close();
    await ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("staff attach private artifacts and confirm only after a purchase_order exists", async () => {
  const ctx = await harness();
  try {
    const { quote } = await wonQuote(ctx);
    const order = await convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: quote.id });
    await assert.rejects(async () => await transitionOrderStatus(ctx.orders, ctx.staff, { orderId: order.id, status: "confirmed" }), /purchase_order artifact/);
    await assert.rejects(async () => await attachArtifact(ctx.orders, ctx.staff, {
        orderId: order.id,
        kind: "purchase_order",
        referenceNumber: "PO-1",
        storageKey: "https://files.example/po.pdf",
      }),
      /public URL/,
    );
    await seedStoredKey(ctx.orders, "private:contracts/ctr-9");
    await seedStoredKey(ctx.orders, "private:pos/po-100");
    const withContract = await attachArtifact(ctx.orders, ctx.staff, {
      orderId: order.id,
      kind: "contract",
      referenceNumber: "CTR-9",
      storageKey: "private:contracts/ctr-9",
    });
    assert.equal(withContract.artifacts.length, 1);
    assert.equal(withContract.artifacts[0].kind, "contract");
    assert.equal(withContract.artifacts[0].storageKey, "private:contracts/ctr-9");
    await assert.rejects(async () => await transitionOrderStatus(ctx.orders, ctx.staff, { orderId: order.id, status: "confirmed" }), /purchase_order artifact/);
    const withPo = await attachArtifact(ctx.orders, ctx.staff, {
      orderId: order.id,
      kind: "purchase_order",
      referenceNumber: "PO-100",
      storageKey: "private:pos/po-100",
    });
    assert.equal(withPo.artifacts.length, 2);
    assert.equal((await transitionOrderStatus(ctx.orders, ctx.staff, { orderId: order.id, status: "confirmed" })).status, "confirmed");
    await assert.rejects(async () => await transitionOrderStatus(ctx.orders, ctx.staff, { orderId: order.id, status: "cancelled" }), /Cannot transition/);
  } finally {
    await ctx.orders.close();
    await ctx.quotes.close();
    await ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});

test("institution order reads stay blind and omit storage keys", async () => {
  const ctx = await harness();
  try {
    const { quote } = await wonQuote(ctx);
    const order = await convertWonQuoteToOrder(ctx.orders, ctx.staff, { quoteId: quote.id });
    await seedStoredKey(ctx.orders, "private:pos/po-55");
    await attachArtifact(ctx.orders, ctx.staff, {
      orderId: order.id,
      kind: "purchase_order",
      referenceNumber: "PO-55",
      storageKey: "private:pos/po-55",
    });
    await assert.rejects(async () => await listInstitutionOrders(ctx.orders, ctx.customer), /Institution access/);
    await assert.rejects(async () => await listInstitutionOrders(ctx.orders, ctx.other), /membership/);
    const listed = await listInstitutionOrders(ctx.orders, ctx.librarian);
    assert.equal(listed.length, 1);
    const viewed = await getInstitutionOrder(ctx.orders, ctx.librarian, order.id);
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
    const otherOrg = await createOrganization(ctx.quotes, ctx.staff, { name: "Other" });
    await addOrganizationMember(ctx.quotes, ctx.staff, { organizationId: otherOrg.id, userId: ctx.other.id });
    await assert.rejects(async () => await getInstitutionOrder(ctx.orders, ctx.other, order.id), /denied/);
    assert.equal((await transitionOrderStatus(ctx.orders, ctx.staff, { orderId: order.id, status: "cancelled" })).status, "cancelled");
  } finally {
    await ctx.orders.close();
    await ctx.quotes.close();
    await ctx.catalog.close();
    rmSync(ctx.directory, { recursive: true, force: true });
  }
});
