import { useCallback, useEffect, useRef, useState } from "react";

export type Language = "python" | "javascript" | "typescript";

type Runtime = "python" | "javascript";
type RunResult = { output: string; durationMs: number };
type WorkerResult = RunResult & { id: number; error?: string };
type PendingRun = {
  id: number;
  resolve: (result: RunResult) => void;
  reject: (error: Error) => void;
};

export class RuntimeResetError extends Error {}

function getRuntime(language: Language): Runtime {
  return language === "python" ? "python" : "javascript";
}

function createWorker(runtime: Runtime) {
  if (runtime === "python") {
    return new Worker(
      new URL("./python-runtime.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
  }

  return new Worker(
    new URL("./javascript-runtime.worker.ts", import.meta.url),
    { type: "module" },
  );
}

export function useCodeRuntime() {
  const workerRef = useRef<Worker | null>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const pendingRef = useRef<PendingRun | null>(null);
  const nextId = useRef(1);
  const [language, setLanguage] = useState<Language | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "running" | "ready"
  >("idle");

  const stop = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    runtimeRef.current = null;
    pendingRef.current?.reject(new RuntimeResetError("Runtime reset"));
    pendingRef.current = null;
    setLanguage(null);
    setStatus("idle");
  }, []);

  const run = useCallback((code: string, nextLanguage: Language) => {
    const nextRuntime = getRuntime(nextLanguage);
    const isStarting = runtimeRef.current !== nextRuntime;

    if (isStarting) {
      workerRef.current?.terminate();
      workerRef.current = createWorker(nextRuntime);
      runtimeRef.current = nextRuntime;
    }

    const worker = workerRef.current!;
    setLanguage(nextLanguage);
    setStatus(isStarting ? "loading" : "running");

    return new Promise<RunResult>((resolve, reject) => {
      const id = nextId.current++;
      pendingRef.current = { id, resolve, reject };
      worker.onmessage = (event: MessageEvent<WorkerResult>) => {
        if (event.data.id !== pendingRef.current?.id) return;
        pendingRef.current = null;
        setStatus("ready");
        if (event.data.error) reject(new Error(event.data.error));
        else resolve(event.data);
      };
      worker.onerror = () => {
        workerRef.current = null;
        runtimeRef.current = null;
        pendingRef.current = null;
        setLanguage(null);
        setStatus("idle");
        reject(new Error("The code runtime could not be loaded."));
      };
      worker.postMessage({ id, code, language: nextLanguage });
    });
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { language, run, reset: stop, status };
}
