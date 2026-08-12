"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function ForgotForm() {
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
      <p className="mt-8 text-sm text-zinc-200" role="status">
        If an account exists, a reset email is on the way. <Link className="underline" href="/login">Back to sign in</Link>
      </p>
    );
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={submit}>
      <label className="grid gap-2 text-sm">Email<input required name="email" type="email" autoComplete="email" className="rounded border border-zinc-600 bg-zinc-950 px-3 py-2" /></label>
      <button disabled={pending} className="rounded bg-zinc-100 px-3 py-2 font-medium text-zinc-950 disabled:opacity-60" type="submit">
        {pending ? "Sending..." : "Send reset link"}
      </button>
      <p className="text-sm text-zinc-400"><Link className="underline" href="/login">Back to sign in</Link></p>
    </form>
  );
}
