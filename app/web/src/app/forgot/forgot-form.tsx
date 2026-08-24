"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLocale } from "@/components/locale-provider";

export function ForgotForm() {
  const { t } = useLocale();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    setPending(false);
    setDone(true);
  }

  if (done) {
    return (
      <section className="w-full">
        <p className="sv-lux-eyebrow">{t("common.brand")}</p>
        <p className="cs-alert mt-8" role="status">
          {t("auth.resetSent")}{" "}
          <Link className="sv-text-link" href="/login">{t("auth.signIn")}</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="w-full">
      <p className="sv-lux-eyebrow">{t("common.brand")}</p>
      <h1 className="sv-font-display mt-3 text-3xl tracking-tight">{t("auth.forgotPassword")}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">{t("auth.forgotHint")}</p>
      <form className="mt-8 grid gap-4" onSubmit={submit}>
        <label className="cs-field">
          <span className="cs-field__label">{t("common.email")}</span>
          <input required name="email" type="email" autoComplete="email" inputMode="email" className="cs-field__control w-full" />
        </label>
        <button disabled={pending} className="cs-button w-full" type="submit">
          {pending ? t("auth.sending") : t("auth.sendResetLink")}
        </button>
        <p className="text-sm text-muted">
          <Link className="sv-text-link" href="/login">{t("auth.signIn")}</Link>
        </p>
      </form>
    </section>
  );
}
