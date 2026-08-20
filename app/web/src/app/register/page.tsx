import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="cs-surface-heavy w-full rounded-2xl p-7">
        <p className="cs-eyebrow text-accent-strong">Sách Việt</p>
        <h1 className="mt-3 text-3xl font-extrabold">Create an account</h1>
        <p className="mt-2 text-sm text-muted">Register with email. Verify before signing in. Guest checkout is not available.</p>
        <RegisterForm />
      </section>
    </main>
  );
}
