import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const params = await searchParams;
  const redirectTo = typeof params.redirect === "string" && params.redirect.startsWith("/") && !params.redirect.startsWith("//") ? params.redirect : "/";
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}
