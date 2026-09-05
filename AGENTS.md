# AGENTS.md

Guidance for coding agents working in this repository.

## Project shape

edcn is a single shadcn registry hosting independent feature kits under
`registry/<area>/` (currently `workspace`, `quiz`, `plot`, `code`). Each area
owns its own `registry.json`, `README.md`, source folders (`lib/`, `hooks/`,
`ui/`, `components/`, `styles/`), and optional tests under `tests/<area>/`.
The root `registry.json` only lists area manifests in `include`. Demos and
usage examples live under `examples/<area>/` and power the preview site. See
the root `README.md` for the full layout and commands.

## Convention: examples drive the preview site

The preview site is generated exclusively from the `examples/` folders, never
from registry manifests:

- Every `examples/<area>/<name>.tsx` becomes one preview entry, grouped under
  the area's tab. Dropping a file in is enough — no manifest or site edit.
- Each example must export a no-props React component named after its file
  (`quiz-demo.tsx` exports `QuizDemo`) or a default export, plus an optional
  `export const description = "…"` for the site.
- Examples import registry source through `@/registry/<area>/...` and shared
  basics through `@/components/ui/...`; they are never listed in registry
  manifests and never installed by the shadcn CLI.
- Registry items ship installable source only. Do not add `*-demo` items back
  to the manifests.
- The generator is `scripts/generate-preview-index.ts`, writing
  `preview/registry-preview.tsx`; run `bun run preview:gen` after changing
  examples or areas.

## Convention: shared shadcn basics are external dependencies

When a registry item uses a shared shadcn basic such as `button`, `tabs`, or
`input-group`:

- Declare it by name in that item's `registryDependencies`
  (e.g. `"registryDependencies": ["input-group", "tabs"]`), so consumers pull
  the official shadcn source from shadcn/ui at install time.
- Never copy the basic into the area's source folders and never list such a
  copy in the item's `files`.
- Do not add internal `EdwardAstill/edcn/...` entries for shadcn basics; the
  bare component name is resolved by the shadcn CLI.

Local files under the repository-root `components/ui/` exist purely so the
preview site can render demos; they are preview infrastructure, not registry
payload. Keep them in sync with the official shadcn source when updating, but
treat them as implementation detail.

Example (from `registry/code/registry.json`): `code-editor` depends on the
`input-group` basic, while its own editor sources are the only files it ships.

## Other expectations

- Every new area follows the existing structure: manifest + README + source
  folders, registered via root `include`, plus a matching `examples/<area>/`
  folder with at least one runnable example.
- Internal imports inside an area use `@/registry/<area>/...` paths; targets
  in manifests use the install destinations (`@ui/...`, `@hooks/...`,
  `@lib/...`, `@components/...`).
- Before finishing work run `bun run registry:validate`, `bun run typecheck`,
  `bun run lint`, and `bun run test`; regenerate the preview with
  `bun run preview:gen` when registry content changed.
