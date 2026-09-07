import { useState } from "react";

import { InputGroup } from "@/components/ui/input-group";
import type { EditorResult } from "@/registry/code/ui/editor-primitives";
import { PythonEditor } from "@/registry/code/ui/language-editors";
import {
  RuntimeResetError,
  useCodeRuntime,
} from "@/registry/code/hooks/use-code-runtime";

export const description =
  "A Python editor with live output and copy, enlarge, and run controls.";

export function CodeDemo() {
  const [code, setCode] = useState(`from datetime import datetime

name = "Perth"
print(f"Hello, {name}!")
print(datetime.now().strftime("%A, %d %B"))`);
  const [result, setResult] = useState<EditorResult>();
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [expanded, setExpanded] = useState(false);
  const { run, status } = useCodeRuntime();
  const busy = status === "loading" || status === "running";
  const runtimeLabel =
    status === "loading"
      ? "Loading Python…"
      : status === "running"
        ? "Running Python…"
        : status === "ready"
          ? "Python ready"
          : "Python";

  const runCode = async () => {
    setResult({ state: "running", text: "" });
    try {
      const next = await run(code, "python");
      setResult({
        state: "success",
        text: next.output || "Completed without output.",
        durationMs: next.durationMs,
      });
    } catch (error) {
      if (error instanceof RuntimeResetError) return;
      setResult({
        state: "error",
        text: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <main className="flex min-h-svh justify-center bg-background px-4 py-10 text-foreground sm:py-16">
      {expanded ? (
        <button
          aria-label="Collapse editor"
          className="fixed inset-0 z-40 cursor-default bg-background/80 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
          type="button"
        />
      ) : null}
      <div
        className="w-full max-w-3xl"
        style={
          expanded
            ? {
                inset: "1rem",
                maxWidth: "none",
                position: "fixed",
                width: "auto",
                zIndex: 50,
              }
            : undefined
        }
      >
        <InputGroup className={expanded ? "h-full" : undefined}>
          <PythonEditor
            busy={busy}
            code={code}
            cursor={cursor}
            expanded={expanded}
            fileName="code"
            onChange={setCode}
            onCursorChange={setCursor}
            onRun={() => void runCode()}
            onToggleExpanded={() => setExpanded((current) => !current)}
            result={result}
            runtimeLabel={runtimeLabel}
          />
        </InputGroup>
      </div>
    </main>
  );
}
