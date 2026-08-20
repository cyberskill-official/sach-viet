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
      <label className="cs-field">
        <span className="cs-field__label">New password</span>
        <input required name="password" type="password" minLength={8} autoComplete="new-password" className="cs-field__control w-full" />
      </label>
      {error ? <p role="alert" className="cs-alert cs-alert--danger">{error}</p> : null}
      <button disabled={pending || !token} className="cs-button w-full" type="submit">
        {pending ? "Saving..." : "Update password"}
      </button>
      <p className="text-sm text-muted"><Link className="underline" href="/login">Back to sign in</Link></p>
    </form>
  );
}
