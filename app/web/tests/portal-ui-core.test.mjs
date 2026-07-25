import assert from "node:assert/strict";
import test from "node:test";
import { addCartItem, formatUsd, mergeNotifications, navigationForPortal, normalizeCart, updateCartQuantity } from "../src/lib/portal-ui-core.mjs";

test("cart normalization rejects malformed, duplicate, and out-of-range browser values", () => {
  assert.deepEqual(normalizeCart(null), []);
  assert.deepEqual(normalizeCart([{ vendorOfferId: "a", title: "Book", quantity: 0 }]), []);
  assert.deepEqual(normalizeCart([{ vendorOfferId: "a", title: "Book", quantity: 100 }]), []);
  assert.deepEqual(normalizeCart([
    { vendorOfferId: "a", title: "Book", priceUsd: "12.50", quantity: 1, plasticCover: true },
    { vendorOfferId: "a", title: "Duplicate", quantity: 2 },
  ]), [{ vendorOfferId: "a", title: "Book", priceUsd: "12.50", quantity: 1, plasticCover: true, giftWrap: false }]);
});

test("cart transitions merge offers and keep quantity within checkout bounds", () => {
  const first = addCartItem([], { vendorOfferId: "a", title: "Book", priceUsd: "10", quantity: 1 });
  assert.equal(addCartItem(first, { vendorOfferId: "a", title: "Book", quantity: 98 })[0].quantity, 99);
  assert.equal(addCartItem(first, { vendorOfferId: "a", title: "Book", quantity: 99 })[0].quantity, 99);
  assert.equal(updateCartQuantity(first, "a", 4)[0].quantity, 4);
  assert.equal(updateCartQuantity(first, "a", 0)[0].quantity, 1);
});

test("portal navigation localizes known routes and excludes unknown portals", () => {
  assert.equal(navigationForPortal("admin", "vi")[1].label, "Đơn đăng ký nhà bán");
  assert.equal(navigationForPortal("admin", "en")[3].label, "WordPress import");
  assert.deepEqual(navigationForPortal("missing"), []);
});

test("notification merge is stable, newest-first, and deduplicated", () => {
  const merged = mergeNotifications([{ id: "a", createdAt: 1 }], [{ id: "b", createdAt: 2 }, { id: "a", createdAt: 1 }]);
  assert.deepEqual(merged.map((item) => item.id), ["b", "a"]);
});

test("money formatting refuses non-numeric values", () => {
  assert.equal(formatUsd("not-money"), "—");
  assert.match(formatUsd("12.5", "en"), /\$12\.50/);
});
