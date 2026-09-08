import { expect, test } from "bun:test";
import { spawn } from "node:child_process";

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  test(`dev handles ${signal} without leaving watchers or a server behind`, async () => {
    const reservation = Bun.serve({ port: 0, fetch: () => new Response() });
    const port = reservation.port!;
    reservation.stop(true);
    const child = spawn(process.execPath, ["scripts/dev.ts"], {
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    const exited = new Promise<number | null>((resolve) => child.once("exit", resolve));
    let pids: number[] = [];
    try {
      const deadline = Date.now() + 10000;
      while (!(output.includes("Registry preview running") && output.includes("watching examples/") && output.includes("Done in")) && Date.now() < deadline && child.exitCode === null) await Bun.sleep(20);
      expect(output).toContain(`Registry preview running at http://localhost:${port}`);
      expect(output).toContain("watching examples/");
      expect(output).toContain("Done in");
      const processes = Bun.spawnSync(["ps", "-o", "pid=", "--ppid", String(child.pid)]);
      pids = processes.stdout.toString().trim().split(/\s+/).filter(Boolean).map(Number);
      expect(pids.length).toBe(3);
      child.kill(signal);
      expect(await exited).toBe(0);
      for (const pid of pids) expect(() => process.kill(pid, 0)).toThrow();
      expect(output).not.toContain("error:");
      const replacement = Bun.serve({ port, fetch: () => new Response() });
      replacement.stop(true);
    } finally {
      child.kill("SIGKILL");
      for (const pid of pids) {
        try { process.kill(pid, "SIGKILL"); } catch { /* Already reaped. */ }
      }
      await exited;
    }
  }, 15000);
}
