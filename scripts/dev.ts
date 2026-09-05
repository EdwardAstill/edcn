#!/usr/bin/env bun
import { freePreviewPort } from "./free-preview-port";
// Concurrent preview: preview-index generator (watched) + Tailwind CSS
// watcher + Bun dev server with HMR.

await freePreviewPort(Number(process.env.PORT) || 3000);

// Generate preview/registry-preview.tsx before the server starts so the first
// bundle always has it.
const generated = Bun.spawnSync(["bun", "scripts/generate-preview-index.ts"], {
  stdout: "inherit",
  stderr: "inherit",
});
if (generated.exitCode !== 0) process.exit(generated.exitCode ?? 1);

const gen = Bun.spawn(["bun", "scripts/generate-preview-index.ts", "--watch"], {
  stdout: "inherit",
  stderr: "inherit",
});

const css = Bun.spawn(["bun", "run", "css:watch"], {
  stdout: "inherit",
  stderr: "inherit",
});

const server = Bun.spawn(["bun", "--hot", "preview/server.ts"], {
  stdout: "inherit",
  stderr: "inherit",
});

const shutdown = (exitCode = 0) => {
  gen.kill();
  css.kill();
  server.kill();
  process.exit(exitCode);
};

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());

shutdown(await Promise.race([gen.exited, css.exited, server.exited]));
