# Plot

Interactive mathematical plots built on shadcn charts and Recharts. Plot adds
function sampling and labeled sliders. Use the standard shadcn card, chart,
legend, and tooltip components with native Recharts axes. Existing histogram
binning and heatmap helpers are also available.

## Install

```sh
bunx shadcn@latest add EdwardAstill/edcn/function-plot
```

For the individual extensions:

```sh
bunx shadcn@latest add EdwardAstill/edcn/plot
```

The registry installs the official `chart` and `slider` dependencies and Recharts.
`function-plot` also installs the official `card` component.
Shared shadcn components are external dependencies, not copies in the plot payload.

## Interactive functions

```tsx
"use client";

import { FunctionPlot } from "@/components/plot/function-plot";

export function Wave() {
  return (
    <FunctionPlot
      title="Sine wave"
      description="Explore the effect of amplitude on a sine wave."
      xLabel="Phase (rad)"
      yLabel="Amplitude"
      xDomain={[-6, 6]}
      yDomain={[-3, 3]}
      curves={[
        {
          id: "wave",
          label: <span className="font-serif"><var>f</var>(<var>x</var>) = <var>A</var> sin(<var>x</var>)</span>,
          fn: (x, p) => p.amplitude! * Math.sin(x),
          parameters: {
            amplitude: { value: 1, min: 0, max: 3, step: 0.1 },
          },
        },
      ]}
    />
  );
}
```

`FunctionPlot` renders a shadcn card with a grouped title and description, a
responsive plot, a wrapping formula legend, and an integrated control footer.
`controlsClassName` styles the control group.

`FunctionPlot` generates shadcn sliders from each curve's `parameters`, keeps
parameter state, and redraws curves immediately. Parameter definitions accept
`label` and `formatValue`; `onParameterChange(curveId, values)` reports changes.
Use stable, unique curve ids. Parameter `value` is the initial value until edited;
remount the component to reset all parameters.

`showControls` and `showLegend` default to true. `title` and `description` provide
visible, accessible chart context. `height` defaults to 360; `width` defaults to
640 and supplies the initial responsive measurement. The chart then fills its
container. `margin`, axis labels, tick formatters/counts, and `linear`/`log` scale
types remain configurable. `xTicks` and `yTicks` accept explicit tick positions
(for example `[-Math.PI, 0, Math.PI]` with a π tick formatter). Log domains must be positive; nonpositive curve values
are omitted on logarithmic axes.

A curve's `line` accepts Recharts line options, including `stroke`, `strokeWidth`,
`strokeDasharray`, `type`, and `dot`. The older `variant` stroke presets remain
available. Curve-level `samples` overrides the component default of 400.

## Math labels

Shadcn's chart config already accepts React labels. Use ordinary JSX with
`<var>`, `<sup>`, and `<sub>` for a mathematical key:

```tsx
const config = {
  quadratic: {
    label: <span className="font-serif"><var>y</var> = <var>x</var><sup>2</sup></span>,
    color: "var(--chart-1)",
  },
};
```

The same JSX works in `FunctionCurve.label`. No equation renderer or custom
legend is required. Place `PlotSlider` in a standard `CardFooter`, or use a
normal grid to position shared controls beside your charts.

## Compose with shadcn and Recharts

Use Recharts components directly when you need custom axes, reference lines,
scatter points, or other chart types. `PlotFunction` adds a sampled line to the
same chart; it requires a numeric `XAxis` with `dataKey="x"`.

```tsx
"use client";

import * as React from "react";
import { CartesianGrid, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  PlotFunction,
  PlotControls,
  PlotSlider,
} from "@/components/ui/plot/plot";

export function ControlledWave() {
  const [amplitude, setAmplitude] = React.useState(1);
  return (
    <div className="grid gap-4">
      <ChartContainer
        config={{ wave: { label: "Wave", color: "var(--chart-1)" } }}
        className="h-[360px] w-full"
      >
        <LineChart accessibilityLayer aria-label="Adjustable wave">
          <CartesianGrid vertical={false} />
          <XAxis dataKey="x" type="number" domain={[-6, 6]} allowDataOverflow tickLine={false} axisLine={false} />
          <YAxis domain={[-3, 3]} allowDataOverflow tickLine={false} axisLine={false} />
          <PlotFunction
            name="wave"
            fn={(x) => amplitude * Math.sin(x)}
            xDomain={[-6, 6]}
            stroke="var(--color-wave)"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        </LineChart>
      </ChartContainer>
      <PlotControls>
        <PlotSlider
          label="Amplitude"
          value={amplitude}
          onValueChange={setAmplitude}
          min={0}
          max={3}
          step={0.1}
          formatValue={(n) => n.toFixed(1)}
        />
      </PlotControls>
    </div>
  );
}
```

