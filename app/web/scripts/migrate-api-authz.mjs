/**
 * One-shot migrator: replace readSession boilerplate with requireApiPermission.
 * Run: node scripts/migrate-api-authz.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const apiRoot = join(root, "src/app/api");

const SKIP_PATH_PARTS = [
  "/api/health/",
  "/api/ready/",
  "/api/webhooks/",
  "/api/cron/",
  "/api/test/",
  "/api/auth/login/",
  "/api/auth/register/",
  "/api/auth/forgot/",
  "/api/auth/reset/",
  "/api/auth/verify/",
  "/api/catalog/",
  "/api/quote/",
  "/api/finance/policy/",
  "/api/returns/policy/",
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (name === "route.ts") files.push(path);
  }
  return files;
}

function shouldSkip(rel) {
  const normalized = rel.replace(/\\/g, "/");
  return SKIP_PATH_PARTS.some((part) => normalized.includes(part));
}

function migrateFile(path) {
  let src = readFileSync(path, "utf8");
  if (!src.includes("readSession")) return { path, changed: false, reason: "no readSession" };
  if (src.includes("requireApiPermission") || src.includes("requirePermission(request")) {
    return { path, changed: false, reason: "already migrated" };
  }

  const original = src;

  if (!src.includes("@/lib/authz-http.mjs")) {
    if (src.includes("from \"next/server\"")) {
      src = src.replace(
        /import \{ NextResponse \} from "next\/server";\n/,
        "import { NextResponse } from \"next/server\";\nimport { requireApiPermission } from \"@/lib/authz-http.mjs\";\n",
      );
    } else {
      src = `import { requireApiPermission } from "@/lib/authz-http.mjs";\n${src}`;
    }
  }

  // Inline session check (NextResponse 401)
  src = src.replace(
    /const token = request\.headers\.get\("cookie"\)\?\.match\(new RegExp\(`\$\{COOKIE_NAME\}=([^;]+)`\)\)\?\.\[1\];\s*\n\s*const session = await readSession\(await getAuthStore\(\), token, process\.env\.AUTH_SESSION_SECRET\);\s*\n\s*if \(!session\) return NextResponse\.json\(\{ error: "Unauthenticated\." \}, \{ status: 401 \}\);/g,
    "const auth = await requireApiPermission(request);\n    if (!auth.ok) return auth.response;",
  );

  // Inline session check (jsonError 401)
  src = src.replace(
    /const token = request\.headers\.get\("cookie"\)\?\.match\(new RegExp\(`\$\{COOKIE_NAME\}=([^;]+)`\)\)\?\.\[1\];\s*\n\s*const session = await readSession\(await getAuthStore\(\), token, process\.env\.AUTH_SESSION_SECRET\);\s*\n\s*if \(!session\) return jsonError\(API_ERROR_CODES\.unauthenticated, "Unauthenticated\.", \{ status: 401, requestId \}\);/g,
    "const auth = await requireApiPermission(request);\n    if (!auth.ok) return auth.response;",
  );

  // sessionFor helper + usage
  src = src.replace(
    /async function sessionFor\(request: Request\) \{\s*\n\s*const token = request\.headers\.get\("cookie"\)\?\.match\(new RegExp\(`\$\{COOKIE_NAME\}=([^;]+)`\)\)\?\.\[1\];\s*\n\s*return readSession\(await getAuthStore\(\), token, process\.env\.AUTH_SESSION_SECRET\);\s*\n\}\s*\n\n?/g,
    "",
  );
  src = src.replace(
    /const session = await sessionFor\(request\);\s*\n\s*if \(!session\) return NextResponse\.json\(\{ error: "Unauthenticated\." \}, \{ status: 401 \}\);/g,
    "const auth = await requireApiPermission(request);\n    if (!auth.ok) return auth.response;",
  );

  // auth/me special case
  src = src.replace(
    /const token = request\.headers\.get\("cookie"\)\?\.match\(new RegExp\(`\$\{COOKIE_NAME\}=([^;]+)`\)\)\?\.\[1\];\s*\n\s*const session = await readSession\(await getAuthStore\(\), token, process\.env\.AUTH_SESSION_SECRET\);\s*\n\s*return session \? NextResponse\.json\(\{ user: session\.user \}\) : NextResponse\.json\(\{ error: "Unauthenticated\." \}, \{ status: 401 \}\);/g,
    "const auth = await requireApiPermission(request);\n    if (!auth.ok) return auth.response;\n    return NextResponse.json({ user: auth.user });",
  );

  src = src.replace(/session\.user/g, "auth.user");

  // Drop unused auth-core imports when only used for session
  if (!src.includes("readSession") && !src.includes("getAuthStore") && !src.includes("COOKIE_NAME")) {
    src = src.replace(/import \{[^}]*\} from "@\/lib\/auth-core\.mjs";\n/g, (line) => {
      if (line.includes("readSession") || line.includes("getAuthStore") || line.includes("COOKIE_NAME")) return "";
      return line;
    });
  } else if (!src.includes("readSession")) {
    src = src.replace(
      /import \{([^}]+)\} from "@\/lib\/auth-core\.mjs";/g,
      (match, imports) => {
        const kept = imports
          .split(",")
          .map((s) => s.trim())
          .filter((name) => name && !["COOKIE_NAME", "getAuthStore", "readSession"].includes(name));
        if (kept.length === 0) return "";
        return `import { ${kept.join(", ")} } from "@/lib/auth-core.mjs";`;
      },
    );
  }

  if (src === original) return { path, changed: false, reason: "no pattern matched" };
  writeFileSync(path, src);
  return { path, changed: true };
}

const results = walk(apiRoot).map((path) => {
  const rel = relative(join(root, "src/app"), path);
  if (shouldSkip(rel)) return { path: rel, changed: false, reason: "skipped public" };
  return migrateFile(path);
});

const changed = results.filter((r) => r.changed);
const skipped = results.filter((r) => !r.changed);
console.log(`Changed ${changed.length} files`);
for (const r of changed) console.log("  +", relative(root, r.path));
console.log(`Skipped ${skipped.length} files`);
for (const r of skipped.filter((x) => x.reason === "no pattern matched")) {
  console.log("  ?", relative(root, r.path));
}
