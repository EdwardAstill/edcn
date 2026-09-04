# Bun + Base UI shadcn registry template

A template for running your own [shadcn registry](https://ui.shadcn.com/docs/registry) with [Bun](https://bun.com) and [Base UI](https://base-ui.com).

This repository is based on the official [shadcn registry template](https://github.com/shadcn-ui/registry-template). It is configured for the `base-nova` shadcn style and uses Base UI primitives instead of Radix UI. Unlike the official template, there is no web framework — the preview runs on Bun's built-in frontend dev server.

## Requirements

- Bun 1.4.0 or newer

Install Bun on macOS, Linux, or WSL:

```bash
curl -fsSL https://bun.com/install | bash
```

## Getting started

Create a repository with GitHub's **Use this template** button, then run:

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to preview the registry. The preview uses `Bun.serve` with hot reloading; Tailwind CSS is watched and recompiled alongside it.

## Build the registry

Edit `registry.json` and add source files under `registry`, then generate the installable JSON files:

```bash
bun run registry:build
```

The generated registry items are written to `public/r`. Commit them whenever their source changes.

## Add shadcn components

The `components.json` file selects Base UI through the `base-nova` style. Add components with Bun:

```bash
bunx --bun shadcn@latest add button
```

See the [shadcn registry documentation](https://ui.shadcn.com/docs/registry) and [Base UI component documentation](https://base-ui.com/react/components) for more details.

## Workspace system

The flagship registry item: an IDE-style workspace — tiled layouts, tab
stacks, floating windows, browser popouts, drag & drop docking, keyboard
commands, and persistence. Full documentation lives in
[`registry/blocks/workspace/README.md`](registry/blocks/workspace/README.md).

```tsx
import { Workspace } from "@/registry/blocks/workspace/workspace";
import { createInitialState } from "@/registry/lib/workspace/factory";

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
by an invariant fuzzer (`bun test scripts/reducer-fuzz.test.ts`). See the
demo in the preview ("Workspace Demo") for floats, popouts, drag docking,
and Save/Load persistence.

## Preview site

The preview at [http://localhost:3000](http://localhost:3000) shows every registry block automatically — when you add a component to the registry it appears in the preview without any manual editing, with its source code shown underneath.

This is powered by `scripts/generate-preview-index.ts`, which scans `registry.json` and writes `src/registry-preview.tsx`. It runs automatically on `bun run dev` and watches for changes; the generated file is committed so a fresh clone renders without a build step.

- Each block renders its first renderable component: the entry file, or — if that is an async server component — the next client component in the block's file list.
- Source panels show the block's own files plus the files of any local `registry:ui` dependencies (e.g. the floating window primitive under its demo).
- Blocks with only async server components get a placeholder; they need a React Server Components host.
- The preview stylesheet is compiled from `styles/globals.css` to `styles/build.css` with `@tailwindcss/cli`.
