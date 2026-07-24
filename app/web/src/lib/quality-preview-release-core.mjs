import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const QUALITY_CHECK_IDS = Object.freeze([
  "lint",
  "test",
  "verify",
  "build",
  "cyberos_gates",
]);

export const PREPARE_OUTCOMES = Object.freeze({
  PREPARED_LOCAL: "prepared_local",
  REFUSED_PRODUCTION: "refused_production",
  REFUSED_UNAUTHORIZED_REMOTE: "refused_unauthorized_remote",
  PACKAGING_INVALID: "packaging_invalid",
});

const REQUIRED_PACKAGE_FILES = Object.freeze([
  "package.json",
  "Dockerfile",
  "captain-definition",
  "OPERATIONS.md",
  "next.config.ts",
]);

function defaultLog(event, fields = {}) {
  console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-022", ...fields }));
}

function readText(rootPath, relativePath) {
  return readFileSync(resolve(rootPath, relativePath), "utf8");
}

export function getQualityChecklist() {
  return {
    checks: [
      { id: "lint", command: "npm run lint", scope: "app/web" },
      { id: "test", command: "npm run test", scope: "app/web" },
      { id: "verify", command: "npm run verify", scope: "app/web" },
      { id: "build", command: "npm run build", scope: "app/web" },
      {
        id: "cyberos_gates",
        command: "bash .cyberos/cuo/gates/run-gates.sh",
        scope: "repo_root",
      },
    ],
  };
}

export function detectPreviewCredentials(env = process.env) {
  const token = typeof env.CAPROVER_APP_TOKEN === "string" ? env.CAPROVER_APP_TOKEN.trim() : "";
  const alt = typeof env.CAPTAIN_APP_TOKEN === "string" ? env.CAPTAIN_APP_TOKEN.trim() : "";
  if (token) return { present: true, source: "CAPROVER_APP_TOKEN" };
  if (alt) return { present: true, source: "CAPTAIN_APP_TOKEN" };
  return { present: false, source: null };
}

export function validatePreviewPackaging(rootPath) {
  const missing = REQUIRED_PACKAGE_FILES.filter((file) => !existsSync(resolve(rootPath, file)));
  if (missing.length > 0) {
    throw new Error(`Missing preview packaging files: ${missing.join(", ")}`);
  }

  const captainDefinition = JSON.parse(readText(rootPath, "captain-definition"));
  if (captainDefinition.schemaVersion !== 2) {
    throw new Error("CapRover schemaVersion 2 is required.");
  }
  if (captainDefinition.dockerfilePath !== "./Dockerfile") {
    throw new Error("captain-definition must point at ./Dockerfile.");
  }

  const dockerfile = readText(rootPath, "Dockerfile");
  if (!dockerfile.includes("FROM node:")) {
    throw new Error("Dockerfile must use a Node base image.");
  }
  if (!dockerfile.includes("npm run build")) {
    throw new Error("Dockerfile must run npm run build.");
  }

  const nextConfig = readText(rootPath, "next.config.ts");
  if (!nextConfig.includes('output: "standalone"')) {
    throw new Error("next.config.ts must enable standalone output.");
  }

  if (existsSync(resolve(rootPath, ".env"))) {
    throw new Error("A committed .env file is forbidden in the preview package.");
  }

  const operations = readText(rootPath, "OPERATIONS.md");
  for (const marker of [
    "npm run lint",
    "npm run test",
    "npm run verify",
    "npm run build",
    "run-gates.sh",
    "CapRover",
    "prepared_local",
    "Do not deploy",
  ]) {
    if (!operations.includes(marker)) {
      throw new Error(`OPERATIONS.md is missing quality/preview marker: ${marker}`);
    }
  }

  const packageJson = JSON.parse(readText(rootPath, "package.json"));
  if (!packageJson.scripts?.verify?.includes("verify-quality-preview-release-core.mjs")) {
    throw new Error("package.json verify must include quality-preview-release verification.");
  }
  if (!packageJson.scripts?.["prepare:preview"]?.includes("prepare-preview-release.mjs")) {
    throw new Error("package.json must expose prepare:preview.");
  }

  return {
    schemaVersion: captainDefinition.schemaVersion,
    dockerfilePath: captainDefinition.dockerfilePath,
    standalone: true,
  };
}

export function assertNoNetworkDeployInSource(sourceText) {
  if (typeof sourceText !== "string") {
    throw new Error("Source text is required.");
  }
  const join = (...parts) => parts.join("");
  const forbidden = [
    join("fet", "ch("),
    join("axi", "os."),
    join("http", ".request"),
    join("https", ".request"),
    join("captain", ".server.", "sachviet"),
    join("deploy", ".sh"),
    join("CAPROVER", "_URL"),
  ];
  for (const token of forbidden) {
    if (sourceText.includes(token)) {
      throw new Error("Quality/preview release default path must not perform network deploy calls.");
    }
  }
  return true;
}

export function preparePreviewRelease(options = {}) {
  const {
    rootPath,
    target = "preview",
    credentials = detectPreviewCredentials(),
    authorizeRemote = false,
    log = defaultLog,
  } = options;

  if (!rootPath) {
    throw new Error("rootPath is required.");
  }

  log("preview_release_prepare_started", { target, credentials_present: Boolean(credentials?.present) });

  if (target === "production") {
    const outcome = {
      outcome: PREPARE_OUTCOMES.REFUSED_PRODUCTION,
      target,
      credentials_present: Boolean(credentials?.present),
      deployed: false,
    };
    log("preview_release_prepare_completed", outcome);
    return outcome;
  }

  if (target !== "preview") {
    throw new Error(`Unsupported prepare target: ${target}`);
  }

  if (authorizeRemote === true) {
    const outcome = {
      outcome: PREPARE_OUTCOMES.REFUSED_UNAUTHORIZED_REMOTE,
      target,
      credentials_present: Boolean(credentials?.present),
      deployed: false,
      reason: "remote_publish_requires_explicit_operator_instruction",
    };
    log("preview_release_prepare_completed", outcome);
    return outcome;
  }

  try {
    const packaging = validatePreviewPackaging(rootPath);
    const outcome = {
      outcome: PREPARE_OUTCOMES.PREPARED_LOCAL,
      target,
      credentials_present: Boolean(credentials?.present),
      credential_source: credentials?.present ? credentials.source : null,
      deployed: false,
      packaging,
      quality_checklist: getQualityChecklist(),
    };
    log("preview_release_prepare_completed", {
      outcome: outcome.outcome,
      target,
      credentials_present: outcome.credentials_present,
      deployed: false,
    });
    return outcome;
  } catch (error) {
    const outcome = {
      outcome: PREPARE_OUTCOMES.PACKAGING_INVALID,
      target,
      credentials_present: Boolean(credentials?.present),
      deployed: false,
      error_class: error.constructor.name,
      message: error.message,
    };
    log("preview_release_prepare_failed", {
      outcome: outcome.outcome,
      error_class: outcome.error_class,
    });
    return outcome;
  }
}
