"use client";

import Link from "next/link";
import { useTheme } from "./theme-provider";
import { themes } from "@/lib/web-foundations.mjs";

export function PortalShell({ portal, locale, children }: { portal: string; locale: string; children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  return <main className="min-h-screen bg-background text-foreground"><header className="border-b border-border bg-panel/80 px-6 py-4 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4"><Link href={`/${portal}`} className="font-semibold">SachViet / {portal}</Link><nav className="flex items-center gap-3 text-sm"><Link href={`/${portal}?lang=${locale === "vi" ? "en" : "vi"}`}>{locale === "vi" ? "EN" : "VI"}</Link><select aria-label="Theme" value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)} className="rounded border border-border bg-panel px-2 py-1">{themes.map((item) => <option key={item} value={item}>{item}</option>)}</select></nav></div></header><section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[13rem_1fr]"><aside className="rounded-xl border border-border bg-panel p-4 text-sm"><p className="font-medium">Navigation</p><Link className="mt-3 block text-muted hover:text-foreground" href={`/${portal}`}>Overview</Link></aside><div className="rounded-xl border border-border bg-panel p-6">{children}</div></section></main>;
}
