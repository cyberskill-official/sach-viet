"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";

export function RegisterForm({ fromCircle = false }: { fromCircle?: boolean }) {
  const { t } = useLocale();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const errorId = useId();
  const hintId = useId();
  const errorRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) return setError(body.error || t("auth.unableRegister"));
    setDone(true);
  }

  if (done) {
    return (
      <section className="w-full">
        <p className="sv-lux-eyebrow">{t("common.brand")}</p>
        <p className="cs-alert mt-8" role="status">
          {t("auth.checkEmail")}{" "}
          <Link className="sv-text-link" href="/login">{t("auth.signIn")}</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="w-full">
      <p className="sv-lux-eyebrow">{t("common.brand")}</p>
      <h1 className="sv-font-display mt-3 text-3xl tracking-tight">{t("auth.createAccount")}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">{fromCircle ? t("auth.registerCircleHint") : t("auth.registerHint")}</p>
      <form className="mt-8 grid gap-4" method="post" data-tour="auth-form" onSubmit={submit}>
        <label className="cs-field">
          <span className="cs-field__label">{t("common.email")}</span>
          <input required name="email" type="email" autoComplete="email" inputMode="email" className="cs-field__control w-full" aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} />
        </label>
        <label className="cs-field">
          <span className="cs-field__label">{t("common.password")}</span>
          <input required name="password" type="password" minLength={8} autoComplete="new-password" className="cs-field__control w-full" aria-invalid={error ? true : undefined} aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`} />
          <span id={hintId} className="sv-field-hint">{t("auth.passwordHint")}</span>
        </label>
        {error ? <p ref={errorRef} id={errorId} role="alert" tabIndex={-1} className="cs-alert cs-alert--danger outline-none">{error}</p> : null}
        <button disabled={pending} className="cs-button w-full" type="submit">
          {pending ? t("auth.creating") : t("auth.createAccount")}
        </button>
        <p className="text-sm text-muted">
          <Link className="sv-text-link" href="/login">{t("auth.signIn")}</Link>
          {" · "}
          <Link className="sv-text-link" href="/membership">{t("storefront.membershipEyebrow")}</Link>
        </p>
      </form>
    </section>
  );
}
