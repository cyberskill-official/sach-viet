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
      <section className="cs-surface-heavy w-full rounded-2xl p-7">
        <p className="cs-eyebrow text-accent-strong">{t("common.brand")}</p>
        <p className="cs-alert mt-8" role="status">
          {t("auth.resetSent")}{" "}
          <Link className="underline" href="/login">{t("auth.signIn")}</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="cs-surface-heavy w-full rounded-2xl p-7">
      <p className="cs-eyebrow text-accent-strong">{t("common.brand")}</p>
      <h1 className="mt-3 text-3xl font-extrabold">{t("auth.forgotPassword")}</h1>
      <p className="mt-2 text-sm text-muted">If the email exists, a reset link is issued. The response does not disclose whether the account is present.</p>
      <form className="mt-8 grid gap-4" onSubmit={submit}>
        <label className="cs-field">
          <span className="cs-field__label">{t("common.email")}</span>
          <input required name="email" type="email" autoComplete="email" className="cs-field__control w-full" />
        </label>
        <button disabled={pending} className="cs-button w-full" type="submit">
          {pending ? t("auth.sending") : t("auth.sendResetLink")}
        </button>
        <p className="text-sm text-muted">
          <Link className="underline" href="/login">{t("auth.signIn")}</Link>
        </p>
      </form>
    </section>
  );
}
