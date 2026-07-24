import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const requiredFiles = [
  "package.json",
  "next.config.ts",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "Dockerfile",
  "captain-definition",
  "OPERATIONS.md",
];

function readText(rootPath, relativePath) {
  return readFileSync(resolve(rootPath, relativePath), "utf8");
}

function emit(event, fields = {}) {
  console.log(JSON.stringify({ event, task_id: "TASK-REBUILD-001", ...fields }));
}

export function validateFoundation(rootPath) {
  const missingFiles = requiredFiles.filter((relativePath) => !existsSync(resolve(rootPath, relativePath)));
  if (missingFiles.length > 0) {
    throw new Error(`Missing foundation files: ${missingFiles.join(", ")}`);
  }

  const packageJson = JSON.parse(readText(rootPath, "package.json"));
  const nextConfig = readText(rootPath, "next.config.ts");
  const page = readText(rootPath, "src/app/page.tsx");
  const captainDefinition = JSON.parse(readText(rootPath, "captain-definition"));

  if (packageJson.name !== "sachviet-web") {
    throw new Error("Package name must be sachviet-web.");
  }
  if (!packageJson.dependencies.next.startsWith("16.")) {
    throw new Error("Next.js 16 is required for the foundation.");
  }
  if (!packageJson.scripts.verify?.includes("node scripts/verify-foundation.mjs")) {
    throw new Error("The verification command is missing.");
  }
  if (!nextConfig.includes('output: "standalone"')) {
    throw new Error("The standalone server output is missing.");
  }
  if (!page.includes("Greenfield Next.js foundation")) {
    throw new Error("The foundation page is missing its expected marker.");
  }
  if (captainDefinition.schemaVersion !== 2) {
    throw new Error("CapRover schema version 2 is required.");
  }
  if (existsSync(resolve(rootPath, "../api"))) {
    throw new Error("A separate API package is outside this Next.js foundation.");
  }
  if (existsSync(resolve(rootPath, ".env"))) {
    throw new Error("A local environment file must not be part of the foundation.");
  }

  return { name: packageJson.name, nextVersion: packageJson.dependencies.next };
}

export function runFoundationVerification(rootPath) {
  emit("foundation_verification_started", { check_count: 9 });

  try {
    const result = validateFoundation(rootPath);
    emit("foundation_verification_completed", { application: result.name, next_version: result.nextVersion });
    return result;
  } catch (error) {
    emit("foundation_verification_failed", { check_id: "foundation_static_checks", error_class: error.constructor.name });
    throw error;
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  const rootPath = resolve(fileURLToPath(new URL("..", import.meta.url)));
  runFoundationVerification(rootPath);
}
