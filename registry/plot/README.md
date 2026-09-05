# Plot

Composable, dependency-free SVG plots for React. Build a plot from explicit axes,
data layers, a visible title, a legend, and optional controls. All data layers use
the same canvas scales. Source is copied into your project by the shadcn CLI.

## Install

```sh
bunx shadcn@latest add EdwardAstill/edcn/plot
```

For the ready-made interactive function plot:

```sh
bunx shadcn@latest add EdwardAstill/edcn/function-plot
```

The function-plot item installs the plot primitives automatically. Neither item
requires a runtime dependency beyond React. Controls use a native range input.

## Structure

```text
Plot                         Domains, scale settings, and series metadata
├── PlotTitle                Visible heading and accessible canvas name
├── PlotDescription          Optional explanation
├── PlotCanvas               Responsive SVG, dimensions, margins, and scales
│   ├── PlotGrid             Grid aligned with scale ticks
│   ├── PlotXAxis            Horizontal axis, ticks, and label
│   ├── PlotYAxis            Vertical axis, ticks, and label
│   └── PlotData             Layers clipped to the plotting area
│       ├── PlotLine         Connected data points
│       ├── PlotFunction     Function sampled into a line
│       ├── PlotScatter      Point markers
│       ├── PlotHistogram    Binned observations
│       ├── PlotHeatmap      Numeric grid
│       └── PlotReferenceLine  Horizontal or vertical reference
├── PlotLegend               Matching labels and series symbols
└── PlotControls             HTML control layout
    └── PlotSlider           Label, range input, and formatted value
```

`PlotCanvas` is the SVG boundary: put axes and data inside it, and HTML headings,
legends, and controls outside it. Include only the parts you need. SVG layers
paint in child order; place the grid before the data. Each `PlotData` creates a
unique clip path. `usePlot()` exposes the canvas scales and inner dimensions for
custom SVG components.

## Compose a plot

Imports below use the default `@/components/ui` installation alias. Adjust it to
match your project's `components.json` aliases. In this repository, examples use
`@/registry/plot/ui/plot` instead.

```tsx
"use client";

import * as React from "react";
import {
  Plot,
  PlotTitle,
  PlotDescription,
  PlotCanvas,
  PlotGrid,
  PlotXAxis,
  PlotYAxis,
  PlotData,
  PlotFunction,
  PlotScatter,
  PlotReferenceLine,
  PlotLegend,
  PlotControls,
  PlotSlider,
} from "@/components/ui/plot/plot";

export function WavePlot() {
  const [amplitude, setAmplitude] = React.useState(1);

  return (
    <Plot xDomain={[-6, 6]} yDomain={[-3, 3]}>
      <PlotTitle>Wave comparison</PlotTitle>
      <PlotDescription>Adjust the model amplitude.</PlotDescription>

      <PlotCanvas height={360}>
        <PlotGrid />
        <PlotXAxis label="Time (s)" />
        <PlotYAxis label="Displacement (m)" />
        <PlotData>
          <PlotReferenceLine y={0} />
          <PlotFunction
            id="model"
            label="Model"
            fn={(x) => amplitude * Math.sin(x)}
            color="var(--chart-1)"
          />
          <PlotScatter
            id="observations"
            label="Observations"
            data={[
              [-2, -0.9],
              [0, 0.1],
              [2, 0.8],
            ]}
            color="var(--chart-2)"
            marker="diamond"
          />
        </PlotData>
      </PlotCanvas>

      <PlotLegend />
      <PlotControls>
        <PlotSlider
          label="Amplitude"
          value={amplitude}
          onValueChange={setAmplitude}
          min={0}
          max={3}
          step={0.1}
          formatValue={(value) => value.toFixed(1)}
        />
      </PlotControls>
    </Plot>
  );
}
```

The parent owns parameter state. One slider can update several series, and
controls can be placed wherever the layout needs them.

## Lines and markers

`PlotLine` accepts `data: readonly Point[]`, where `Point` is `[x, y]`.
`PlotFunction` accepts `fn(x, parameters)`, optional `parameters`, and `samples`
(default 400). Both expose the same rendering options:

| Option          | Values                                            | Default                          |
| --------------- | ------------------------------------------------- | -------------------------------- |
| `strokeStyle`   | `solid`, `dashed`, `dotted`, `dash-dot`           | `solid`                          |
| `interpolation` | `linear`, `step-before`, `step-after`, `monotone` | `linear`                         |
| `marker`        | `none`, `circle`, `square`, `diamond`             | `none`                           |
| `markerSize`    | Marker radius / half-width in SVG units           | `3`                              |
| `color`         | CSS color or theme variable                       | `var(--chart-1, var(--primary))` |

