import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const HOOK_SECRET = process.env.TEST_HOOK_SECRET || "playwright-local-test-hook-secret";
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || "admin.seed@sachviet.test";
const CUSTOMER_EMAIL = process.env.SMOKE_CUSTOMER_EMAIL || "khach-hang.seed@sachviet.test";

function seedPassword() {
  if (process.env.SEED_PASSWORD) return process.env.SEED_PASSWORD;
  const path = join(process.cwd(), ".seed-password");
  if (existsSync(path)) return readFileSync(path, "utf8").trim();
  throw new Error("Set SEED_PASSWORD or create app/web/.seed-password (seed Compose Postgres first).");
}

async function requestJson(page, path, { method = "GET", body } = {}) {
  return page.evaluate(async ({ path: url, method: verb, payload }) => {
    const response = await fetch(url, {
      method: verb,
      headers: payload ? { "content-type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  }, { path, method, payload: body });
}

async function postJson(page, path, body) {
  return requestJson(page, path, { method: "POST", body });
}

function apiMessage(body) {
  if (!body || typeof body !== "object") return "";
  if (typeof body.error === "string") return body.error;
  if (body.error && typeof body.error === "object" && "message" in body.error) return String(body.error.message);
  return "";
}

test("register, verify via test hook, login, catalog, sandbox checkout, order list", async ({ page }) => {
  const email = `pw.${Date.now()}@sachviet.test`;
  const password = "correct horse";

  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();

  const registered = await postJson(page, "/api/auth/register", { email, password });
  expect(registered.status, JSON.stringify(registered.body)).toBe(201);

  const hook = await page.request.get(`/api/test/hooks/verify-token?email=${encodeURIComponent(email)}`, {
    headers: { "x-test-hook-secret": HOOK_SECRET },
  });
  expect(hook.status(), await hook.text()).toBe(200);
  const hookBody = await hook.json();
  expect(hookBody.token).toBeTruthy();

  const verify = await page.request.get(`/api/auth/verify?token=${encodeURIComponent(String(hookBody.token))}`);
  expect(verify.status(), await verify.text()).toBe(200);

  const login = await postJson(page, "/api/auth/login", { email, password, redirect: "/" });
  expect(login.status, JSON.stringify(login.body)).toBe(200);
  expect(login.body.user?.role).toBe("customer");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Tìm cuốn sách/ })).toBeVisible();

  const catalog = await requestJson(page, "/api/catalog/products");
  expect(catalog.status).toBe(200);
  const catalogBody = catalog.body || {};
  const products = Array.isArray(catalogBody.items)
    ? catalogBody.items
    : Array.isArray(catalogBody.products)
      ? catalogBody.products
      : [];
  const product = products.find((row) => row?.primaryOffer?.id);
  expect(product, "seed catalog must include a product with primaryOffer").toBeTruthy();

  await page.goto("/ecom/cart");
  await expect(page.getByRole("heading", { name: "Giỏ hàng", exact: true })).toBeVisible();

  const checkout = await postJson(page, "/api/checkout", {
    items: [{ vendorOfferId: product.primaryOffer.id, title: product.title, quantity: 1 }],
    provider: "stub",
  });
  expect(checkout.status, JSON.stringify(checkout.body)).toBe(201);
  expect(checkout.body.order?.status).toBe("pending_payment");
  expect(checkout.body.checkout?.provider).toBe("stub");

  const orders = await requestJson(page, "/api/orders");
  expect(orders.status, JSON.stringify(orders.body)).toBe(200);
  const orderBody = orders.body || {};
  const list = Array.isArray(orderBody.items) ? orderBody.items : Array.isArray(orderBody.orders) ? orderBody.orders : [];
  expect(list.some((row) => row?.status === "pending_payment")).toBe(true);

  await page.goto("/ecom/orders");
  await expect(page.getByRole("heading", { name: "Đơn hàng của tôi" })).toBeVisible();
});

test("customer cannot write vendor offers", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  const login = await postJson(page, "/api/auth/login", {
    email: CUSTOMER_EMAIL,
    password: seedPassword(),
    redirect: "/",
  });
  expect(login.status, JSON.stringify(login.body)).toBe(200);
  expect(login.body.user?.role).toBe("customer");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Tìm cuốn sách/ })).toBeVisible();

  const result = await postJson(page, "/api/vendor/offers", {
    productId: "not-a-product",
    vendorId: "not-a-vendor",
    priceUsd: "9.00",
    stockQuantity: 1,
  });
  expect(result.status).toBe(403);
  expect(apiMessage(result.body)).toMatch(/cannot write/i);
});

test("admin can sign in to the admin portal", async ({ page }) => {
  await page.goto("/login?redirect=/admin");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  const login = await postJson(page, "/api/auth/login", {
    email: ADMIN_EMAIL,
    password: seedPassword(),
    redirect: "/admin",
  });
  expect(login.status, JSON.stringify(login.body)).toBe(200);
  expect(login.body.user?.role).toBe("admin");

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole("heading", { name: "Bảng điều hành" })).toBeVisible();
});
