"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLocale } from "@/components/locale-provider";

export function ResetForm({ token }: { token: string }) {
  const { t } = useLocale();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: form.get("password") }),
    });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) return setError(body.error || t("auth.unableReset"));
    window.location.assign(body.redirectTo || "/");
  }

  return (
    <section className="cs-surface-heavy w-full rounded-2xl p-7">
      <p className="cs-eyebrow text-accent-strong">{t("common.brand")}</p>
      <h1 className="mt-3 text-3xl font-extrabold">{t("auth.updatePassword")}</h1>
      <form className="mt-8 grid gap-4" onSubmit={submit}>
        <label className="cs-field">
          <span className="cs-field__label">{t("account.newPassword")}</span>
          <input required name="password" type="password" minLength={8} autoComplete="new-password" className="cs-field__control w-full" />
        </label>
        {error ? <p role="alert" className="cs-alert cs-alert--danger">{error}</p> : null}
        <button disabled={pending || !token} className="cs-button w-full" type="submit">
          {pending ? t("auth.updating") : t("auth.updatePassword")}
        </button>
        <p className="text-sm text-muted">
          <Link className="underline" href="/login">{t("auth.signIn")}</Link>
        </p>
      </form>
    </section>
  );
}
