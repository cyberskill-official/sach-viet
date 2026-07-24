import { createInterface } from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { hashPassword } from "../src/lib/auth-core.mjs";

async function readPasswordFromStdin() {
  if (input.isTTY) {
    return new Promise((resolvePromise, reject) => {
      const rl = createInterface({ input, output, terminal: false });
      let line = "";
      rl.on("line", (value) => {
        line = value;
        rl.close();
      });
      rl.on("close", () => resolvePromise(line));
      rl.on("error", reject);
    });
  }

  const chunks = [];
  for await (const chunk of input) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
}

export async function runHashPassword(argv = process.argv.slice(2)) {
  const fromArgv = typeof argv[0] === "string" ? argv[0] : "";
  const password = fromArgv || (await readPasswordFromStdin());
  if (!password) {
    console.error("Usage: npm run hash-password -- <password>");
    console.error("   or: printf '%s' '<password>' | npm run hash-password");
    process.exitCode = 1;
    return null;
  }

  const hash = hashPassword(password);
  console.log(hash);
  return hash;
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  await runHashPassword();
}
