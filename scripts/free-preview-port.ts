export async function freePreviewPort(port: number): Promise<void> {
  const result = Bun.spawnSync(
    ["lsof", "-nP", "-t", `-iTCP:${port}`, "-sTCP:LISTEN"],
    { stdout: "pipe", stderr: "pipe" },
  );
  if (result.exitCode !== 0 && result.exitCode !== 1) {
    throw new Error(`Could not inspect port ${port}: ${result.stderr.toString()}`);
  }
  const pids = [...new Set(result.stdout.toString().trim().split(/\s+/))]
    .filter(Boolean).map(Number);
  for (const pid of pids) {
    if (!Number.isInteger(pid) || pid <= 1 || pid === process.pid) {
      throw new Error(`Cannot stop listener PID ${pid} on port ${port}`);
    }
    console.log(`[dev] Stopping PID ${pid} to free port ${port}`);
    signal(pid, "SIGTERM");
  }
  const deadline = Date.now() + 2000;
  while (pids.some(isRunning) && Date.now() < deadline) {
    await Bun.sleep(50);
  }
  for (const pid of pids.filter(isRunning)) signal(pid, "SIGKILL");
  const killDeadline = Date.now() + 2000;
  while (pids.some(isRunning) && Date.now() < killDeadline) {
    await Bun.sleep(50);
  }
  if (pids.some(isRunning)) throw new Error(`Could not free port ${port}`);
}

function signal(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(pid, signal);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
  }
}

function isRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ESRCH") return false;
    throw error;
  }
}
