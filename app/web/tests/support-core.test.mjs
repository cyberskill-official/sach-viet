import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";
import { createCommerceStore, createPendingOrder } from "../src/lib/commerce-core.mjs";
import { addTicketMessage, createGoodsRequest, createReview, createSupportStore, createTicket, listGoodsRequests, listTicketMessages, listTickets } from "../src/lib/support-core.mjs";

test("customers can read and write only their own support tickets", () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-support-"));
  const store = createSupportStore({ dbPath: join(directory, "support.sqlite"), log: () => {} });
  try {
    const customer = { id: "customer-a", role: "customer" };
    const other = { id: "customer-b", role: "customer" };
    assert.throws(() => createTicket(store, customer, { subject: "" }), /required/);
    const ticket = createTicket(store, customer, { subject: "Need help" });
    assert.equal(listTickets(store, customer).length, 1);
    assert.equal(listTickets(store, other).length, 0);
    assert.throws(() => addTicketMessage(store, other, { ticketId: ticket.id, body: "No" }), /denied/);
    assert.equal(addTicketMessage(store, { id: "staff", role: "employee_b2c" }, { ticketId: ticket.id, body: "We can help" }).body, "We can help");
    assert.equal(addTicketMessage(store, customer, { ticketId: ticket.id, body: "I have more details" }).body, "I have more details");
    assert.equal(listTicketMessages(store, customer, ticket.id).length, 2);
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});

test("goods requests keep customer ownership and staff queue access", () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-goods-request-"));
  const store = createSupportStore({ dbPath: join(directory, "support.sqlite"), log: () => {} });
  try {
    const customer = { id: "customer-a", role: "customer" };
    const request = createGoodsRequest(store, customer, { details: "Please stock this title" });
    assert.equal(request.userId, customer.id);
    assert.equal(listGoodsRequests(store, { id: "customer-b", role: "customer" }).length, 0);
    assert.equal(listGoodsRequests(store, { id: "staff", role: "employee" }).length, 1);
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});

test("reviews are verified only after a paid order includes the product", () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-review-"));
  const dbPath = join(directory, "support.sqlite");
  const catalog = createCatalogStore({ dbPath, log: () => {} });
  const commerce = createCommerceStore({ dbPath, log: () => {} });
  const support = createSupportStore({ dbPath, log: () => {} });
  try {
    const customer = { id: "customer-a", role: "customer" };
    createCategory(catalog, { slug: "books", name: "Books" });
    const product = createProduct(catalog, { categorySlug: "books", slug: "book", title: "A Book" });
    const offer = writeVendorOffer(catalog, { id: "vendor-a", role: "vendor" }, { productId: product.id, vendorId: "vendor-a", priceUsd: "10.00", stockQuantity: 1 });
    assert.throws(() => createGoodsRequest(support, customer, { productId: "missing", details: "Please stock this" }), /does not exist/);
    assert.equal(createGoodsRequest(support, customer, { productId: product.id, details: "Please stock this" }).productId, product.id);
    assert.equal(createReview(support, customer, { productId: product.id, rating: 5, body: "Before purchase" }).verifiedPurchase, false);
    assert.throws(() => createReview(support, customer, { productId: product.id, rating: 6, body: "Invalid rating" }), /between 1 and 5/);
    const order = createPendingOrder(commerce, customer, [{ vendorOfferId: offer.id, quantity: 1 }]);
    commerce.db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(order.id);
    assert.equal(createReview(support, customer, { productId: product.id, rating: 4, body: "After purchase" }).verifiedPurchase, true);
  } finally { support.close(); commerce.close(); catalog.close(); rmSync(directory, { recursive: true, force: true }); }
});
