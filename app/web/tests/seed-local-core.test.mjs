import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { getAdminCommerceDashboard, createAdminCommerceStore, listVendorApplications } from "../src/lib/admin-commerce-core.mjs";
import { createAuthStore, hashPassword, login, verifyPassword } from "../src/lib/auth-core.mjs";
import { createCatalogStore, getPublicProduct, listPublicProducts } from "../src/lib/catalog-core.mjs";
import { createCommerceStore, listCustomerOrders } from "../src/lib/commerce-core.mjs";
import { createNotificationStore, listNotifications } from "../src/lib/notification-core.mjs";
import { generateSeedPassword, seedLocalData, SEED_PRODUCTS, SEED_USERS } from "../src/lib/seed-local-core.mjs";
import { createVendorCommerceStore, getVendorDashboard, listAdminPayouts } from "../src/lib/vendor-commerce-core.mjs";

const SESSION_SECRET = "seed-local-test-session-secret-value";

function withDatabase(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-seed-local-"));
  const dbPath = join(directory, "sachviet.sqlite");
  try {
    return run(dbPath);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function seed(dbPath, overrides = {}) {
  return seedLocalData({ dbPath, password: "seed-local-test-password", env: {}, log: () => {}, ...overrides });
}

function userByRole(summary, role) {
  return summary.accounts.find((account) => account.role === role);
}

test("seeding an empty database creates the full storefront and admin dataset", () => withDatabase((dbPath) => {
  const summary = seed(dbPath);
  assert.equal(summary.created.users, SEED_USERS.length);
  assert.equal(summary.created.products, SEED_PRODUCTS.length);
  assert.equal(summary.created.orders, 2);
  assert.equal(summary.created.payouts, 1);
  assert.equal(summary.created.vendorApplications, 1);
  assert.equal(summary.bootstrapAdmin, "not_configured");
  assert.equal(summary.totals.products, SEED_PRODUCTS.length);
}));

test("seeded catalog exposes a lowest-price buy box and one out-of-stock product", () => withDatabase((dbPath) => {
  seed(dbPath);
  const catalog = createCatalogStore({ dbPath, log: () => {} });
  try {
    const products = listPublicProducts(catalog);
    assert.equal(products.length, SEED_PRODUCTS.length);
    assert.equal(products.filter((product) => product.primaryOffer === null).length, 1);
    assert.equal(getPublicProduct(catalog, "mat-biec").primaryOffer, null);

    const hoangTuBe = getPublicProduct(catalog, "hoang-tu-be");
    assert.equal(hoangTuBe.primaryOffer.priceUsd, "3.9000");
    assert.ok(hoangTuBe.primaryOffer.stockQuantity > 0);
    assert.equal(hoangTuBe.variants.length, 2);
    assert.equal(hoangTuBe.media.length, 1);
    // The buy box must never disclose which vendor won it.
    assert.equal(JSON.stringify(hoangTuBe).includes("@sachviet.test"), false);

    const filtered = listPublicProducts(catalog, { category: "thieu-nhi" });
    assert.ok(filtered.length >= 3);
  } finally {
    catalog.close();
  }
}));

test("seeded commerce records give the admin dashboard and vendor dashboard real numbers", () => withDatabase((dbPath) => {
  const summary = seed(dbPath);
  const commerce = createCommerceStore({ dbPath, log: () => {} });
  const adminCommerce = createAdminCommerceStore({ dbPath, log: () => {} });
  const vendorCommerce = createVendorCommerceStore({ dbPath, log: () => {} });
  const auth = createAuthStore({ dbPath, log: () => {} });
  try {
    const customer = auth.db.prepare("SELECT id, role FROM users WHERE email = ?").get(userByRole(summary, "customer").email);
    const orders = listCustomerOrders(commerce, customer);
    assert.equal(orders.length, 2);
    assert.deepEqual([...orders].map((order) => order.status).sort(), ["paid", "pending_payment"]);

    const admin = auth.db.prepare("SELECT id, role FROM users WHERE email = ?").get(userByRole(summary, "admin").email);
    const dashboard = getAdminCommerceDashboard(adminCommerce, admin);
    assert.equal(dashboard.orderCount, 2);
    assert.equal(dashboard.paidOrderCount, 1);
    assert.notEqual(dashboard.paidRevenueUsd, "0.0000");
    assert.equal(listVendorApplications(adminCommerce, admin).length, 1);

    const payouts = listAdminPayouts(vendorCommerce, admin);
    assert.equal(payouts.length, 1);
    assert.equal(payouts[0].orderItemIds.length, 2);
    const vendorDashboard = getVendorDashboard(vendorCommerce, admin, { vendorId: payouts[0].vendorId });
    assert.equal(vendorDashboard.paidOrderLineCount, 2);
    assert.equal(vendorDashboard.payoutTotalUsd, vendorDashboard.paidLineTotalUsd);
  } finally {
    auth.close();
    vendorCommerce.close();
    adminCommerce.close();
    commerce.close();
  }
}));

test("seeded accounts sign in with the seed password and receive notifications", () => withDatabase((dbPath) => {
  const summary = seed(dbPath);
  const auth = createAuthStore({ dbPath, log: () => {} });
  const notifications = createNotificationStore({ dbPath, log: () => {} });
  try {
    for (const account of summary.accounts) {
      const result = login(auth, { email: account.email, password: summary.password, sessionSecret: SESSION_SECRET });
      assert.equal(result.ok, true, `${account.email} should sign in`);
      assert.equal(result.user.role, account.role);
    }
    const admin = auth.db.prepare("SELECT id FROM users WHERE email = ?").get(userByRole(summary, "admin").email);
    const inbox = listNotifications(notifications, admin);
    assert.equal(inbox.notifications.length, 1);
    assert.equal(inbox.unreadCount, 1);
    assert.equal(inbox.notifications[0].deeplinkPath, "/admin#vendors");
  } finally {
    notifications.close();
    auth.close();
  }
}));

test("re-seeding is idempotent and refreshes the seed password", () => withDatabase((dbPath) => {
  seed(dbPath);
  const second = seed(dbPath, { password: "seed-local-second-password" });
  assert.deepEqual(second.created, {
    users: 0, categories: 0, products: 0, variants: 0, media: 0, offers: 0,
    orders: 0, payouts: 0, vendorApplications: 0, notifications: 0, reviews: 0, tickets: 0,
  });
  assert.equal(second.totals.products, SEED_PRODUCTS.length);
  assert.equal(second.totals.orders, 2);

  const auth = createAuthStore({ dbPath, log: () => {} });
  try {
    const row = auth.db.prepare("SELECT password_hash FROM users WHERE email = ?").get(userByRole(second, "admin").email);
    assert.equal(verifyPassword("seed-local-second-password", row.password_hash), true);
    assert.equal(verifyPassword("seed-local-test-password", row.password_hash), false);
  } finally {
    auth.close();
  }
}));

test("seeding preserves an operator-configured bootstrap administrator", () => withDatabase((dbPath) => {
  const env = {
    AUTH_SESSION_SECRET: SESSION_SECRET,
    BOOTSTRAP_ADMIN_EMAIL: "operator@example.test",
    BOOTSTRAP_ADMIN_PASSWORD_HASH: hashPassword("operator-bootstrap-password"),
  };
  const summary = seed(dbPath, { env });
  assert.equal(summary.bootstrapAdmin, "created");

  const auth = createAuthStore({ dbPath, log: () => {} });
  try {
    const bootstrapAdmin = auth.db.prepare("SELECT role FROM users WHERE email = 'operator@example.test'").get();
    assert.equal(bootstrapAdmin.role, "admin");
    const result = login(auth, { email: "operator@example.test", password: "operator-bootstrap-password", sessionSecret: SESSION_SECRET });
    assert.equal(result.ok, true);
  } finally {
    auth.close();
  }
}));

test("generated seed passwords are unique and long enough for the password policy", () => {
  const first = generateSeedPassword();
  const second = generateSeedPassword();
  assert.notEqual(first, second);
  assert.ok(first.length >= 8);
  assert.doesNotThrow(() => hashPassword(first));
});

test("the seed dataset references only declared categories and vendors", () => {
  const categorySlugs = new Set(["van-hoc", "thieu-nhi", "ky-nang"]);
  const vendorKeys = new Set(SEED_USERS.filter((user) => user.role === "vendor").map((user) => user.key));
  const slugs = new Set();
  for (const product of SEED_PRODUCTS) {
    assert.equal(categorySlugs.has(product.categorySlug), true, `${product.slug} has an unknown category`);
    assert.equal(slugs.has(product.slug), false, `${product.slug} is duplicated`);
    slugs.add(product.slug);
    assert.ok(product.offers.length >= 1);
    for (const offer of product.offers) assert.equal(vendorKeys.has(offer.vendor), true, `${product.slug} has an unknown vendor`);
  }
});
