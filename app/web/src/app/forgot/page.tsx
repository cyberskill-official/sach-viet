import { ForgotForm } from "./forgot-form";

export default function ForgotPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="cs-surface-heavy w-full rounded-2xl p-7">
        <p className="cs-eyebrow text-accent-strong">Sách Việt</p>
        <h1 className="mt-3 text-3xl font-extrabold">Reset password</h1>
        <p className="mt-2 text-sm text-muted">If the email exists, a reset link is issued. The response does not disclose whether the account is present.</p>
        <ForgotForm />
      </section>
    </main>
  );
}
