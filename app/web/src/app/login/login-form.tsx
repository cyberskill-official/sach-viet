"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLocale } from "@/components/locale-provider";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const { setLocale, t } = useLocale();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password"), redirect: redirectTo }) });
    const body = await response.json();
    setPending(false);
    if (!response.ok) return setError(body.error || t("auth.unableSignIn"));
    const userLocale = body.user?.locale;
    if (userLocale === "en" || userLocale === "vi") {
      setLocale(userLocale);
    }
    window.location.assign(body.redirectTo);
  }

  return (
    <section className="cs-surface-heavy w-full rounded-2xl p-7">
      <p className="cs-eyebrow text-accent-strong">{t("common.brand")}</p>
      <h1 className="mt-3 text-3xl font-extrabold">{t("auth.signIn")}</h1>
      <p className="mt-2 text-sm text-muted">Use a verified customer account or an administrator-created role account.</p>
      <form className="mt-8 grid gap-4" method="post" onSubmit={submit}>
        <label className="cs-field">
          <span className="cs-field__label">{t("common.email")}</span>
          <input required name="email" type="email" autoComplete="email" className="cs-field__control w-full" />
        </label>
        <label className="cs-field">
          <span className="cs-field__label">{t("common.password")}</span>
          <input required name="password" type="password" autoComplete="current-password" className="cs-field__control w-full" />
        </label>
        {error ? <p role="alert" className="cs-alert cs-alert--danger">{error}</p> : null}
        <button disabled={pending} className="cs-button w-full" type="submit">{pending ? t("auth.signingIn") : t("auth.signIn")}</button>
        <p className="text-sm text-muted">
          <Link className="underline" href="/register">{t("auth.createAccount")}</Link>
          {" · "}
          <Link className="underline" href="/forgot">{t("auth.forgotPassword")}</Link>
        </p>
      </form>
    </section>
  );
}
