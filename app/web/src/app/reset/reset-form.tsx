"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function ResetForm({ token }: { token: string }) {
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
    if (!response.ok) return setError(body.error || "Unable to reset password.");
    window.location.assign(body.redirectTo || "/");
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={submit}>
      <label className="grid gap-2 text-sm">New password<input required name="password" type="password" minLength={8} autoComplete="new-password" className="rounded border border-zinc-600 bg-zinc-950 px-3 py-2" /></label>
      {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
      <button disabled={pending || !token} className="rounded bg-zinc-100 px-3 py-2 font-medium text-zinc-950 disabled:opacity-60" type="submit">
        {pending ? "Saving..." : "Update password"}
      </button>
      <p className="text-sm text-zinc-400"><Link className="underline" href="/login">Back to sign in</Link></p>
    </form>
  );
}
