import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";
import { createCommerceStore, createPendingOrder } from "../src/lib/commerce-core.mjs";
import { addTicketMessage, createGoodsRequest, createReview, createSupportStore, createTicket, listGoodsRequests, listTicketMessages, listTickets } from "../src/lib/support-core.mjs";

test("customers can read and write only their own support tickets", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-support-"));
  const store = await createSupportStore({ dbPath: join(directory, "support.sqlite"), log: () => {} });
  try {
    const customer = { id: "customer-a", role: "customer" };
    const other = { id: "customer-b", role: "customer" };
    await assert.rejects(async () => await createTicket(store, customer, { subject: "" }), /required/);
    const ticket = await createTicket(store, customer, { subject: "Need help" });
    assert.equal((await listTickets(store, customer)).length, 1);
    assert.equal((await listTickets(store, other)).length, 0);
    await assert.rejects(async () => await addTicketMessage(store, other, { ticketId: ticket.id, body: "No" }), /denied/);
    assert.equal((await addTicketMessage(store, { id: "staff", role: "employee_b2c" }, { ticketId: ticket.id, body: "We can help" })).body, "We can help");
    assert.equal((await addTicketMessage(store, customer, { ticketId: ticket.id, body: "I have more details" })).body, "I have more details");
    assert.equal((await listTicketMessages(store, customer, ticket.id)).length, 2);
  } finally { await store.close(); rmSync(directory, { recursive: true, force: true }); }
});

test("goods requests keep customer ownership and staff queue access", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-goods-request-"));
  const store = await createSupportStore({ dbPath: join(directory, "support.sqlite"), log: () => {} });
  try {
    const customer = { id: "customer-a", role: "customer" };
    const request = await createGoodsRequest(store, customer, { details: "Please stock this title" });
    assert.equal(request.userId, customer.id);
    assert.equal((await listGoodsRequests(store, { id: "customer-b", role: "customer" })).length, 0);
    assert.equal((await listGoodsRequests(store, { id: "staff", role: "employee" })).length, 1);
  } finally { await store.close(); rmSync(directory, { recursive: true, force: true }); }
});

test("reviews are verified only after a paid order includes the product", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-review-"));
  const dbPath = join(directory, "support.sqlite");
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  const commerce = await createCommerceStore({ dbPath, log: () => {} });
  const support = await createSupportStore({ dbPath, log: () => {} });
  try {
    const customer = { id: "customer-a", role: "customer" };
    await createCategory(catalog, { slug: "books", name: "Books" });
    const product = await createProduct(catalog, { categorySlug: "books", slug: "book", title: "A Book" });
    const offer = await writeVendorOffer(catalog, { id: "vendor-a", role: "vendor" }, { productId: product.id, vendorId: "vendor-a", priceUsd: "10.00", stockQuantity: 1 });
    await assert.rejects(async () => await createGoodsRequest(support, customer, { productId: "missing", details: "Please stock this" }), /does not exist/);
    assert.equal((await createGoodsRequest(support, customer, { productId: product.id, details: "Please stock this" })).productId, product.id);
    assert.equal((await createReview(support, customer, { productId: product.id, rating: 5, body: "Before purchase" })).verifiedPurchase, false);
    await assert.rejects(async () => await createReview(support, customer, { productId: product.id, rating: 6, body: "Invalid rating" }), /between 1 and 5/);
    const order = await createPendingOrder(commerce, customer, [{ vendorOfferId: offer.id, quantity: 1 }]);
    await commerce.db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(order.id);
    assert.equal((await createReview(support, customer, { productId: product.id, rating: 4, body: "After purchase" })).verifiedPurchase, true);
  } finally { await support.close(); await commerce.close(); await catalog.close(); rmSync(directory, { recursive: true, force: true }); }
});
