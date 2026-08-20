"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
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
    if (!response.ok) return setError(body.error || "Unable to sign in.");
    window.location.assign(body.redirectTo);
  }

  return (
    <form className="mt-8 grid gap-4" method="post" onSubmit={submit}>
      <label className="cs-field">
        <span className="cs-field__label">Email</span>
        <input required name="email" type="email" autoComplete="email" className="cs-field__control w-full" />
      </label>
      <label className="cs-field">
        <span className="cs-field__label">Password</span>
        <input required name="password" type="password" autoComplete="current-password" className="cs-field__control w-full" />
      </label>
      {error ? <p role="alert" className="cs-alert cs-alert--danger">{error}</p> : null}
      <button disabled={pending} className="cs-button w-full" type="submit">{pending ? "Signing in..." : "Sign in"}</button>
      <p className="text-sm text-muted">
        <Link className="underline" href="/register">Create an account</Link>
        {" · "}
        <Link className="underline" href="/forgot">Forgot password</Link>
      </p>
    </form>
  );
}
