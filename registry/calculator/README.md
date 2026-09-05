# Calculator

A standalone scientific calculator copied from `calc-widget`, with native MathML
previews, symbolic algebra and calculus, and a shared-equation workspace.

## Install

```bash
bunx shadcn@latest add EdwardAstill/edcn/calculator
```

```tsx
import { ScientificCalculator } from "@/components/calculator/scientific-calculator"

export default function Example() {
  return <ScientificCalculator />
}
```

Uses the shared shadcn Base UI controls declared in `registryDependencies` and
your application's theme. No calculator-specific stylesheet is required.
The Python solver starts when the component mounts and downloads Pyodide
314.0.6 and SymPy from jsDelivr. Initial startup needs network access; subsequent
calculations reuse the worker. The worker is bundled into a module Blob.

## Notation

- Arithmetic and implicit multiplication: `2(x+1)`, `sqrt(2)`, `sin(pi/2)`.
- Algebra: `simplify((x^2-1)/(x-1))`, `expand((x+1)^3)`, `factor(x^2-1)`.
- Calculus: `diff(x^3, x)`, `integrate(sin(x), x)`, `limit(sin(x)/x, x, 0)`.
- Shared relations: save equations such as `2x + 3 = 7` and expression queries
  such as `x^2 + 1`, then solve them together.

The solver returns exact, finite real solutions and distinguishes inconsistent,
underdetermined, overdefined, unsupported, and unresolved systems. More equation
rows than distinct unknowns count as overdefined, including redundant rows.
Plotting controls are disabled in this version. The built-in help describes the
supported notation.

## Source layout

- `components/`: public `ScientificCalculator` component and export.
- `ui/`: result rendering.
- `lib/`: state, operations, parser, MathML/LaTeX, solver, and generated assets.
- `../../examples/calculator/`: runnable preview.
- `../../tests/calculator/`: parser, reducer, operations, and solver-client tests.

After changing `lib/help.md`, `lib/solver/solver.py`, or the worker source, run
`bun run calculator:gen` to regenerate the embedded assets. Then run
`bun run registry:build` and `bun run check`.

The optional `solverClient` prop accepts a `SolverClient` for embedding or tests;
otherwise the component creates and disposes its own worker-backed client.
