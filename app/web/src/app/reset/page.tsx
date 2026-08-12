import { ResetForm } from "./reset-form";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <section className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-7">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-400">SachViet</p>
        <h1 className="mt-3 text-3xl font-semibold">Choose a new password</h1>
        <ResetForm token={token} />
      </section>
    </main>
  );
}
