import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const params = await searchParams;
  const redirectTo = typeof params.redirect === "string" && params.redirect.startsWith("/") && !params.redirect.startsWith("//") ? params.redirect : "/";
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-6"><section className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-7"><p className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-400">SachViet</p><h1 className="mt-3 text-3xl font-semibold">Sign in</h1><p className="mt-2 text-sm text-zinc-300">Use an account created by an authorized administrator.</p><LoginForm redirectTo={redirectTo} /></section></main>;
}
