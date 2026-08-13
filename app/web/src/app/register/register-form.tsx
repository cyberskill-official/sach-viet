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
      <p className="mt-8 text-sm text-zinc-200" role="status">
        Check your email for a verification link, then <Link className="underline" href="/login">sign in</Link>.
      </p>
    );
  }

  return (
    <form className="mt-8 grid gap-4" method="post" onSubmit={submit}>
      <label className="grid gap-2 text-sm">Email<input required name="email" type="email" autoComplete="email" className="rounded border border-zinc-600 bg-zinc-950 px-3 py-2" /></label>
      <label className="grid gap-2 text-sm">Password<input required name="password" type="password" minLength={8} autoComplete="new-password" className="rounded border border-zinc-600 bg-zinc-950 px-3 py-2" /></label>
      {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
      <button disabled={pending} className="rounded bg-zinc-100 px-3 py-2 font-medium text-zinc-950 disabled:opacity-60" type="submit">
        {pending ? "Creating..." : "Create account"}
      </button>
      <p className="text-sm text-zinc-400">Already have an account? <Link className="underline" href="/login">Sign in</Link></p>
    </form>
  );
}
