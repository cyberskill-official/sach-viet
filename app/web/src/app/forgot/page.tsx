import { ForgotForm } from "./forgot-form";

export default function ForgotPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <section className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-7">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-400">SachViet</p>
        <h1 className="mt-3 text-3xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-zinc-300">If the email exists, a reset link is issued. The response does not disclose whether the account is present.</p>
        <ForgotForm />
      </section>
    </main>
  );
}
