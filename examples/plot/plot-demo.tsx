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
  PlotLine,
  PlotScatter,
  PlotReferenceLine,
  PlotLegend,
  PlotControls,
  PlotSlider,
  type Point,
} from "@/registry/plot/ui/plot";

export const description =
  "Compose axes, data, a legend, and sliders. Change one parameter to compare a wave with reference data.";

const reference: Point[] = Array.from({ length: 32 }, (_, index) => {
  const x = (index / 31) * Math.PI * 2;
  return [x, Math.cos(x)];
});
const observations: Point[] = Array.from({ length: 10 }, (_, index) => {
  const x = (index / 9) * Math.PI * 2;
  return [x, Math.sin(x) + 0.15 * Math.cos(x * 3)];
});

export function PlotDemo() {
  const [amplitude, setAmplitude] = React.useState(1);
  return (
    <Plot
      xDomain={[0, Math.PI * 2]}
      yDomain={[-3, 3]}
      className="w-full max-w-2xl"
    >
      <PlotTitle>Wave comparison</PlotTitle>
      <PlotDescription>
        Adjust the model amplitude while the reference and observations stay
        fixed.
      </PlotDescription>
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
          <PlotLine
            id="reference"
            label="Reference"
            data={reference}
            color="var(--chart-2)"
            strokeStyle="dashed"
            interpolation="monotone"
          />
          <PlotScatter
            id="observations"
            label="Observations"
            data={observations}
            color="var(--chart-3)"
            marker="diamond"
            markerSize={4}
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
