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
      <p className="cs-alert mt-8" role="status">
        If an account exists, a reset email is on the way. <Link className="underline" href="/login">Back to sign in</Link>
      </p>
    );
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={submit}>
      <label className="cs-field">
        <span className="cs-field__label">Email</span>
        <input required name="email" type="email" autoComplete="email" className="cs-field__control w-full" />
      </label>
      <button disabled={pending} className="cs-button w-full" type="submit">
        {pending ? "Sending..." : "Send reset link"}
      </button>
      <p className="text-sm text-muted"><Link className="underline" href="/login">Back to sign in</Link></p>
    </form>
  );
}
