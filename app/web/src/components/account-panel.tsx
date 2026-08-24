"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { displayTier, displayTierLabel, formatRoleForDisplay } from "@/lib/access.mjs";

type Account = { id: string; email: string; role: string; locale: string; createdAt: number };
type Address = { id: string; label: string; line1: string; line2?: string | null; city: string; region?: string | null; postalCode?: string | null; country: string };

function apiMessage(body: Record<string, unknown>, fallback: string) {
  const error = body.error;
  if (error && typeof error === "object" && error !== null && "message" in error) return String((error as { message: string }).message);
  if (typeof error === "string") return error;
  return fallback;
}

async function readJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    window.location.assign("/login?redirect=/account");
    throw new Error("Unauthenticated.");
  }
  if (!response.ok) throw new Error(apiMessage(body, `Request failed (${response.status}).`));
  return body;
}

export function AccountPanel() {
  const { setLocale: setAppLocale, t } = useLocale();
  const [account, setAccount] = useState<Account | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [email, setEmail] = useState("");
  const [locale, setLocale] = useState("en");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [accountBody, addressBody] = await Promise.all([
        readJson("/api/account"),
        readJson("/api/account/addresses"),
      ]);
      if (!accountBody.account) throw new Error(t("account.loadError"));
      setAccount(accountBody.account);
      setEmail(accountBody.account.email);
      setLocale(accountBody.account.locale || "en");
      setAddresses(Array.isArray(addressBody.items) ? addressBody.items : []);
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") {
        setError(reason.message);
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("profile");
    setError("");
    setNotice("");
    try {
      const body = await readJson("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      setAccount(body.account);
      if (locale === "en" || locale === "vi") {
        setAppLocale(locale);
      }
      setNotice(t("account.profileSaved"));
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") setError(reason.message);
    } finally {
      setBusy("");
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("password");
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await readJson("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: String(data.get("currentPassword") || ""),
          password: String(data.get("password") || ""),
        }),
      });
      form.reset();
      setNotice(t("account.passwordChanged"));
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") setError(reason.message);
    } finally {
      setBusy("");
    }
  }

  async function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("address");
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const body = await readJson("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: String(data.get("label") || ""),
          line1: String(data.get("line1") || ""),
          line2: String(data.get("line2") || "") || undefined,
          city: String(data.get("city") || ""),
          region: String(data.get("region") || "") || undefined,
          postalCode: String(data.get("postalCode") || "") || undefined,
          country: String(data.get("country") || "US"),
        }),
      });
      form.reset();
      if (body.address) setAddresses((current) => [body.address, ...current]);
      setNotice(t("account.addAddress"));
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") setError(reason.message);
    } finally {
      setBusy("");
    }
  }

  async function removeAddress(id: string) {
    setBusy(id);
    setError("");
    try {
      await readJson(`/api/account/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
      setAddresses((current) => current.filter((item) => item.id !== id));
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") setError(reason.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <Link className="text-sm text-accent-strong hover:underline" href="/">← {t("nav.home")}</Link>
      <p className="cs-eyebrow mt-8 text-accent-strong">{t("nav.account")}</p>
      <h1 className="mt-2 text-4xl font-extrabold">{t("account.title")}</h1>
      {loading ? <div className="cs-skeleton mt-8 h-40 rounded-2xl" /> : null}
      {error ? <p className="cs-alert cs-alert--danger mt-8" role="alert">{error}</p> : null}
      {notice ? <p className="cs-alert mt-8" role="status">{notice}</p> : null}

      {account ? (
        <section className="mt-10 grid gap-8 lg:grid-cols-2">
          <form
            className="cs-surface-standard grid gap-3 rounded-2xl p-6"
            data-tour="account-profile"
            onSubmit={(event) => { void saveProfile(event); }}
          >
            <h2 className="text-xl font-bold">{t("account.title")}</h2>
            <label className="grid gap-2 text-sm">
              {t("common.email")}
              <input required type="email" className="cs-field__control" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm" data-tour="account-locale">
              {t("account.locale")}
              <select aria-label="Locale" className="cs-field__control" value={locale} onChange={(event) => setLocale(event.target.value)}>
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </label>
            <p className="text-sm text-muted" data-access-tier={displayTier(account.role)}>
              <span className="cs-badge mr-2">{displayTierLabel(account.role, locale === "vi" ? "vi" : "en")}</span>
              {formatRoleForDisplay(account.role, locale === "vi" ? "vi" : "en")}
            </p>
            <button className="cs-button" disabled={busy === "profile"} type="submit">{t("common.save")}</button>
          </form>
          <form className="cs-surface-standard grid gap-3 rounded-2xl p-6" onSubmit={(event) => { void changePassword(event); }}>
            <h2 className="text-xl font-bold">{t("account.changePassword")}</h2>
            <label className="grid gap-2 text-sm">
              {t("account.currentPassword")}
              <input required type="password" name="currentPassword" className="cs-field__control" autoComplete="current-password" />
            </label>
            <label className="grid gap-2 text-sm">
              {t("account.newPassword")}
              <input required type="password" name="password" className="cs-field__control" autoComplete="new-password" minLength={8} />
            </label>
            <button className="cs-button cs-button--secondary" disabled={busy === "password"} type="submit">{t("account.changePassword")}</button>
          </form>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-2xl font-bold">{t("account.addresses")}</h2>
        <form className="cs-surface-standard mt-4 grid gap-3 rounded-2xl p-6" onSubmit={(event) => { void addAddress(event); }}>
          <label className="grid gap-2 text-sm">
            {t("account.label")}
            <input required name="label" className="cs-field__control" />
          </label>
          <label className="grid gap-2 text-sm">
            {t("cart.line1")}
            <input required name="line1" className="cs-field__control" />
          </label>
          <label className="grid gap-2 text-sm">
            {t("cart.line2")}
            <input name="line2" className="cs-field__control" />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-2 text-sm">
              {t("cart.city")}
              <input required name="city" className="cs-field__control" />
            </label>
            <label className="grid gap-2 text-sm">
              {t("cart.region")}
              <input name="region" className="cs-field__control" />
            </label>
            <label className="grid gap-2 text-sm">
              {t("cart.postal")}
              <input name="postalCode" className="cs-field__control" />
            </label>
          </div>
          <label className="grid gap-2 text-sm">
            {t("cart.country")}
            <input name="country" className="cs-field__control" defaultValue="US" />
          </label>
          <button className="cs-button" disabled={busy === "address"} type="submit">{t("account.addAddress")}</button>
        </form>
        <ul className="mt-4 grid gap-2">
          {addresses.map((address) => (
            <li key={address.id} className="cs-surface-standard flex flex-wrap items-start justify-between gap-3 rounded-xl p-4">
              <div>
                <strong>{address.label}</strong>
                <p className="mt-1 text-sm text-muted">{address.line1}{address.line2 ? `, ${address.line2}` : ""} · {address.city}</p>
              </div>
              <button className="cs-button cs-button--secondary" disabled={busy === address.id} type="button" onClick={() => { void removeAddress(address.id); }}>{t("account.deleteAddress")}</button>
            </li>
          ))}
        </ul>
        {!loading && addresses.length === 0 ? <p className="mt-3 text-muted">{t("account.noAddresses")}</p> : null}
      </section>
    </main>
  );
}
