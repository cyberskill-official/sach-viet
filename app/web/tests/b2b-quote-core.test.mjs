import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { tableExists } from "../src/lib/db.mjs";
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

async function harness() {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-b2b-quote-"));
  const dbPath = join(directory, "b2b.sqlite");
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  const store = await createB2bQuoteStore({ dbPath, log: () => {} });
  await createCategory(catalog, { slug: "books", name: "Books" });
  const product = await createProduct(catalog, { categorySlug: "books", slug: "book-one", title: "Book One" });
  await writeVendorOffer(catalog, { id: "vendor-a", role: "vendor" }, { productId: product.id, vendorId: "vendor-a", priceUsd: "12.50", stockQuantity: 5 });
  return { directory, catalog, store, product, staff: { id: "staff-b2b", role: "employee_b2b" }, librarian: { id: "lib-a", role: "school_librarian" }, other: { id: "lib-b", role: "school_librarian" }, customer: { id: "cust", role: "customer" } };
}

test("institution buyers request draft quotes from selection lists", async () => {
  const { directory, catalog, store, product, staff, librarian, other, customer } = await harness();
  try {
    await assert.rejects(async () => await createOrganization(store, customer, { name: "Harris County" }), /B2B staff/);
    const org = await createOrganization(store, staff, { name: "Harris County Library" });
    await addOrganizationMember(store, staff, { organizationId: org.id, userId: librarian.id });
    await assert.rejects(async () => await createSelectionList(store, librarian, { title: "" }), /required/);
    const list = await createSelectionList(store, librarian, { title: "Spring Vietnamese titles" });
    await assert.rejects(async () => await addSelectionListItem(store, librarian, { selectionListId: list.id, productId: product.id, quantity: 0 }), /positive integer/);
    await assert.rejects(async () => await requestQuoteFromSelectionList(store, librarian, { selectionListId: list.id }), /at least one item/);
    await addSelectionListItem(store, librarian, { selectionListId: list.id, productId: product.id, quantity: 3 });
    assert.equal((await listSelectionLists(store, librarian)).length, 1);
    await assert.rejects(async () => await listSelectionLists(store, other), /membership/);
    const quote = await requestQuoteFromSelectionList(store, librarian, { selectionListId: list.id });
    assert.equal(quote.status, "draft");
    assert.equal(quote.items.length, 1);
    assert.equal(quote.items[0].productId, product.id);
    assert.equal(quote.items[0].quantity, 3);
    assert.equal(Object.hasOwn(quote, "createdBy"), false);
    assert.equal(Object.hasOwn(quote, "vendorId"), false);
    assert.equal(JSON.stringify(quote).includes("vendor"), false);
    assert.equal((await listInstitutionQuotes(store, librarian)).length, 1);
    const otherOrg = await createOrganization(store, staff, { name: "Other Library" });
    await addOrganizationMember(store, staff, { organizationId: otherOrg.id, userId: other.id });
    await assert.rejects(async () => getInstitutionQuote(store, other, quote.id), /denied/);
  } finally {
    await store.close();
    await catalog.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("B2B staff advance the closed quote pipeline and set prices without creating orders", async () => {
  const { directory, catalog, store, product, staff, librarian, customer } = await harness();
  try {
    const org = await createOrganization(store, staff, { name: "School District" });
    await addOrganizationMember(store, staff, { organizationId: org.id, userId: librarian.id });
    const list = await createSelectionList(store, librarian, { title: "District list" });
    await addSelectionListItem(store, librarian, { selectionListId: list.id, productId: product.id, quantity: 2 });
    const quote = await requestQuoteFromSelectionList(store, librarian, { selectionListId: list.id });
    await assert.rejects(async () => await listQuotesPipeline(store, librarian), /B2B staff/);
    await assert.rejects(async () => await transitionQuoteStatus(store, customer, { quoteId: quote.id, status: "sent" }), /B2B staff/);
    const priced = await setQuoteItemPrices(store, staff, { quoteId: quote.id, items: [{ id: quote.items[0].id, unitPriceUsd: "9.99" }] });
    assert.equal(priced.items[0].unitPriceUsd, "9.9900");
    assert.equal((await transitionQuoteStatus(store, staff, { quoteId: quote.id, status: "sent" })).status, "sent");
    await assert.rejects(async () => await transitionQuoteStatus(store, staff, { quoteId: quote.id, status: "won" }), /Cannot transition/);
    assert.equal((await transitionQuoteStatus(store, staff, { quoteId: quote.id, status: "negotiating" })).status, "negotiating");
    assert.equal((await transitionQuoteStatus(store, staff, { quoteId: quote.id, status: "won" })).status, "won");
    await assert.rejects(async () => await setQuoteItemPrices(store, staff, { quoteId: quote.id, items: [{ id: quote.items[0].id, unitPriceUsd: "1.00" }] }), /before a terminal/);
    const pipeline = await listQuotesPipeline(store, staff);
    assert.equal(pipeline.won.length, 1);
    assert.equal(pipeline.draft.length, 0);
    const detail = await getStaffQuote(store, staff, quote.id);
    assert.equal(detail.createdBy, librarian.id);
    assert.equal(detail.status, "won");
    // orders exists via shared migration; b2b-quote-core must not create contracts or purchase_orders
    assert.equal(await tableExists(store.db, "contracts"), false);
    assert.equal(await tableExists(store.db, "purchase_orders"), false);
  } finally {
    await store.close();
    await catalog.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("institution quote payloads stay blind to vendor offers", async () => {
  const { directory, catalog, store, product, staff, librarian } = await harness();
  try {
    const org = await createOrganization(store, staff, { name: "University" });
    await addOrganizationMember(store, staff, { organizationId: org.id, userId: librarian.id });
    const list = await createSelectionList(store, librarian, { title: "Campus list" });
    await addSelectionListItem(store, librarian, { selectionListId: list.id, productId: product.id, quantity: 1 });
    const quote = await requestQuoteFromSelectionList(store, librarian, { selectionListId: list.id });
    await setQuoteItemPrices(store, staff, { quoteId: quote.id, items: [{ id: quote.items[0].id, unitPriceUsd: "15" }] });
    const viewed = await getInstitutionQuote(store, librarian, quote.id);
    const encoded = JSON.stringify(viewed);
    assert.equal(encoded.includes("vendor"), false);
    assert.equal(encoded.includes("supplier"), false);
    assert.equal(encoded.includes("session"), false);
    assert.equal(Object.hasOwn(viewed, "createdBy"), false);
    assert.equal(viewed.items[0].unitPriceUsd, "15.0000");
  } finally {
    await store.close();
    await catalog.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
