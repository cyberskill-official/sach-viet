import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const required = ["src/lib/web-foundations.mjs", "src/components/theme-provider.tsx", "src/components/portal-shell.tsx", "src/components/data-table.tsx", "src/app/(portals)/[portal]/page.tsx"];

export function validateWebFoundations(root) {
  const missing = required.filter((file) => !existsSync(resolve(root, file)));
  if (missing.length) throw new Error(`Missing web foundation files: ${missing.join(", ")}`);
  const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8");
  const web = readFileSync(resolve(root, "src/lib/web-foundations.mjs"), "utf8");
  if (!css.includes("prefers-reduced-motion")) throw new Error("Reduced-motion CSS is missing.");

  const hasInlineVi = web.includes("vi:");
  const hasInlineEn = web.includes("en:");
  const messagesEnPath = resolve(root, "src/lib/i18n/messages-en.mjs");
  const messagesViPath = resolve(root, "src/lib/i18n/messages-vi.mjs");
  const i18nIndexPath = resolve(root, "src/lib/i18n/index.mjs");
  const hasMessagesEn = existsSync(messagesEnPath);
  const hasMessagesVi = existsSync(messagesViPath);
  const hasI18nIndex = existsSync(i18nIndexPath);
  let i18nIndexHasCatalogs = false;
  let messagesEnHasExport = false;
  let messagesViHasExport = false;
  if (hasI18nIndex) {
    const i18n = readFileSync(i18nIndexPath, "utf8");
    i18nIndexHasCatalogs = i18n.includes("en:") && i18n.includes("vi:") && i18n.includes("messagesEn") && i18n.includes("messagesVi");
  }
  if (hasMessagesEn) {
    messagesEnHasExport = readFileSync(messagesEnPath, "utf8").includes("export const messagesEn");
  }
  if (hasMessagesVi) {
    messagesViHasExport = readFileSync(messagesViPath, "utf8").includes("export const messagesVi");
  }

  // Catalogs live in src/lib/i18n/* (TASK-UI-005); accept split files OR legacy inline maps.
  const hasSplitCatalogs = hasMessagesEn && hasMessagesVi && messagesEnHasExport && messagesViHasExport && hasI18nIndex && i18nIndexHasCatalogs;
  const hasLegacyInline = hasInlineVi && hasInlineEn;
  if (!hasSplitCatalogs && !hasLegacyInline) {
    throw new Error("Vietnamese and English catalogs are missing.");
  }

  if (!web.includes("i18n/") && !hasLegacyInline) {
    throw new Error("web-foundations must re-export i18n translate or keep inline catalogs.");
  }

  return { files: required.length, catalogs: hasSplitCatalogs ? "split" : "inline" };
}
if (process.argv[1]?.endsWith("verify-web-foundations.mjs")) console.log(JSON.stringify({ event: "web_foundations_verified", task_id: "TASK-REBUILD-003", ...validateWebFoundations(resolve(import.meta.dirname, "..")) }));
