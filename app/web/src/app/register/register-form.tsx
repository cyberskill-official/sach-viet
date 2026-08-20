"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function RegisterForm() {
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
    if (!response.ok) return setError(body.error || "Unable to register.");
    setDone(true);
  }

  if (done) {
    return (
      <p className="cs-alert mt-8" role="status">
        Check your email for a verification link, then <Link className="underline" href="/login">sign in</Link>.
      </p>
    );
  }

  return (
    <form className="mt-8 grid gap-4" method="post" onSubmit={submit}>
      <label className="cs-field">
        <span className="cs-field__label">Email</span>
        <input required name="email" type="email" autoComplete="email" className="cs-field__control w-full" />
      </label>
      <label className="cs-field">
        <span className="cs-field__label">Password</span>
        <input required name="password" type="password" minLength={8} autoComplete="new-password" className="cs-field__control w-full" />
      </label>
      {error ? <p role="alert" className="cs-alert cs-alert--danger">{error}</p> : null}
      <button disabled={pending} className="cs-button w-full" type="submit">
        {pending ? "Creating..." : "Create account"}
      </button>
      <p className="text-sm text-muted">Already have an account? <Link className="underline" href="/login">Sign in</Link></p>
    </form>
  );
}
