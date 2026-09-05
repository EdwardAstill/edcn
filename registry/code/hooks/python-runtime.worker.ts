import { loadPyodide, version } from "pyodide";

const runtime = loadPyodide({
  indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/`,
});

self.onmessage = async (event: MessageEvent<{ id: number; code: string }>) => {
  const startedAt = performance.now();
  const output: string[] = [];

  try {
    const pyodide = await runtime;
    await pyodide.loadPackagesFromImports(event.data.code);
    pyodide.setStdout({ batched: (text) => output.push(text) });
    pyodide.setStderr({ batched: (text) => output.push(text) });

    const value = await pyodide.runPythonAsync(event.data.code);
    if (value != null) output.push(value.toString());
    value?.destroy?.();

    self.postMessage({
      id: event.data.id,
      output: output.join("\n"),
      durationMs: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    self.postMessage({
      id: event.data.id,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
};