`step-before` changes y before x; `step-after` changes x before y. Monotone
interpolation preserves local extrema for strictly increasing or decreasing x.
Runs with repeated or unordered x values fall back to straight connections.
Points retain their input order; the renderer does not sort them.

Standard SVG path properties are supported, including `stroke`, `strokeWidth`,
`strokeDasharray`, and `strokeLinecap`. Explicit SVG stroke properties override
the color/preset. The legacy `variant` prop remains an alias for stroke style;
`strokeStyle` takes precedence when both are supplied.

Non-finite coordinates and coordinates invalid for a log scale create gaps.
Function evaluation errors also create gaps. Sampling does not detect every
finite jump or asymptote; use `defined` or explicit missing points where needed.
Function markers appear at every sampled point, so use fewer samples when
showing markers.

`PlotScatter` uses the same marker choices with a default of `circle`.
`PlotReferenceLine` takes either `x` or `y` and an optional `strokeStyle`; it does
not create a legend entry.

## Axes and data coordinates

- Set `xDomain` and `yDomain` on `Plot`. Domains are explicit and do not auto-fit
  when sliders move. `xScaleType` / `yScaleType` accept `linear` or `log`;
  logarithmic domains must be positive. Log bases default to 10.
- `PlotCanvas` defaults to 640 × 360 and scales to its container while preserving
  aspect ratio. Set `width`, `height`, and `margin` here. Defaults reserve room
  for bottom/left labels; increase margins for long labels or top/right axes.
- Axes accept `label`, `tickFormat`, `numTicks`, and `tickSize`. X-axis sides are
  `bottom` / `top`; Y-axis sides are `left` / `right`.
- `PlotGrid` accepts `x`, `y`, `xNumTicks`, and `yNumTicks`. Use matching tick counts
  on the grid and axes when customizing them.
- `PlotHistogram` takes `values`, `bins`, optional binning `domain` (defaulting to
  the sorted x domain), `color`, and pixel `gap`. Counts map through the y scale;
  set the y domain to the intended count range. The default baseline is zero,
  or the lower domain bound for log y; override it with `baseline`.
- `PlotHeatmap` takes columns of numeric values (`data[column][row]`) and
  `colorScale(normalizedValue)`. Its optional `domain` controls color normalization.
  Optional `xDomain` / `yDomain` define the grid's data-space bounds, defaulting to
  the canvas domains. Rows increase along the y domain. Cells use equal intervals
  in data space, so their screen widths/heights can differ on log scales.

## Legend and accessibility

Give each series a stable, unique `id` within its plot and an optional `label`
(defaulting to its id). `PlotLegend` reads registered series metadata, including
stroke patterns and markers. It updates when mounted series change, including
series inside custom React components. Registration happens after client mount;
the automatic legend is initially empty in server-rendered HTML. Legend order
follows series registration order. Set distinct colors explicitly when needed.

Histogram and heatmap entries use a color swatch; the heatmap swatch represents
the midpoint of its color scale, not a continuous color bar.

`PlotTitle` and `PlotDescription` connect to the canvas's accessible name and
summary. Without a visible title, pass `aria-label` to `PlotCanvas` for a useful
name. Sliders associate their labels and outputs with unique input ids and
support native keyboard interaction. Color, dash patterns, and markers can be
combined to distinguish series without relying solely on color.

## FunctionPlot shortcut and compatibility

`FunctionPlot` lives in `components/function-plot.tsx` and composes the primitives
above. Its existing `curves`, generated parameter sliders, `showLegend`,
`showControls`, and `onParameterChange` API remain available. Titles now render as
visible headings. The previous `ui/function-plot` entry point re-exports it.

The original `<Plot width={640} height={320} ...>` API remains available with
implicit bottom/left axes and render-prop children receiving the scales. For new
composition, put dimensions on `PlotCanvas`. Low-level `Frame`, `Axis`, `Line`,
`Scatter`, `Histogram`, and `Heatmap` exports remain available, alongside `scale`,
`ticks`, `linePath`, `dataExtent`, `binCounts`, and `sampleFunction`.

## Source layout

- `lib/`: scales, tick generation, paths, sampling, extents, and binning.
- `ui/`: root/canvas/context, axes/grid, data renderers, legend, and controls.
  `plot.tsx` is the public entry point; `plot-frame.tsx` preserves legacy framing.
- `components/`: the composed `FunctionPlot` shortcut.
- [`examples/plot/`](../../examples/plot/): interactive composition, line styles,
  distributions, and the function shortcut. Examples are not registry payload.
- [`tests/plot/`](../../tests/plot/): geometry, compatibility, and DOM interactions.

```sh
bun test tests/plot
```