`PlotFunction` samples `fn(x, parameters)` into `{ x, y }` data. Its `name` should
match the chart config key. With several functions sharing `dataKey="y"`, use
`ChartLegendContent nameKey="name"` to resolve the correct labels.

Non-finite results and evaluation errors become nulls, leaving gaps. A
`defined(x, y)` predicate can exclude known discontinuities or nonpositive log
values. Sampling is uniform in x and does not detect every finite jump or
asymptote. Recharts line options pass through; animation and point markers are
disabled by default for responsive slider updates.

`PlotControls` and `PlotSlider` work outside any chart context, so one parent-owned
parameter can control several curves or charts. `PlotSlider` adds a label and
formatted output to the official shadcn slider, with native keyboard support.

## Distributions and heatmaps

- `binCounts(values, bins, domain?)` returns `counts`, `low`, `high`, and `binWidth`.
  Transform these into rows for a Recharts `BarChart`; the distribution example
  demonstrates this. The final bin includes the upper domain bound.
- `PlotHeatmap` renders `data[column][row]` using Recharts `ReferenceArea` cells.
  Provide explicit `xDomain` and `yDomain` for the grid, numeric parent axes
  (`XAxis dataKey="x" type="number"`), and `colorScale(normalizedValue)`.
  Optional `domain` controls color normalization; otherwise finite cells define
  the extent. Invalid cells are skipped. `xAxisId`/`yAxisId` select parent axes,
  and `onCellClick(column, row, value)` handles cell clicks. Cells use equal data
  intervals and Recharts clipping. Provide a color key separately if needed;
  reference areas do not generate legend entries or tooltip data.
- `sampleFunction` still returns `[x, y]` tuples for standalone use; errors become
  `NaN`. `dataExtent` still finds finite grid bounds.

## Migration from the SVG implementation

This is a breaking change to the low-level plot API. The standalone SVG engine,
legacy render props, custom scales, tick generation, and path builder have been
removed. `FunctionPlot` and its `ui/function-plot` entry point remain, but `line`
now uses Recharts options. Custom logarithm bases are configured on Recharts axes
in composed charts instead of through `FunctionPlot`.

| Previous API                                   | Replacement                                                                              |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Plot`, `PlotCanvas`, `Frame`                  | `ChartContainer` + Recharts `LineChart`/`ComposedChart`                                  |
| `PlotTitle`, `PlotDescription`                 | Ordinary headings and paragraphs with chart ARIA references                              |
| `PlotXAxis`, `PlotYAxis`, `PlotGrid`           | `XAxis`, `YAxis`, `CartesianGrid`                                                        |
| `PlotLine`, `PlotScatter`, `PlotReferenceLine` | `Line`, `Scatter`, `ReferenceLine`                                                       |
| `PlotData`                                     | Put series directly inside the Recharts chart; use `allowDataOverflow` for fixed domains |
| `PlotLegend`                                   | `ChartLegend` + `ChartLegendContent`                                                     |
| `PlotHistogram`                                | `binCounts` + `BarChart`/`Bar`                                                           |
| `strokeStyle`, `interpolation`, `marker`       | `strokeDasharray`, `type`, `dot`/scatter `shape`                                         |
| `usePlot`, `scale`, `ticks`, `linePath`        | Recharts axes, hooks, and renderers                                                      |

See [`examples/plot/`](../../examples/plot/) for the migrated examples. They are
preview code and are not installed as registry items.

```sh
bun test tests/plot
```
