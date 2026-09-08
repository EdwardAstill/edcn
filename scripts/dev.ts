#!/usr/bin/env bun
import { spawn, type ChildProcess } from "node:child_process";
import { freePreviewPort } from "./free-preview-port";

const children: ChildProcess[] = [];
const exits: Promise<number>[] = [];
let stopping = false;

async function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  const timeout = setTimeout(() => {
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
  }, 2000);
  await Promise.all(exits);
  clearTimeout(timeout);
  process.exit(exitCode);
}

process.on("SIGINT", () => { void shutdown(); });
process.on("SIGTERM", () => { void shutdown(); });

function start(args: string[]) {
  const child = spawn(process.execPath, args, {
    stdio: "inherit",
    // The launcher handles terminal signals and reaps each tool itself.
    detached: process.platform !== "win32",
  });
  children.push(child);
  const exited = new Promise<number>((resolve) => {
    child.once("error", (error) => {
      console.error(`[dev] ${error.message}`);
      resolve(1);
    });
    child.once("exit", (code) => resolve(code ?? 1));
  });
  exits.push(exited);
  return exited;
}

try {
  await freePreviewPort(Number(process.env.PORT) || 3000);
  // Generate the index before starting the server; this process is also reaped
  // if Ctrl+C arrives during startup.
  const generated = await start(["scripts/generate-preview-index.ts"]);
  if (generated !== 0) await shutdown(generated);
  if (!stopping) {
    const gen = start(["scripts/generate-preview-index.ts", "--watch"]);
    const css = start([
      "node_modules/@tailwindcss/cli/dist/index.mjs",
      "-i", "preview/styles/globals.css", "-o", "preview/styles/build.css", "--watch=always",
    ]);
    const server = start(["--hot", "preview/server.ts"]);
    await shutdown(await Promise.race([gen, css, server]));
  }
} catch (error) {
  console.error(error);
  await shutdown(1);
}
