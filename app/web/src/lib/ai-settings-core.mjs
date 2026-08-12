/**
 * Admin-only BYOK AI settings + OpenAI-compatible chat client.
 *
 * Prefer free / OpenAI-compatible providers (OpenRouter free models, Groq, Ollama).
 * API keys are encrypted at rest with AI_SETTINGS_SECRET (AES-256-GCM).
 * Chat fails closed when the secret, settings, or API key is missing.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { normalizeRole } from "./access.mjs";
import { openDatabase } from "./db.mjs";

export const AI_SETTINGS_ROW_ID = "default";

/** Free-model-friendly OpenAI-compatible defaults (override in admin UI). */
export const DEFAULT_AI_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_AI_MODEL = "meta-llama/llama-3.2-3b-instruct:free";

export const AI_PROVIDER_HINTS = Object.freeze([
  {
    id: "openrouter",
    label: "OpenRouter (free models)",
    baseUrl: "https://openrouter.ai/api/v1",
    modelExample: "meta-llama/llama-3.2-3b-instruct:free",
  },
  {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    modelExample: "llama-3.1-8b-instant",
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    baseUrl: "http://host.docker.internal:11434/v1",
    modelExample: "llama3.2",
  },
]);

export const DEFAULT_CHAT_TIMEOUT_MS = 30_000;
export const DEFAULT_CHAT_MAX_TOKENS = 512;

export function allowedAiBaseUrls(environment = process.env) {
  const extra = String(environment.AI_ALLOWED_BASE_URLS || "")
    .split(",")
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  return new Set([...AI_PROVIDER_HINTS.map((hint) => hint.baseUrl.replace(/\/+$/, "")), ...extra]);
}

export function assertAllowedAiBaseUrl(baseUrl, environment = process.env) {
  let parsed;
  try {
    parsed = new URL(required(baseUrl, "Base URL"));
  } catch {
    throw new Error("AI base URL is invalid.");
  }
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1" && parsed.hostname !== "host.docker.internal") {
    throw new Error("AI base URL must be https or a local Ollama host.");
  }
  const normalized = `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, "");
  if (!allowedAiBaseUrls(environment).has(normalized)) {
    throw new Error("AI base URL is not on the allowlist.");
  }
  return normalized;
}

export function assertAiChatEnabled(environment = process.env) {
  if (environment.NODE_ENV === "production" && environment.AI_CHAT_ENABLED !== "1") {
    throw new Error("Admin AI chat is retired on Production.");
  }
}

const ENCRYPTION_SALT = "sachviet-ai-settings-v1";

function required(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`);
  return value.trim();
}

function adminOnly(user) {
  if (!user?.id || normalizeRole(user.role) !== "admin") {
    throw new Error("Administrator access is required.");
  }
}

/**
 * @param {string | undefined} secret
 * @returns {string}
 */
export function requireAiSettingsSecret(secret = process.env.AI_SETTINGS_SECRET) {
  if (typeof secret !== "string" || secret.trim().length < 32) {
    throw new Error("AI_SETTINGS_SECRET is required (min 32 characters).");
  }
  return secret.trim();
}

/**
 * @param {string | undefined} secret
 */
export function isAiSettingsSecretConfigured(secret = process.env.AI_SETTINGS_SECRET) {
  return typeof secret === "string" && secret.trim().length >= 32;
}

function deriveKey(secret) {
  return scryptSync(requireAiSettingsSecret(secret), ENCRYPTION_SALT, 32);
}

/**
 * Encrypt an API key for storage. Returns `iv.tag.ciphertext` (base64url).
 * @param {string} plaintext
 * @param {string | undefined} secret
 */
