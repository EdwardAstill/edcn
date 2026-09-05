import { expect, test } from "bun:test";
import { freePreviewPort } from "../../scripts/free-preview-port";

for (const stubborn of [false, true]) {
  test(`takes over a port from a ${stubborn ? "SIGTERM-resistant" : "normal"} listener`, async () => {
    const child = Bun.spawn([process.execPath, "-e", `
      ${stubborn ? 'process.on("SIGTERM", () => {});' : ''}
      const server = Bun.serve({ port: 0, fetch: () => new Response("old") });
      console.log(server.port);
    `], { stdout: "pipe", stderr: "inherit" });
    const reader = child.stdout.getReader();
    let replacement: ReturnType<typeof Bun.serve> | undefined;
    try {
      const { value } = await reader.read();
      const port = Number(new TextDecoder().decode(value).trim());
      expect(port).toBeGreaterThan(0);
      await freePreviewPort(port);
      await child.exited;
      replacement = Bun.serve({ port, fetch: () => new Response("new") });
      expect(await (await fetch(`http://localhost:${port}`)).text()).toBe("new");
      replacement.stop(true);
      replacement = undefined;
      await freePreviewPort(port);
    } finally {
      reader.releaseLock();
      replacement?.stop(true);
      child.kill();
      await child.exited;
    }
  });
}
