"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";

export function ResetForm({ token }: { token: string }) {
  const { t } = useLocale();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
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
          <input
            required
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            className="cs-field__control w-full"
            aria-invalid={error ? true : undefined}
            aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}
          />
          <span id={hintId} className="sv-field-hint">{t("auth.passwordHint")}</span>
        </label>
        {error ? <p ref={errorRef} id={errorId} role="alert" tabIndex={-1} className="cs-alert cs-alert--danger outline-none">{error}</p> : null}
        <button disabled={pending || !token} className="cs-button w-full" type="submit">
          {pending ? t("auth.updating") : t("auth.updatePassword")}
        </button>
        <p className="text-sm text-muted">
          <Link className="sv-text-link" href="/login">{t("auth.signIn")}</Link>
        </p>
      </form>
    </section>
  );
}
