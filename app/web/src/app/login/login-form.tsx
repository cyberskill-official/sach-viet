"use client";

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

  return <form className="mt-8 grid gap-4" onSubmit={submit}>
    <label className="grid gap-2 text-sm">Email<input required name="email" type="email" autoComplete="email" className="rounded border border-zinc-600 bg-zinc-950 px-3 py-2" /></label>
    <label className="grid gap-2 text-sm">Password<input required name="password" type="password" autoComplete="current-password" className="rounded border border-zinc-600 bg-zinc-950 px-3 py-2" /></label>
    {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
    <button disabled={pending} className="rounded bg-zinc-100 px-3 py-2 font-medium text-zinc-950 disabled:opacity-60" type="submit">{pending ? "Signing in..." : "Sign in"}</button>
  </form>;
}
