# edcn

A single shadcn registry for independent components and feature kits. Workspace,
quiz, plot, code, and calculator share a catalog and preview site, but keep their own source,
state, and registry dependencies.

## Organization

```text
registry.json                    # catalog: feature includes
components/ui/                   # shared base-nova shadcn components (preview only)
lib/utils.ts                     # shared class-name helper
preview/                         # preview app, HTML, server, and styles
examples/
  workspace/                     # workspace examples rendered by the preview
  quiz/                          # quiz examples
  plot/                          # plot examples
  code/                          # code playground examples
  calculator/                    # scientific calculator example
registry/
  workspace/
    registry.json                # workspace items and dependency graph
    lib/                         # framework-independent state and model
    hooks/                       # React bindings and workspace interactions
    ui/                          # tabs, stacks, layouts, floating windows, and docking UI
    components/                  # assembled <Workspace> block
  quiz/
    registry.json                # standalone quiz
    components/                  # quiz screens
    ui/                          # questionnaire controls and visual primitives
    lib/                         # model, grading, session state, and validation
    styles/                      # quiz stylesheet
  plot/
    registry.json                # plot primitives and function plot
    ui/                          # dependency-free SVG plotting primitives
  code/
    registry.json                # runnable code playground
    hooks/                       # useCodeRuntime hook and colocated workers
    ui/                          # CodeMirror editor and output primitives
```

The `registry/calculator/` area contains the scientific calculator UI, parser,
and Pyodide/SymPy solver. See the [calculator guide](registry/calculator/README.md).

Registry manifests describe installable source only. Demos and usage examples
live in `examples/`, one folder per area, and the preview site is generated
from them — see “Preview site” below.

Each feature manifest uses paths relative to its own directory. Add future
independent features as another folder and root `include`; dependencies are
opt-in per item. Keep install destinations explicit when organizing multi-file
features so source-folder changes do not flatten installed files.

## Install from GitHub

Once these changes are pushed to the repository's default branch:

```bash
bunx shadcn@latest add EdwardAstill/edcn/quiz
bunx shadcn@latest add EdwardAstill/edcn/workspace
bunx shadcn@latest add EdwardAstill/edcn/plot
bunx shadcn@latest add EdwardAstill/edcn/code-editor
bunx shadcn@latest add EdwardAstill/edcn/calculator
```

These are separate installs. Quiz does not pull in workspace or tabs. See the
[quiz guide](registry/quiz/README.md) for its API and required stylesheet import,
the [workspace guide](registry/workspace/README.md) for workspace usage, the
[plot guide](registry/plot/README.md) for plotting primitives, and the
[code guide](registry/code/README.md) for the runnable playground and its
worker runtimes.

GitHub reads the root registry and included source manifests directly; generated
JSON is only needed for the local HTTP registry or static hosting. See the
[shadcn GitHub registry guide](https://ui.shadcn.com/docs/registry/github).

## Requirements

- Bun 1.4.0 or newer

Install Bun on macOS, Linux, or WSL:

```bash
curl -fsSL https://bun.com/install | bash
```

## Getting started

From this repository, run:

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to preview the registry. The preview uses `Bun.serve` with hot reloading; Tailwind CSS is watched and recompiled alongside it.

`bun run dev` takes over port 3000 (or `PORT` when set), stopping existing TCP
listeners before starting. It uses `lsof` and force-stops listeners that do not
exit within two seconds. If a preview process exits, the other preview processes
are stopped too.

## Build the registry

Edit the relevant feature manifest (or the root manifest for shared items), then validate and generate the installable JSON files:

```bash
bun run registry:build
```

The generated registry items are written to `public/r`. Commit them whenever their source changes.

Run the checks with:

```bash
bun run check
```

## Add shadcn components

The `components.json` file selects Base UI through the `base-nova` style and
installs shared basics into `components/ui`. Feature items declare the shadcn
basics they use in `registryDependencies`. Add components with Bun:

```bash
bunx --bun shadcn@latest add button
```

### Shared basics are always external dependencies

This is a deliberate convention, not an accident. Items never ship their own
copies of shared shadcn basics (`button`, `tabs`, `input-group`, …). Instead,
they reference them by name in `registryDependencies` — e.g. `code-editor`
depends on `input-group` — so consumers install the official shadcn source
into their own `components/ui` and keep one themed copy per project. Local
files in `components/ui/` exist only so this repository's preview site renders;
they are not part of any registry item and must not be listed in item `files`.

See the [shadcn registry documentation](https://ui.shadcn.com/docs/registry) and [Base UI component documentation](https://base-ui.com/react/components) for more details.

## Workspace system

An independent feature kit: an IDE-style workspace — tiled layouts, tab
stacks, floating windows, browser popouts, drag & drop docking, keyboard
commands, and persistence. Full documentation lives in
[`registry/workspace/README.md`](registry/workspace/README.md).

```tsx
import { Workspace } from "@/components/workspace/workspace";
import { createInitialState } from "@/lib/workspace/factory";

<Workspace
  views={{ editor: EditorView, clock: ClockView }}
  initialState={createInitialState({
    direction: "horizontal",
    first: { views: [{ type: "editor", title: "Editor" }] },
    second: { views: [{ type: "clock", title: "Clock" }] },
  })}
/>
```

The state core is plain serializable TypeScript with a pure reducer, guarded
by an invariant fuzzer (`bun test tests/workspace/reducer-fuzz.test.ts`). See the
Workspace example in the preview for floats, popouts, drag docking, and
Save/Load persistence.

## Examples folder

`examples/` holds every demo shown on the preview site, in one folder per
area (`examples/workspace/`, `examples/quiz/`, `examples/plot/`,
`examples/code/`, `examples/calculator/`). The registry does not ship demos; examples import registry
source through the `@/registry/<area>/...` alias and are never installed by
the shadcn CLI. Drop a new `.tsx` file into an area folder and it appears on
the site automatically.

Each example exports a no-props React component named after its file
(`quiz-demo.tsx` exports `QuizDemo`), plus an optional
`export const description = "…"` that the preview shows next to the title.

## Preview site

The preview at [http://localhost:3000](http://localhost:3000) groups examples
under **Workspace**, **Quiz**, **Plot**, **Code**, and **Calculator** tabs — one tab per
folder in `examples/`. Adding, renaming, or editing files there updates the
site without any manual registration.

This is powered by `scripts/generate-preview-index.ts`, which scans the
`examples/` folders and writes `preview/registry-preview.tsx`. It runs
automatically on `bun run dev` and watches for changes; the generated file is
ignored by Git and regenerated before development and typechecking. Any future
production build must run `bun run preview:gen` before bundling.

- Each example renders its default export or its PascalCase named export, with
  its full source shown underneath.
- Files without a matching export are skipped with a note from the generator.
- The preview stylesheet is compiled from `preview/styles/globals.css` to
  `preview/styles/build.css` with `@tailwindcss/cli`.
- `preview/worker-plugin.ts` adapts code-worker URLs for Bun's HTML bundler;
  `preview/server.ts` bundles and serves those workers under `/workers/`.
  This adapter applies only to the preview; installed hooks use relative URLs.

## Data table

The [table kit](registry/table/README.md) provides a sticky first column,
double-click sorting, draggable column widths, Ctrl-drag resizing of all columns,
and optional pagination. Install it with
`bunx shadcn@latest add EdwardAstill/edcn/data-table`. The runnable example lives
in `examples/table/` and appears under the Table preview tab.
