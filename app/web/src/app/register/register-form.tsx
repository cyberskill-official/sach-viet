"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLocale } from "@/components/locale-provider";

export function RegisterForm() {
  const { t } = useLocale();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

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
      <section className="cs-surface-heavy w-full rounded-2xl p-7">
        <p className="cs-eyebrow text-accent-strong">{t("common.brand")}</p>
        <p className="cs-alert mt-8" role="status">
          {t("auth.checkEmail")}{" "}
          <Link className="underline" href="/login">{t("auth.signIn")}</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="cs-surface-heavy w-full rounded-2xl p-7">
      <p className="cs-eyebrow text-accent-strong">{t("common.brand")}</p>
      <h1 className="mt-3 text-3xl font-extrabold">{t("auth.createAccount")}</h1>
      <p className="mt-2 text-sm text-muted">Register with email. Verify before signing in. Guest checkout is not available.</p>
      <form className="mt-8 grid gap-4" method="post" onSubmit={submit}>
        <label className="cs-field">
          <span className="cs-field__label">{t("common.email")}</span>
          <input required name="email" type="email" autoComplete="email" className="cs-field__control w-full" />
        </label>
        <label className="cs-field">
          <span className="cs-field__label">{t("common.password")}</span>
          <input required name="password" type="password" minLength={8} autoComplete="new-password" className="cs-field__control w-full" />
        </label>
        {error ? <p role="alert" className="cs-alert cs-alert--danger">{error}</p> : null}
        <button disabled={pending} className="cs-button w-full" type="submit">
          {pending ? t("auth.creating") : t("auth.createAccount")}
        </button>
        <p className="text-sm text-muted">
          <Link className="underline" href="/login">{t("auth.signIn")}</Link>
        </p>
      </form>
    </section>
  );
}
