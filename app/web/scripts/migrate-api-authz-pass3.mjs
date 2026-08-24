/**
 * Third pass: remove leftover readSession/sessionFor and fix broken auth.user references.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const apiRoot = join(root, "src/app/api");

const AUTH_BLOCK = "const auth = await requireApiPermission(request);\n    if (!auth.ok) return auth.response;";

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (name === "route.ts") files.push(path);
  }
  return files;
}

function cleanImports(src) {
  if (src.includes("readSession") || src.includes("getAuthStore") || src.includes("COOKIE_NAME")) return src;
  return src.replace(/import \{[^}]*\} from "@\/lib\/auth-core\.mjs";\n/g, (line) => {
    if (/COOKIE_NAME|getAuthStore|readSession/.test(line)) return "";
    return line;
  });
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

  // Remove sessionFor helpers (multiline)
  src = src.replace(
    /async function sessionFor\(request: Request\) \{[\s\S]*?^\}\s*\n/gm,
    "",
  );

  // sessionFor + jsonError unauth
  src = src.replace(
    /const session = await sessionFor\(request\);\s*\n\s*if \(!session\) return jsonError\(API_ERROR_CODES\.unauthenticated, "Unauthenticated\.", \{ status: 401, requestId \}\);/g,
    AUTH_BLOCK,
  );

  // token + readSession + NextResponse unauth (single line readSession)
  src = src.replace(
    /const token = request\.headers\.get\("cookie"\)\?\.match\(new RegExp\(`\$\{COOKIE_NAME\}=([^;]+)`\)\)\?\.\[1\];\s*\n\s*const session = await readSession\(await getAuthStore\(\), token, process\.env\.AUTH_SESSION_SECRET\);\s*\n\s*if \(!session\) return NextResponse\.json\(\{ error: "Unauthenticated\." \}, \{ status: 401 \}\);/g,
    AUTH_BLOCK,
  );

  // token + readSession + jsonError unauth
  src = src.replace(
    /const token = request\.headers\.get\("cookie"\)\?\.match\(new RegExp\(`\$\{COOKIE_NAME\}=([^;]+)`\)\)\?\.\[1\];\s*\n\s*const session = await readSession\(await getAuthStore\(\), token, process\.env\.AUTH_SESSION_SECRET\);\s*\n\s*if \(!session\) return jsonError\(API_ERROR_CODES\.unauthenticated, "Unauthenticated\.", \{ status: 401, requestId \}\);/g,
    AUTH_BLOCK,
  );

  // const session = await readSession( multiline args ) + if (!session) jsonError
  src = src.replace(
    /const session = await readSession\(\s*await getAuthStore\(\),\s*[^,]+,\s*process\.env\.AUTH_SESSION_SECRET,\s*\);\s*\n\s*if \(!session\) return jsonError\(API_ERROR_CODES\.unauthenticated, "Unauthenticated\.", \{ status: 401, requestId \}\);/g,
    AUTH_BLOCK,
  );

  // auth/me pattern
  src = src.replace(
    /const token = request\.headers\.get\("cookie"\)\?\.match\(new RegExp\(`\$\{COOKIE_NAME\}=([^;]+)`\)\)\?\.\[1\];\s*\n\s*const session = await readSession\(await getAuthStore\(\), token, process\.env\.AUTH_SESSION_SECRET\);\s*\n\s*return session \? NextResponse\.json\(\{ user: session\.user \}\) : NextResponse\.json\(\{ error: "Unauthenticated\." \}, \{ status: 401 \}\);/g,
    `${AUTH_BLOCK}\n    return NextResponse.json({ user: auth.user });`,
  );

  src = src.replace(/session\.user/g, "auth.user");
  src = cleanImports(src);

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
console.log("Remaining readSession:", walk(apiRoot).filter((p) => readFileSync(p, "utf8").includes("readSession")).length);
