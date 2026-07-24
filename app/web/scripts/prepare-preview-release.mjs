import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { preparePreviewRelease } from "../src/lib/quality-preview-release-core.mjs";

function parseArgs(argv) {
  const options = { target: "preview", authorizeRemote: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--target") {
      options.target = argv[index + 1] || "preview";
      index += 1;
      continue;
    }
    if (arg === "--authorize-remote") {
      options.authorizeRemote = true;
    }
  }
  return options;
}

export function runPreparePreviewRelease(argv = process.argv.slice(2), env = process.env) {
  const options = parseArgs(argv);
  const rootPath = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const result = preparePreviewRelease({
    rootPath,
    target: options.target,
    authorizeRemote: options.authorizeRemote,
    credentials: {
      present: Boolean(
        (typeof env.CAPROVER_APP_TOKEN === "string" && env.CAPROVER_APP_TOKEN.trim()) ||
          (typeof env.CAPTAIN_APP_TOKEN === "string" && env.CAPTAIN_APP_TOKEN.trim()),
      ),
      source:
        typeof env.CAPROVER_APP_TOKEN === "string" && env.CAPROVER_APP_TOKEN.trim()
          ? "CAPROVER_APP_TOKEN"
          : typeof env.CAPTAIN_APP_TOKEN === "string" && env.CAPTAIN_APP_TOKEN.trim()
            ? "CAPTAIN_APP_TOKEN"
            : null,
    },
  });

  if (
    result.outcome === "packaging_invalid" ||
    result.outcome === "refused_production" ||
    result.outcome === "refused_unauthorized_remote"
  ) {
    process.exitCode = 1;
  }

  console.log(JSON.stringify({ event: "prepare_preview_release_result", task_id: "TASK-REBUILD-022", ...result }));
  return result;
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  runPreparePreviewRelease();
}
