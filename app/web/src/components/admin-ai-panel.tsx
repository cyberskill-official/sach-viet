"use client";

import { useCallback, useEffect, useState } from "react";

type ProviderHint = { id: string; label: string; baseUrl: string; modelExample: string };
type AiSettings = {
  baseUrl: string;
  model: string;
  apiKeyConfigured: boolean;
  apiKeyLast4: string | null;
  encryptionReady: boolean;
  defaults: { baseUrl: string; model: string };
  providers: ProviderHint[];
};

async function readJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

export function AdminAiPanel() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState("Ping — reply with one short sentence.");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const body = await readJson("/api/admin/ai-settings");
      const next = body.settings as AiSettings;
      setSettings(next);
      setBaseUrl(next.baseUrl);
      setModel(next.model);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "AI settings unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function applyProvider(provider: ProviderHint) {
    setBaseUrl(provider.baseUrl);
    setModel(provider.modelExample);
    setInfo(`Filled ${provider.label} defaults. Paste your API key and save.`);
  }

  async function save() {
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const payload: { baseUrl: string; model: string; apiKey?: string } = { baseUrl, model };
      if (apiKey.trim()) payload.apiKey = apiKey.trim();
      const body = await readJson("/api/admin/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const next = body.settings as AiSettings;
      setSettings(next);
      setApiKey("");
      setInfo("AI settings saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save AI settings.");
    } finally {
      setSaving(false);
    }
  }

  async function chat() {
    setChatting(true);
    setError("");
    setReply("");
    try {
      const body = await readJson("/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      setReply(body.reply?.content || "");
      setInfo(`Playground OK (${body.reply?.model || model}).`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Playground request failed.");
    } finally {
      setChatting(false);
    }
  }

  if (loading) return <div className="cs-skeleton h-64 rounded-2xl" />;

  return (
    <section id="ai" className="cs-surface-standard scroll-mt-24 rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">AI BYOK (admin)</h2>
          <p className="mt-2 text-sm text-muted">
            Bring your own OpenAI-compatible key. Prefer free models (OpenRouter free, Groq, or local Ollama).
            Keys are encrypted with <code className="text-xs">AI_SETTINGS_SECRET</code>.
          </p>
        </div>
        <span className="cs-badge">
          {settings?.encryptionReady ? "encryption ready" : "secret missing"} ·{" "}
          {settings?.apiKeyConfigured ? `key ${settings.apiKeyLast4 || "set"}` : "no key"}
        </span>
      </div>

      {error ? (
        <div className="cs-alert cs-alert--danger mt-4" role="alert">
          {error}
        </div>
      ) : null}
      {info ? (
        <div className="cs-alert mt-4" role="status">
          {info}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {(settings?.providers || []).map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="cs-button cs-button--secondary"
            onClick={() => applyProvider(provider)}
          >
            {provider.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Base URL</span>
          <input
            className="cs-field__control"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder={settings?.defaults.baseUrl}
            autoComplete="off"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Model</span>
          <input
            className="cs-field__control"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder={settings?.defaults.model}
            autoComplete="off"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted">
            API key {settings?.apiKeyConfigured ? `(stored ${settings.apiKeyLast4}) — leave blank to keep` : ""}
          </span>
          <input
            className="cs-field__control"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-… or provider token"
            autoComplete="off"
          />
        </label>
        <div>
          <button type="button" className="cs-button" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <h3 className="text-lg font-semibold">Playground</h3>
        <p className="mt-1 text-sm text-muted">Admin-only smoke test. Customer AI is not enabled.</p>
        <label className="mt-4 grid gap-1 text-sm">
          <span className="text-muted">Message</span>
          <textarea
            className="cs-field__control min-h-24"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <div className="mt-3">
          <button type="button" className="cs-button" disabled={chatting} onClick={() => void chat()}>
            {chatting ? "Calling…" : "Send"}
          </button>
        </div>
        {reply ? (
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl border border-border p-4 text-sm">
            {reply}
          </pre>
        ) : null}
      </div>
    </section>
  );
}
