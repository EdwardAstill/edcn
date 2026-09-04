#!/usr/bin/env bun
export {};
// Concurrent preview: Tailwind CSS watcher + Bun dev server with HMR.

const css = Bun.spawn(["bun", "run", "css:watch"], {
  stdout: "inherit",
  stderr: "inherit",
});

const server = Bun.spawn(["bun", "--hot", "server.ts"], {
  stdout: "inherit",
  stderr: "inherit",
});

const shutdown = () => {
  css.kill();
  server.kill();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await Promise.all([css.exited, server.exited]);
