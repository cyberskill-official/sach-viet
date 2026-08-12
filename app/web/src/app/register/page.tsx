import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <section className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-7">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-400">SachViet</p>
        <h1 className="mt-3 text-3xl font-semibold">Create an account</h1>
        <p className="mt-2 text-sm text-zinc-300">Register with email. Verify before signing in. Guest checkout is not available.</p>
        <RegisterForm />
      </section>
    </main>
  );
}
