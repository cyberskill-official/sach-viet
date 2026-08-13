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
import { assertSeedDatabaseTarget, generateSeedPassword, seedLocalData, SEED_PRODUCTS, SEED_USERS } from "../src/lib/seed-local-core.mjs";
import { createVendorCommerceStore, getVendorDashboard, listAdminPayouts } from "../src/lib/vendor-commerce-core.mjs";

const SESSION_SECRET = "seed-local-test-session-secret-value";

async function withDatabase(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-seed-local-"));
  const dbPath = join(directory, "sachviet.sqlite");
  try {
    return await run(dbPath);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function seed(dbPath, overrides = {}) {
  return await seedLocalData({ dbPath, password: "seed-local-test-password", env: {}, log: () => {}, ...overrides });
}

function userByRole(summary, role) {
  return summary.accounts.find((account) => account.role === role);
}

test("seeding an empty database creates the full storefront and admin dataset", async () => withDatabase(async (dbPath) => {
  const summary = await seed(dbPath);
  assert.equal(summary.created.users, SEED_USERS.length);
  assert.equal(summary.created.products, SEED_PRODUCTS.length);
  assert.equal(summary.created.orders, 2);
  assert.equal(summary.created.payouts, 1);
  assert.equal(summary.created.vendorApplications, 1);
  assert.equal(summary.bootstrapAdmin, "not_configured");
  assert.equal(summary.totals.products, SEED_PRODUCTS.length);
}));

test("seeded catalog exposes a lowest-price buy box and one out-of-stock product", async () => withDatabase(async (dbPath) => {
  await seed(dbPath);
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  try {
    const products = await listPublicProducts(catalog);
    assert.equal(products.length, SEED_PRODUCTS.length);
    assert.equal(products.filter((product) => product.primaryOffer === null).length, 1);
    assert.equal((await getPublicProduct(catalog, "mat-biec")).primaryOffer, null);

    const hoangTuBe = await getPublicProduct(catalog, "hoang-tu-be");
    assert.equal(hoangTuBe.primaryOffer.priceUsd, "3.9000");
    assert.ok(hoangTuBe.primaryOffer.stockQuantity > 0);
    assert.equal(hoangTuBe.variants.length, 2);
    assert.equal(hoangTuBe.media.length, 1);
    // The buy box must never disclose which vendor won it.
    assert.equal(JSON.stringify(hoangTuBe).includes("@sachviet.test"), false);

    const filtered = await listPublicProducts(catalog, { category: "thieu-nhi" });
    assert.ok(filtered.length >= 3);
  } finally {
    await catalog.close();
  }
}));

test("seeded commerce records give the admin dashboard and vendor dashboard real numbers", async () => withDatabase(async (dbPath) => {
  const summary = await seed(dbPath);
  const commerce = await createCommerceStore({ dbPath, log: () => {} });
  const adminCommerce = await createAdminCommerceStore({ dbPath, log: () => {} });
  const vendorCommerce = await createVendorCommerceStore({ dbPath, log: () => {} });
  const auth = await createAuthStore({ dbPath, log: () => {} });
  try {
    const customer = await auth.db.prepare("SELECT id, role FROM users WHERE email = ?").get(userByRole(summary, "customer").email);
    const orders = await listCustomerOrders(commerce, customer);
    assert.equal(orders.items.length, 2);
    assert.deepEqual([...orders.items].map((order) => order.status).sort(), ["paid", "pending_payment"]);
    assert.ok(orders.items.every((order) => Array.isArray(order.timeline)));

    const admin = await auth.db.prepare("SELECT id, role FROM users WHERE email = ?").get(userByRole(summary, "admin").email);
    const dashboard = await getAdminCommerceDashboard(adminCommerce, admin);
    assert.equal(dashboard.orderCount, 2);
    assert.equal(dashboard.paidOrderCount, 1);
    assert.notEqual(dashboard.paidRevenueUsd, "0.0000");
    assert.equal((await listVendorApplications(adminCommerce, admin)).length, 1);

    const payouts = await listAdminPayouts(vendorCommerce, admin);
    assert.equal(payouts.length, 1);
    assert.equal(payouts[0].orderItemIds.length, 2);
    const vendorDashboard = await getVendorDashboard(vendorCommerce, admin, { vendorId: payouts[0].vendorId });
    assert.equal(vendorDashboard.paidOrderLineCount, 2);
    assert.equal(vendorDashboard.payoutTotalUsd, vendorDashboard.paidLineTotalUsd);
  } finally {
    await auth.close();
    await vendorCommerce.close();
    await adminCommerce.close();
    await commerce.close();
  }
}));

test("seeded accounts sign in with the seed password and receive notifications", async () => withDatabase(async (dbPath) => {
  const summary = await seed(dbPath);
  const auth = await createAuthStore({ dbPath, log: () => {} });
  const notifications = await createNotificationStore({ dbPath, log: () => {} });
  try {
    for (const account of summary.accounts) {
      const result = await login(auth, { email: account.email, password: summary.password, sessionSecret: SESSION_SECRET });
      assert.equal(result.ok, true, `${account.email} should sign in`);
      assert.equal(result.user.role, account.role);
    }
    const admin = await auth.db.prepare("SELECT id FROM users WHERE email = ?").get(userByRole(summary, "admin").email);
    const inbox = await listNotifications(notifications, admin);
    assert.equal(inbox.notifications.length, 1);
    assert.equal(inbox.unreadCount, 1);
    assert.equal(inbox.notifications[0].deeplinkPath, "/admin#vendors");
  } finally {
    await notifications.close();
    await auth.close();
  }
}));

test("re-seeding is idempotent and refreshes the seed password", async () => withDatabase(async (dbPath) => {
  await seed(dbPath);
  const second = await seed(dbPath, { password: "seed-local-second-password" });
  assert.deepEqual(second.created, {
    users: 0, categories: 0, products: 0, variants: 0, media: 0, offers: 0,
    orders: 0, payouts: 0, vendorApplications: 0, notifications: 0, reviews: 0, tickets: 0,
    addresses: 0, assignedTickets: 0, fulfillments: 0, organizations: 0, quotes: 0,
    b2bOrders: 0, purchaseOrders: 0, publishingRequests: 0, marcRecords: 0, manuscriptRequests: 0,
  });
  assert.equal(second.totals.products, SEED_PRODUCTS.length);
  assert.equal(second.totals.orders, 2);

  const auth = await createAuthStore({ dbPath, log: () => {} });
  try {
    const row = await auth.db.prepare("SELECT password_hash FROM users WHERE email = ?").get(userByRole(second, "admin").email);
    assert.equal(verifyPassword("seed-local-second-password", row.password_hash), true);
    assert.equal(verifyPassword("seed-local-test-password", row.password_hash), false);
  } finally {
    await auth.close();
  }
}));

test("seeding preserves an operator-configured bootstrap administrator", async () => withDatabase(async (dbPath) => {
  const env = {
    AUTH_SESSION_SECRET: SESSION_SECRET,
    BOOTSTRAP_ADMIN_EMAIL: "operator@example.test",
    BOOTSTRAP_ADMIN_PASSWORD_HASH: hashPassword("operator-bootstrap-password"),
  };
  const summary = await seed(dbPath, { env });
  assert.equal(summary.bootstrapAdmin, "created");

  const auth = await createAuthStore({ dbPath, log: () => {} });
  try {
    const bootstrapAdmin = await auth.db.prepare("SELECT role FROM users WHERE email = 'operator@example.test'").get();
    assert.equal(bootstrapAdmin.role, "admin");
    const result = await login(auth, { email: "operator@example.test", password: "operator-bootstrap-password", sessionSecret: SESSION_SECRET });
    assert.equal(result.ok, true);
  } finally {
    await auth.close();
  }
}));

test("generated seed passwords are unique and long enough for the password policy", async () => {
  const first = generateSeedPassword();
  const second = generateSeedPassword();
  assert.notEqual(first, second);
  assert.ok(first.length >= 8);
  assert.doesNotThrow(() => hashPassword(first));
});

test("seed fingerprint refuses production and non-local DATABASE_URL hosts", () => {
  assert.throws(
    () => assertSeedDatabaseTarget({ env: { NODE_ENV: "production" }, dbPath: "/tmp/x" }),
    /NODE_ENV=production/,
  );
  assert.throws(
    () => assertSeedDatabaseTarget({ env: { NODE_ENV: "development" }, databaseUrl: "postgres://user:pass@db.example.com:5432/sachviet" }),
    /loopback or Compose db/,
  );
  assert.doesNotThrow(() => assertSeedDatabaseTarget({ env: { NODE_ENV: "test" }, dbPath: "/tmp/isolated" }));
  assert.doesNotThrow(() => assertSeedDatabaseTarget({ env: { NODE_ENV: "development" }, databaseUrl: "postgres://sachviet:sachviet@127.0.0.1:5432/sachviet" }));
  assert.doesNotThrow(() => assertSeedDatabaseTarget({ env: { NODE_ENV: "development" }, databaseUrl: "postgres://sachviet:sachviet@db:5432/sachviet" }));
});

test("seed walkthrough covers the nine current portals", async () => withDatabase(async (dbPath) => {
  const summary = await seed(dbPath);
  assert.equal(summary.created.addresses, 1);
  assert.equal(summary.created.assignedTickets, 1);
  assert.ok(summary.created.fulfillments >= 1);
  assert.equal(summary.created.organizations, 1);
  assert.equal(summary.created.quotes, 1);
  assert.equal(summary.created.b2bOrders, 1);
  assert.equal(summary.created.purchaseOrders, 1);
  assert.equal(summary.created.publishingRequests, 1);
  assert.equal(summary.created.marcRecords, 1);
  assert.equal(summary.created.manuscriptRequests, 1);
  assert.equal(summary.walkthrough.customer.locale, "en");
  assert.ok(summary.walkthrough.customer.addressId);
  assert.ok(summary.walkthrough.vendor.orderItemId);
  assert.ok(summary.walkthrough.employee.assignedTicketId);
  assert.ok(summary.walkthrough.retail.paidOrderId);
  assert.ok(summary.walkthrough.b2b.quoteId);
  assert.ok(summary.walkthrough.institution.orderId);
  assert.ok(summary.walkthrough.publisher.requestId);
  assert.ok(summary.walkthrough.author.requestId);
  assert.deepEqual(Object.keys(summary.walkthrough).sort(), [
    "admin", "author", "b2b", "customer", "employee", "institution", "publisher", "retail", "vendor",
  ]);
}));

test("the seed dataset references only declared categories and vendors", async () => {
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
