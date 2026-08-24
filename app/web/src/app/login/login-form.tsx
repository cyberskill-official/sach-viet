"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";

const AUTH_ERROR_CODES: Record<string, string> = {
  invalid_credentials: "auth.invalidCredentials",
  unverified: "auth.emailUnverified",
  throttled: "auth.loginThrottled",
  invalid_request: "auth.invalidLoginRequest",
  auth_not_configured: "auth.authNotConfigured",
};

function localizeAuthError(
  body: { error?: string; code?: string },
  t: (key: string) => string,
): string {
  if (body.code && AUTH_ERROR_CODES[body.code]) return t(AUTH_ERROR_CODES[body.code]);
  const raw = typeof body.error === "string" ? body.error : "";
  if (/invalid email or password/i.test(raw)) return t("auth.invalidCredentials");
  if (/not verified/i.test(raw)) return t("auth.emailUnverified");
  if (/too many/i.test(raw)) return t("auth.loginThrottled");
  if (/not configured/i.test(raw)) return t("auth.authNotConfigured");
  if (/invalid login request/i.test(raw)) return t("auth.invalidLoginRequest");
  return raw || t("auth.unableSignIn");
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const { setLocale, t } = useLocale();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const errorId = useId();
  const errorRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    let body: { error?: string; code?: string; user?: { locale?: string }; redirectTo?: string } = {};
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password"), redirect: redirectTo }),
      });
      body = await response.json().catch(() => ({}));
      setPending(false);
      if (!response.ok || !body.user) {
        return setError(localizeAuthError(body, t));
      }
    } catch {
      setPending(false);
      return setError(t("auth.unableSignIn"));
    }
    const userLocale = body.user?.locale;
    if (userLocale === "en" || userLocale === "vi") {
      setLocale(userLocale);
    }
    const next = typeof body.redirectTo === "string" && body.redirectTo.startsWith("/") && !body.redirectTo.startsWith("//")
      ? body.redirectTo
      : "/";
    window.location.assign(next);
  }

  return (
    <section className="w-full">
      <p className="sv-lux-eyebrow">{t("common.brand")}</p>
      <h1 className="sv-font-display mt-3 text-3xl tracking-tight">{t("auth.signIn")}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">{t("auth.signInHint")}</p>
      <form className="mt-8 grid gap-4" data-tour="auth-form" onSubmit={submit} noValidate>
        <label className="cs-field">
          <span className="cs-field__label">{t("common.email")}</span>
          <input required name="email" type="email" autoComplete="email" inputMode="email" className="cs-field__control w-full" aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} />
        </label>
        <label className="cs-field">
          <span className="cs-field__label">{t("common.password")}</span>
          <input required name="password" type="password" autoComplete="current-password" className="cs-field__control w-full" aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} />
        </label>
        {error ? <p ref={errorRef} id={errorId} role="alert" tabIndex={-1} className="cs-alert cs-alert--danger outline-none">{error}</p> : null}
        <button disabled={pending} className="cs-button w-full" type="submit">{pending ? t("auth.signingIn") : t("auth.signIn")}</button>
        <p className="text-sm text-muted">
          <Link className="sv-text-link" href="/register">{t("auth.createAccount")}</Link>
          {" · "}
          <Link className="sv-text-link" href="/forgot">{t("auth.forgotPassword")}</Link>
        </p>
      </form>
    </section>
  );
}
