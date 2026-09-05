type Language = "javascript" | "typescript";

type RunRequest = {
  id: number;
  code: string;
  language: Language;
};

function formatValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "function") return value.toString();

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  const startedAt = performance.now();
  const output: string[] = [];
  const write = (...values: unknown[]) => {
    output.push(values.map(formatValue).join(" "));
  };

  try {
    let source = event.data.code;

    if (event.data.language === "typescript") {
      const ts = await import("typescript");
      const result = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.None,
          target: ts.ScriptTarget.ES2022,
        },
        reportDiagnostics: true,
      });
      const errors = result.diagnostics?.filter(
        (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
      );

      if (errors?.length) {
        throw new Error(
          errors
            .map((diagnostic) =>
              ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
            )
            .join("\n"),
        );
      }

      source = result.outputText;
    }

    const AsyncFunction = Object.getPrototypeOf(async () => undefined)
      .constructor as new (
      ...args: string[]
    ) => (...values: unknown[]) => Promise<unknown>;
    const execute = new AsyncFunction("console", `"use strict";\n${source}`);
    const value = await execute({
      debug: write,
      error: write,
      info: write,
      log: write,
      table: write,
      warn: write,
    });

    if (value !== undefined) output.push(formatValue(value));

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
