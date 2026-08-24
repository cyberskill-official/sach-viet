/**
 * Second pass: finish migrating routes that still call readSession.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const apiRoot = join(root, "src/app/api");

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (name === "route.ts") files.push(path);
  }
  return files;
}

function migrateFile(path) {
  let src = readFileSync(path, "utf8");
  if (!src.includes("readSession")) return false;

  const original = src;

  if (!src.includes("requireApiPermission")) {
    if (src.includes("from \"next/server\"")) {
      src = src.replace(
        /import \{ NextResponse \} from "next\/server";\n/,
        "import { NextResponse } from \"next/server\";\nimport { requireApiPermission } from \"@/lib/authz-http.mjs\";\n",
      );
    } else {
      src = `import { requireApiPermission } from "@/lib/authz-http.mjs";\n${src}`;
    }
  }

  // One-line sessionFor helpers
  src = src.replace(
    /async function sessionFor\(request: Request\) \{ return await readSession\(await getAuthStore\(\), request\.headers\.get\("cookie"\)\?\.match\(new RegExp\(`\$\{COOKIE_NAME\}=([^;]+)`\)\)\?\.\[1\], process\.env\.AUTH_SESSION_SECRET\); \}\s*\n?/g,
    "",
  );
  src = src.replace(
    /async function sessionFor\(request: Request\) \{\s*const token = request\.headers\.get\("cookie"\)\?\.match\(new RegExp\(`\$\{COOKIE_NAME\}=([^;]+)`\)\)\?\.\[1\];\s*return readSession\(await getAuthStore\(\), token, process\.env\.AUTH_SESSION_SECRET\);\s*\}\s*\n?/g,
    "",
  );

  // Multiline sessionFor returning readSession
  src = src.replace(
    /async function sessionFor\(request: Request\) \{\s*return await readSession\(\s*await getAuthStore\(\),\s*[^)]+\);\s*\}\s*\n?/gs,
    "",
  );

  // const token + readSession + if (!session) jsonError
  src = src.replace(
    /const token = request\.headers\.get\("cookie"\)\?\.match\(new RegExp\(`\$\{COOKIE_NAME\}=([^;]+)`\)\)\?\.\[1\];\s*\n\s*const session = await readSession\(await getAuthStore\(\), token, process\.env\.AUTH_SESSION_SECRET\);\s*\n\s*if \(!session\) return jsonError\(API_ERROR_CODES\.unauthenticated, "Unauthenticated\.", \{ status: 401, requestId \}\);/g,
    "const auth = await requireApiPermission(request);\n    if (!auth.ok) return auth.response;",
  );

  // const token + readSession + if (!session) NextResponse
  src = src.replace(
    /const token = request\.headers\.get\("cookie"\)\?\.match\(new RegExp\(`\$\{COOKIE_NAME\}=([^;]+)`\)\)\?\.\[1\];\s*\n\s*const session = await readSession\(await getAuthStore\(\), token, process\.env\.AUTH_SESSION_SECRET\);\s*\n\s*if \(!session\) return NextResponse\.json\(\{ error: "Unauthenticated\." \}, \{ status: 401 \}\);/g,
    "const auth = await requireApiPermission(request);\n    if (!auth.ok) return auth.response;",
  );

  // session = await readSession without prior token (checkout paypal)
  src = src.replace(
    /session = await readSession\(await getAuthStore\(\), sessionToken, process\.env\.AUTH_SESSION_SECRET\);/g,
    "const auth = await requireApiPermission(request);\n    if (!auth.ok) return auth.response;\n    const session = { user: auth.user };",
  );

  // auth/me leftover import cleanup - if still has readSession block
  src = src.replace(
    /const token = request\.headers\.get\("cookie"\)\?\.match\(new RegExp\(`\$\{COOKIE_NAME\}=([^;]+)`\)\)\?\.\[1\];\s*\n\s*const session = await readSession\(await getAuthStore\(\), token, process\.env\.AUTH_SESSION_SECRET\);\s*\n\s*return session \? NextResponse\.json\(\{ user: session\.user \}\) : NextResponse\.json\(\{ error: "Unauthenticated\." \}, \{ status: 401 \}\);/g,
    "const auth = await requireApiPermission(request);\n    if (!auth.ok) return auth.response;\n    return NextResponse.json({ user: auth.user });",
  );

  // sessionFor usage left over
  src = src.replace(
    /const session = await sessionFor\(request\);\s*\n\s*if \(!session\) return NextResponse\.json\(\{ error: "Unauthenticated\." \}, \{ status: 401 \}\);/g,
    "const auth = await requireApiPermission(request);\n    if (!auth.ok) return auth.response;",
  );

  src = src.replace(/session\.user/g, "auth.user");

  if (!src.includes("readSession")) {
    src = src.replace(/import \{[^}]*\} from "@\/lib\/auth-core\.mjs";\n/g, (line) => {
      if (/COOKIE_NAME|getAuthStore|readSession/.test(line)) return "";
      return line;
    });
  }

  if (src === original) return false;
  writeFileSync(path, src);
  return true;
}

let n = 0;
for (const path of walk(apiRoot)) {
  if (migrateFile(path)) {
    n += 1;
    console.log("+", relative(root, path));
  }
}
console.log(`Updated ${n} files`);
