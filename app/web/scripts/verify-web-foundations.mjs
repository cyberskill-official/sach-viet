import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const required = ["src/lib/web-foundations.mjs", "src/components/theme-provider.tsx", "src/components/portal-shell.tsx", "src/components/data-table.tsx", "src/app/(portals)/[portal]/page.tsx"];
export function validateWebFoundations(root) {
  const missing = required.filter((file) => !existsSync(resolve(root, file)));
  if (missing.length) throw new Error(`Missing web foundation files: ${missing.join(", ")}`);
  const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8");
  const web = readFileSync(resolve(root, "src/lib/web-foundations.mjs"), "utf8");
  if (!css.includes("prefers-reduced-motion")) throw new Error("Reduced-motion CSS is missing.");
  if (!web.includes("vi:") || !web.includes("en:")) throw new Error("Vietnamese and English catalogs are missing.");
  return { files: required.length };
}
if (process.argv[1]?.endsWith("verify-web-foundations.mjs")) console.log(JSON.stringify({ event: "web_foundations_verified", task_id: "TASK-REBUILD-003", ...validateWebFoundations(resolve(import.meta.dirname, "..")) }));
