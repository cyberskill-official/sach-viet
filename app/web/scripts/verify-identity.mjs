import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const requiredFiles = [
  "src/lib/auth-core.mjs",
  "src/lib/access.mjs",
  "src/app/api/auth/login/route.ts",
  "src/app/api/auth/logout/route.ts",
  "src/app/api/auth/me/route.ts",
  "src/app/login/page.tsx",
  "src/proxy.ts",
];

function emit(event, fields = {}) {
  console.log(JSON.stringify({ event, task_id: "TASK-REBUILD-002", ...fields }));
}

export function validateIdentity(rootPath) {
  const missing = requiredFiles.filter((file) => !existsSync(resolve(rootPath, file)));
  if (missing.length > 0) throw new Error(`Missing identity files: ${missing.join(", ")}`);
  const authCore = readFileSync(resolve(rootPath, "src/lib/auth-core.mjs"), "utf8");
  const operations = readFileSync(resolve(rootPath, "OPERATIONS.md"), "utf8");
  if (!authCore.includes("HttpOnly") || !authCore.includes("SameSite=Lax")) throw new Error("Identity cookies must be httpOnly and same-site.");
  if (!authCore.includes("login_attempts") || !authCore.includes("AUTH_SESSION_SECRET")) throw new Error("Identity store must include throttling and session-secret handling.");
  if (!operations.includes("DATABASE_URL")) throw new Error("Postgres DATABASE_URL guidance is missing.");
  if (!operations.includes("BOOTSTRAP_ADMIN_PASSWORD_HASH")) throw new Error("Bootstrap secret guidance is missing.");
  if (/BOOTSTRAP_ADMIN_PASSWORD_HASH\s*=\s*[^`\s]/.test(operations)) throw new Error("Bootstrap password hash value must not be documented.");
  return { requiredFileCount: requiredFiles.length };
}

export function runIdentityVerification(rootPath) {
  emit("identity_verification_started", { check_count: 6 });
  try {
    const result = validateIdentity(rootPath);
    emit("identity_verification_completed", { required_file_count: result.requiredFileCount });
    return result;
  } catch (error) {
    emit("identity_verification_failed", { check_id: "identity_static_checks", error_class: error.constructor.name });
    throw error;
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  runIdentityVerification(resolve(fileURLToPath(new URL("..", import.meta.url))));
}
