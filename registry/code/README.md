# Code

Code-focused editors for React: plain text plus runnable CodeMirror editors for Python,
JavaScript, and TypeScript backed by Web Worker runtimes. Python runs on
Pyodide; JavaScript and TypeScript run in a sandboxed worker (TypeScript is
transpiled in-browser). This feature was incorporated from the standalone
`codecn` prototype.

## Organization

- `hooks/`: the `useCodeRuntime` React hook and its worker entry points.
  Workers sit beside the hook so relative URLs work locally and after installation.
- `ui/`: editor and output primitives plus the per-language editors.

Installed files preserve these folders under `hooks/code/` and
`ui/code/`. A complete playground demo lives outside the registry in
[`examples/code/`](../../examples/code/).

## Install

```sh
bunx shadcn@latest add EdwardAstill/edcn/use-code-runtime
bunx shadcn@latest add EdwardAstill/edcn/code-editor
```

`code-editor` pulls in `use-code-runtime` and the `input-group` shadcn
component automatically. It also adds `@uiw/react-codemirror`,
`@codemirror/lang-javascript`, `@codemirror/lang-python`, `pyodide`, and
`typescript` as dependencies.

## Run code from a component

`useCodeRuntime` lazily starts the right worker for the language and reports
its status. Runs are serialized; resetting terminates the worker.

```tsx
"use client"

import { RuntimeResetError, useCodeRuntime } from "@/hooks/code/use-code-runtime"

export function Runner() {
  const { run, reset, status } = useCodeRuntime()

  return (
    <button
      disabled={status === "loading" || status === "running"}
      onClick={async () => {
        try {
          const result = await run("print(sum(range(10)))", "python")
          console.log(result.output) // "45"
        } catch (error) {
          if (!(error instanceof RuntimeResetError)) throw error
        }
      }}
    >
      Run
    </button>
  )
}
```

`run(code, language)` resolves with `{ output, durationMs }` or rejects with
the runtime error text. `status` is `"idle" | "loading" | "running" | "ready"`;
`language` mirrors the last requested language, and `reset()` terminates the
worker so the next run starts fresh.

## Editors

The `code-editor` item ships `editor-primitives.tsx` (editor, output panel,
copy/enlarge/run buttons) and `language-editors.tsx` (`PythonEditor`,
`JavaScriptEditor`, `TypeScriptEditor`, `PlainTextEditor`, plus a
`languageEditors` record keyed by runnable language).

Editors contain code, optional output, and a bottom toolbar. File tabs and file
management belong to the surrounding application. Supply editor state and wrap
an editor in `InputGroup`; see `examples/code/code-demo.tsx` for a single Python
editor with run results, cursor position, and an enlarged overlay.

`PlainTextEditor` accepts `code`, `onChange`, `cursor`, `onCursorChange`,
`expanded`, `onToggleExpanded`, and `fileName` (used in accessible control labels).
It edits arbitrary text without syntax highlighting or a runtime, and keeps
Copy and Enlarge in the bottom toolbar. See `examples/code/plain-text-demo.tsx`.
Runnable editors show Run and enable Ctrl/Cmd+Enter only when `onRun` is supplied.

## Runtime notes

- Pyodide is loaded from the jsDelivr CDN on first Python run and packages
  imports on demand; stdout and stderr are captured into the output.
- TypeScript runs through the same JavaScript worker: the source is
  transpiled with the in-browser `typescript` compiler and syntax errors are
  reported as run errors (no type checking).
- Code never touches the main thread; `console.log` and the completion value
  are captured as output.
