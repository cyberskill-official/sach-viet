import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3100);
const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`).replace(/\/$/, "");
const HOOK_SECRET = process.env.TEST_HOOK_SECRET || "playwright-local-test-hook-secret";

function webServerEnv() {
  /** @type {Record<string, string>} */
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") env[key] = value;
  }
  if (env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) env.STRIPE_SECRET_KEY = "";
  if ((env.PAYPAL_MODE || "").toLowerCase() === "live") env.PAYPAL_MODE = "sandbox";
  env.DATABASE_URL = env.DATABASE_URL || "postgres://sachviet:sachviet@127.0.0.1:54329/sachviet";
  env.AUTH_SESSION_SECRET = env.AUTH_SESSION_SECRET || "playwright-local-auth-session-secret-32";
  env.TEST_HOOKS_ENABLED = "1";
  env.TEST_HOOK_SECRET = HOOK_SECRET;
  env.CHECKOUT_SANDBOX_STUB = "1";
  env.CRON_SECRET = env.CRON_SECRET || "playwright-local-cron-secret";
  if (!env.PAYPAL_MODE) env.PAYPAL_MODE = "sandbox";
  env.PORT = String(PORT);
  env.HOSTNAME = "127.0.0.1";
  return env;
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "node scripts/start-standalone.mjs",
        url: `${BASE_URL}/api/health`,
        reuseExistingServer: false,
        timeout: 120_000,
        env: webServerEnv(),
      },
});
