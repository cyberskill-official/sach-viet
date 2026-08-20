import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const params = await searchParams;
  const redirectTo = typeof params.redirect === "string" && params.redirect.startsWith("/") && !params.redirect.startsWith("//") ? params.redirect : "/";
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="cs-surface-heavy w-full rounded-2xl p-7">
        <p className="cs-eyebrow text-accent-strong">Sách Việt</p>
        <h1 className="mt-3 text-3xl font-extrabold">Sign in</h1>
        <p className="mt-2 text-sm text-muted">Use a verified customer account or an administrator-created role account.</p>
        <LoginForm redirectTo={redirectTo} />
      </section>
    </main>
  );
}