export function encryptApiKey(plaintext, secret = process.env.AI_SETTINGS_SECRET) {
  const key = deriveKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

/**
 * @param {string} payload
 * @param {string | undefined} secret
 */
export function decryptApiKey(payload, secret = process.env.AI_SETTINGS_SECRET) {
  const key = deriveKey(secret);
  const parts = String(payload || "").split(".");
  if (parts.length !== 3) throw new Error("Stored API key ciphertext is invalid.");
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

function maskApiKey(plaintext) {
  if (typeof plaintext !== "string" || plaintext.length === 0) return null;
  if (plaintext.length <= 4) return "••••";
  return `••••${plaintext.slice(-4)}`;
}

/**
 * @param {{ dbPath?: string, databaseUrl?: string, clock?: () => number, log?: Function, settingsSecret?: string }} [options]
 */
export async function createAiSettingsStore({
  dbPath,
  databaseUrl,
  clock = () => Date.now(),
  log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "WAVE3-BYOK-AI", ...fields })),
  settingsSecret = process.env.AI_SETTINGS_SECRET,
} = {}) {
  const db = await openDatabase(dbPath, { databaseUrl });
  return { db, clock, log, settingsSecret, close: () => db.close() };
}

async function readRow(store) {
  return await store.db
    .prepare(
      `SELECT id, base_url AS "baseUrl", model, api_key_ciphertext AS "apiKeyCiphertext",
              updated_at AS "updatedAt", updated_by AS "updatedBy"
       FROM ai_settings WHERE id = ?`,
    )
    .get(AI_SETTINGS_ROW_ID);
}

/**
 * Public admin view — never returns the raw API key.
 * @param {Awaited<ReturnType<typeof createAiSettingsStore>>} store
 * @param {{ id: string, role: string }} actor
 */
export async function getAiSettings(store, actor) {
  adminOnly(actor);
  const encryptionReady = isAiSettingsSecretConfigured(store.settingsSecret);
  const row = await readRow(store);
  let apiKeyConfigured = false;
  let apiKeyLast4 = null;
  if (row?.apiKeyCiphertext && encryptionReady) {
    try {
      const plaintext = decryptApiKey(row.apiKeyCiphertext, store.settingsSecret);
      apiKeyConfigured = plaintext.length > 0;
      apiKeyLast4 = maskApiKey(plaintext);
    } catch {
      apiKeyConfigured = true;
      apiKeyLast4 = "••••????";
    }
  } else if (row?.apiKeyCiphertext) {
    apiKeyConfigured = true;
    apiKeyLast4 = "••••";
  }

  return {
    baseUrl: row?.baseUrl || DEFAULT_AI_BASE_URL,
    model: row?.model || DEFAULT_AI_MODEL,
    apiKeyConfigured,
    apiKeyLast4,
    encryptionReady,
    updatedAt: row?.updatedAt ?? null,
    updatedBy: row?.updatedBy ?? null,
    defaults: { baseUrl: DEFAULT_AI_BASE_URL, model: DEFAULT_AI_MODEL },
    providers: AI_PROVIDER_HINTS,
  };
}

/**
 * Upsert BYOK settings. Omit `apiKey` to leave the stored key unchanged.
 * Pass empty string `apiKey: ""` to clear the key.
 * @param {Awaited<ReturnType<typeof createAiSettingsStore>>} store
 * @param {{ id: string, role: string }} actor
 * @param {{ baseUrl?: string, model?: string, apiKey?: string }} input
 */
export async function updateAiSettings(store, actor, input = {}) {
  adminOnly(actor);
  const existing = await readRow(store);
  const baseUrl = assertAllowedAiBaseUrl(input.baseUrl ?? existing?.baseUrl ?? DEFAULT_AI_BASE_URL);
  const model = required(input.model ?? existing?.model ?? DEFAULT_AI_MODEL, "Model");

  let ciphertext = existing?.apiKeyCiphertext ?? null;
  if (Object.prototype.hasOwnProperty.call(input, "apiKey")) {
    if (input.apiKey === "" || input.apiKey === null) {
      ciphertext = null;
    } else {
      const apiKey = required(input.apiKey, "API key");
      ciphertext = encryptApiKey(apiKey, store.settingsSecret);
    }
  }

  const updatedAt = store.clock();
  await store.db
    .prepare(
      `INSERT INTO ai_settings (id, base_url, model, api_key_ciphertext, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         base_url = EXCLUDED.base_url,
         model = EXCLUDED.model,
         api_key_ciphertext = EXCLUDED.api_key_ciphertext,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by`,
    )
    .run(AI_SETTINGS_ROW_ID, baseUrl, model, ciphertext, updatedAt, actor.id);

  store.log("ai_settings_updated", {
    result: "accepted",
    api_key_set: Boolean(ciphertext),
    base_url_host: (() => {
      try {
        return new URL(baseUrl).host;
      } catch {
        return "invalid";
      }
    })(),
  });

  return await getAiSettings(store, actor);
}

