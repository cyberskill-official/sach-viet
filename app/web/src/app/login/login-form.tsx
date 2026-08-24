"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { TourLauncher } from "@/components/tours/tour-provider";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const { locale, setLocale, t } = useLocale();
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
    let body: { error?: string; user?: { locale?: string }; redirectTo?: string } = {};
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
        return setError(body.error || t("auth.unableSignIn"));
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <Link className="cs-button cs-button--ghost text-sm" href="/features">{t("nav.features")}</Link>
        <div className="flex flex-wrap items-center gap-2">
          <TourLauncher tourId="tour.auth" />
          <button
            type="button"
            className="cs-button cs-button--ghost"
            data-tour="auth-lang"
            aria-label={t("common.language")}
            onClick={() => setLocale(locale === "en" ? "vi" : "en")}
          >
            {locale === "en" ? "VI" : "EN"}
          </button>
        </div>
      </div>
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
