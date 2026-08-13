import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  adminAiChat,
  createAiSettingsStore,
  createChatCompletion,
  decryptApiKey,
  encryptApiKey,
  getAiSettings,
  requireAiSettingsSecret,
  resolveAiChatConfig,
  updateAiSettings,
} from "../src/lib/ai-settings-core.mjs";

const SECRET = "test-ai-settings-secret-32chars!!";

async function fixture(run, { settingsSecret = SECRET } = {}) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-ai-"));
  const dbPath = join(directory, `ai-${randomUUID()}.sqlite`);
  const events = [];
  const store = await createAiSettingsStore({
    dbPath,
    clock: () => 9_000,
    settingsSecret,
    log: (event, fields = {}) => events.push({ event, ...fields }),
  });
  try {
    return await run({ store, events, directory });
  } finally {
    await store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test("AI_SETTINGS_SECRET fails closed when short or unset", async () => {
  assert.throws(() => requireAiSettingsSecret(""), /AI_SETTINGS_SECRET is required/);
  assert.throws(() => requireAiSettingsSecret("short"), /AI_SETTINGS_SECRET is required/);
  assert.equal(requireAiSettingsSecret(SECRET), SECRET);
});

test("encrypt/decrypt round-trips API keys", async () => {
  const plaintext = `sk-test-${randomBytes(8).toString("hex")}`;
  const cipher = encryptApiKey(plaintext, SECRET);
  assert.notEqual(cipher, plaintext);
  assert.equal(decryptApiKey(cipher, SECRET), plaintext);
  assert.throws(() => decryptApiKey(cipher, `${SECRET}x`), /Unsupported state|unable to authenticate|bad decrypt|auth/i);
});

test("getAiSettings defaults and never returns raw api key", async () =>
  fixture(async ({ store }) => {
    const admin = { id: "admin-1", role: "admin" };
    const settings = await getAiSettings(store, admin);
    assert.equal(settings.apiKeyConfigured, false);
    assert.equal(settings.encryptionReady, true);
    assert.ok(settings.baseUrl.includes("openrouter"));
    assert.ok(!("apiKey" in settings));
    await assert.rejects(async () => await getAiSettings(store, { id: "c1", role: "customer" }), /Administrator/);
  }));

test("updateAiSettings stores encrypted key and masks last4", async () =>
  fixture(async ({ store, events }) => {
    const admin = { id: "admin-1", role: "admin" };
    const updated = await updateAiSettings(store, admin, {
      baseUrl: "https://api.groq.com/openai/v1",
      model: "llama-3.1-8b-instant",
      apiKey: "sk-live-abcdef12",
    });
    assert.equal(updated.apiKeyConfigured, true);
    assert.equal(updated.apiKeyLast4, "••••ef12");
    assert.equal(updated.baseUrl, "https://api.groq.com/openai/v1");
    const row = await store.db.prepare("SELECT api_key_ciphertext AS c FROM ai_settings WHERE id = 'default'").get();
    assert.ok(row.c);
    assert.ok(!String(row.c).includes("sk-live"));
    assert.ok(events.some((e) => e.event === "ai_settings_updated"));

    const kept = await updateAiSettings(store, admin, { model: "llama-3.1-8b-instant" });
    assert.equal(kept.apiKeyConfigured, true);
    assert.equal(kept.apiKeyLast4, "••••ef12");
  }));

test("resolveAiChatConfig and chat fail closed without key or secret", async () =>
  fixture(async ({ store }) => {
    const admin = { id: "admin-1", role: "admin" };
    await assert.rejects(async () => await resolveAiChatConfig(store, admin), /API key is not configured/);
  }));

test("resolveAiChatConfig fails closed when secret unset on store", async () =>
  fixture(
    async ({ store }) => {
      const admin = { id: "admin-1", role: "admin" };
      await assert.rejects(async () => await resolveAiChatConfig(store, admin), /AI_SETTINGS_SECRET is required/);
    },
    { settingsSecret: "" },
  ));

test("createChatCompletion uses OpenAI-compatible path with mocked fetch", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          model: "mock-model",
          choices: [{ message: { role: "assistant", content: "pong" } }],
          usage: { total_tokens: 3 },
        });
      },
    };
  };
  const result = await createChatCompletion({
    baseUrl: "https://openrouter.ai/api/v1/",
    apiKey: "sk-test",
    model: "meta-llama/llama-3.2-3b-instruct:free",
    messages: [{ role: "user", content: "ping" }],
    fetchImpl,
  });
  assert.equal(result.content, "pong");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://openrouter.ai/api/v1/chat/completions");
  assert.match(calls[0].init.headers.Authorization, /^Bearer sk-test$/);
});

test("createChatCompletion surfaces provider errors", async () => {
  await assert.rejects(
    () =>
      createChatCompletion({
        baseUrl: "https://example.test/v1",
        apiKey: "sk",
        model: "m",
        messages: [{ role: "user", content: "x" }],
        fetchImpl: async () => ({
          ok: false,
          status: 401,
          async text() {
            return JSON.stringify({ error: { message: "Invalid API key" } });
          },
        }),
      }),
    /Invalid API key/,
  );
});

test("adminAiChat loads BYOK config and returns mocked reply", async () =>
  fixture(async ({ store, events }) => {
    const admin = { id: "admin-1", role: "admin" };
    await updateAiSettings(store, admin, {
      baseUrl: "https://api.groq.com/openai/v1",
      model: "llama-3.1-8b-instant",
      apiKey: "gsk_test_key",
    });
    const reply = await adminAiChat(store, admin, {
      message: "hello",
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify({
            model: "llama-3.1-8b-instant",
            choices: [{ message: { content: "hi admin" } }],
          });
        },
      }),
    });
    assert.equal(reply.content, "hi admin");
    assert.ok(events.some((e) => e.event === "ai_chat_completed"));
  }));

test("updateAiSettings requires secret when setting a key", async () =>
  fixture(
    async ({ store }) => {
      const admin = { id: "admin-1", role: "admin" };
      await assert.rejects(async () => await updateAiSettings(store, admin, { apiKey: "sk-x", baseUrl: "https://openrouter.ai/api/v1", model: "m" }),
        /AI_SETTINGS_SECRET is required/,
      );
    },
    { settingsSecret: "too-short" },
  ));