/**
 * Resolve decrypted credentials for chat. Fails closed when unset.
 * @param {Awaited<ReturnType<typeof createAiSettingsStore>>} store
 * @param {{ id: string, role: string }} actor
 */
export async function resolveAiChatConfig(store, actor) {
  adminOnly(actor);
  requireAiSettingsSecret(store.settingsSecret);
  const row = await readRow(store);
  if (!row?.apiKeyCiphertext) {
    throw new Error("AI API key is not configured. Save a BYOK key in admin AI settings.");
  }
  const apiKey = decryptApiKey(row.apiKeyCiphertext, store.settingsSecret);
  if (!apiKey) {
    throw new Error("AI API key is not configured. Save a BYOK key in admin AI settings.");
  }
  return {
    baseUrl: row.baseUrl || DEFAULT_AI_BASE_URL,
    model: row.model || DEFAULT_AI_MODEL,
    apiKey,
  };
}

/**
 * OpenAI-compatible chat completions client.
 * @param {{
 *   baseUrl: string,
 *   apiKey: string,
 *   model: string,
 *   messages: Array<{ role: string, content: string }>,
 *   maxTokens?: number,
 *   timeoutMs?: number,
 *   fetchImpl?: typeof fetch,
 * }} options
 */
export async function createChatCompletion({
  baseUrl,
  apiKey,
  model,
  messages,
  maxTokens = DEFAULT_CHAT_MAX_TOKENS,
  timeoutMs = DEFAULT_CHAT_TIMEOUT_MS,
  fetchImpl = globalThis.fetch,
} = {}) {
  const resolvedBase = required(baseUrl, "Base URL").replace(/\/+$/, "");
  const resolvedKey = required(apiKey, "API key");
  const resolvedModel = required(model, "Model");
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("At least one chat message is required.");
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is not available.");
  }

  const url = `${resolvedBase}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resolvedKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`AI provider timed out after ${timeoutMs}ms.`);
    }
    throw new Error(error instanceof Error ? error.message : "AI provider request failed.");
  } finally {
    clearTimeout(timer);
  }

  const bodyText = await response.text();
  let body;
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    body = { raw: bodyText };
  }

  if (!response.ok) {
    const detail =
      body?.error?.message ||
      body?.message ||
      (typeof body?.error === "string" ? body.error : null) ||
      `HTTP ${response.status}`;
    throw new Error(`AI provider error: ${detail}`);
  }

  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("AI provider returned no assistant message.");
  }

  return {
    content,
    model: body?.model || resolvedModel,
    usage: body?.usage ?? null,
  };
}

/**
 * Admin playground chat — loads BYOK config and calls the provider.
 * @param {Awaited<ReturnType<typeof createAiSettingsStore>>} store
 * @param {{ id: string, role: string }} actor
 * @param {{ message?: string, messages?: Array<{ role: string, content: string }>, fetchImpl?: typeof fetch, timeoutMs?: number, maxTokens?: number }} input
 */
export async function adminAiChat(store, actor, input = {}) {
  assertAiChatEnabled(input.env || process.env);
  const config = await resolveAiChatConfig(store, actor);
  assertAllowedAiBaseUrl(config.baseUrl, input.env || process.env);
  let messages = input.messages;
  if (!messages?.length) {
    const message = required(input.message, "Message");
    messages = [{ role: "user", content: message }];
  }
  try {
    const result = await createChatCompletion({
      ...config,
      messages,
      fetchImpl: input.fetchImpl,
      timeoutMs: input.timeoutMs,
      maxTokens: input.maxTokens,
    });
    store.log("ai_chat_completed", { result: "accepted", model: result.model });
    return result;
  } catch (error) {
    store.log("ai_chat_failed", {
      result: "rejected",
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}
