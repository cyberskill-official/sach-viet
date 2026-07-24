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
  getInstitutionQuote,
  getStaffQuote,
  listInstitutionQuotes,
  listQuotesPipeline,
  listSelectionLists,
  requestQuoteFromSelectionList,
  setQuoteItemPrices,
  transitionQuoteStatus,
} from "../src/lib/b2b-quote-core.mjs";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";

function harness() {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-b2b-quote-"));
  const dbPath = join(directory, "b2b.sqlite");
  const catalog = createCatalogStore({ dbPath, log: () => {} });
  const store = createB2bQuoteStore({ dbPath, log: () => {} });
  createCategory(catalog, { slug: "books", name: "Books" });
  const product = createProduct(catalog, { categorySlug: "books", slug: "book-one", title: "Book One" });
  writeVendorOffer(catalog, { id: "vendor-a", role: "vendor" }, { productId: product.id, vendorId: "vendor-a", priceUsd: "12.50", stockQuantity: 5 });
  return { directory, catalog, store, product, staff: { id: "staff-b2b", role: "employee_b2b" }, librarian: { id: "lib-a", role: "school_librarian" }, other: { id: "lib-b", role: "school_librarian" }, customer: { id: "cust", role: "customer" } };
}

test("institution buyers request draft quotes from selection lists", () => {
  const { directory, catalog, store, product, staff, librarian, other, customer } = harness();
  try {
    assert.throws(() => createOrganization(store, customer, { name: "Harris County" }), /B2B staff/);
    const org = createOrganization(store, staff, { name: "Harris County Library" });
    addOrganizationMember(store, staff, { organizationId: org.id, userId: librarian.id });
    assert.throws(() => createSelectionList(store, librarian, { title: "" }), /required/);
    const list = createSelectionList(store, librarian, { title: "Spring Vietnamese titles" });
    assert.throws(() => addSelectionListItem(store, librarian, { selectionListId: list.id, productId: product.id, quantity: 0 }), /positive integer/);
    assert.throws(() => requestQuoteFromSelectionList(store, librarian, { selectionListId: list.id }), /at least one item/);
    addSelectionListItem(store, librarian, { selectionListId: list.id, productId: product.id, quantity: 3 });
    assert.equal(listSelectionLists(store, librarian).length, 1);
    assert.throws(() => listSelectionLists(store, other), /membership/);
    const quote = requestQuoteFromSelectionList(store, librarian, { selectionListId: list.id });
    assert.equal(quote.status, "draft");
    assert.equal(quote.items.length, 1);
    assert.equal(quote.items[0].productId, product.id);
    assert.equal(quote.items[0].quantity, 3);
    assert.equal(Object.hasOwn(quote, "createdBy"), false);
    assert.equal(Object.hasOwn(quote, "vendorId"), false);
    assert.equal(JSON.stringify(quote).includes("vendor"), false);
    assert.equal(listInstitutionQuotes(store, librarian).length, 1);
    const otherOrg = createOrganization(store, staff, { name: "Other Library" });
    addOrganizationMember(store, staff, { organizationId: otherOrg.id, userId: other.id });
    assert.throws(() => getInstitutionQuote(store, other, quote.id), /denied/);
  } finally {
    store.close();
    catalog.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("B2B staff advance the closed quote pipeline and set prices without creating orders", () => {
  const { directory, catalog, store, product, staff, librarian, customer } = harness();
  try {
    const org = createOrganization(store, staff, { name: "School District" });
    addOrganizationMember(store, staff, { organizationId: org.id, userId: librarian.id });
    const list = createSelectionList(store, librarian, { title: "District list" });
    addSelectionListItem(store, librarian, { selectionListId: list.id, productId: product.id, quantity: 2 });
    const quote = requestQuoteFromSelectionList(store, librarian, { selectionListId: list.id });
    assert.throws(() => listQuotesPipeline(store, librarian), /B2B staff/);
    assert.throws(() => transitionQuoteStatus(store, customer, { quoteId: quote.id, status: "sent" }), /B2B staff/);
    const priced = setQuoteItemPrices(store, staff, { quoteId: quote.id, items: [{ id: quote.items[0].id, unitPriceUsd: "9.99" }] });
    assert.equal(priced.items[0].unitPriceUsd, "9.9900");
    assert.equal(transitionQuoteStatus(store, staff, { quoteId: quote.id, status: "sent" }).status, "sent");
    assert.throws(() => transitionQuoteStatus(store, staff, { quoteId: quote.id, status: "won" }), /Cannot transition/);
    assert.equal(transitionQuoteStatus(store, staff, { quoteId: quote.id, status: "negotiating" }).status, "negotiating");
    assert.equal(transitionQuoteStatus(store, staff, { quoteId: quote.id, status: "won" }).status, "won");
    assert.throws(() => setQuoteItemPrices(store, staff, { quoteId: quote.id, items: [{ id: quote.items[0].id, unitPriceUsd: "1.00" }] }), /before a terminal/);
    const pipeline = listQuotesPipeline(store, staff);
    assert.equal(pipeline.won.length, 1);
    assert.equal(pipeline.draft.length, 0);
    const detail = getStaffQuote(store, staff, quote.id);
    assert.equal(detail.createdBy, librarian.id);
    assert.equal(detail.status, "won");
    assert.equal(store.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'orders'").get(), undefined);
    assert.equal(store.db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('contracts', 'purchase_orders')").all().length, 0);
  } finally {
    store.close();
    catalog.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("institution quote payloads stay blind to vendor offers", () => {
  const { directory, catalog, store, product, staff, librarian } = harness();
  try {
    const org = createOrganization(store, staff, { name: "University" });
    addOrganizationMember(store, staff, { organizationId: org.id, userId: librarian.id });
    const list = createSelectionList(store, librarian, { title: "Campus list" });
    addSelectionListItem(store, librarian, { selectionListId: list.id, productId: product.id, quantity: 1 });
    const quote = requestQuoteFromSelectionList(store, librarian, { selectionListId: list.id });
    setQuoteItemPrices(store, staff, { quoteId: quote.id, items: [{ id: quote.items[0].id, unitPriceUsd: "15" }] });
    const viewed = getInstitutionQuote(store, librarian, quote.id);
    const encoded = JSON.stringify(viewed);
    assert.equal(encoded.includes("vendor"), false);
    assert.equal(encoded.includes("supplier"), false);
    assert.equal(encoded.includes("session"), false);
    assert.equal(Object.hasOwn(viewed, "createdBy"), false);
    assert.equal(viewed.items[0].unitPriceUsd, "15.0000");
  } finally {
    store.close();
    catalog.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
