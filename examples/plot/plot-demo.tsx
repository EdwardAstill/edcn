"use client";

import * as React from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
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
} from "@/registry/plot/ui/plot";

export const description =
  "A sampled function alongside native Recharts lines and observations, with a shared parameter control.";
const xDomain = [0, Math.PI * 2] as const;
const reference = Array.from({ length: 32 }, (_, i) => {
  const x = (i / 31) * Math.PI * 2;
  return { x, y: Math.cos(x) };
});
const observations = Array.from({ length: 10 }, (_, i) => {
  const x = (i / 9) * Math.PI * 2;
  return { x, y: Math.sin(x) + 0.15 * Math.cos(x * 3) };
});
const config = {
  model: { label: "Model", color: "var(--chart-1)" },
  reference: { label: "Reference", color: "var(--chart-2)" },
  observations: { label: "Observations", color: "var(--chart-3)" },
};

export function PlotDemo() {
  const [amplitude, setAmplitude] = React.useState(1);
  return (
    <div className="grid w-full max-w-2xl gap-4">
      <h3 className="font-semibold">Wave comparison</h3>
      <p className="text-sm text-muted-foreground">
        Adjust the model amplitude while the reference and observations stay
        fixed.
      </p>
      <ChartContainer config={config} className="h-[360px] w-full">
        <ComposedChart
          accessibilityLayer
          aria-label="Wave comparison"
          margin={{ bottom: 20, left: 8, right: 24 }}
        >
          <CartesianGrid />
          <XAxis
            dataKey="x"
            type="number"
            domain={[...xDomain]}
            allowDataOverflow
            label={{ value: "Time (s)", position: "insideBottom", offset: -12 }}
          />
          <YAxis type="number" domain={[-3, 3]} allowDataOverflow />
          <ReferenceLine y={0} />
          <PlotFunction
            name="model"
            fn={(x) => amplitude * Math.sin(x)}
            xDomain={xDomain}
            stroke="var(--color-model)"
          />
          <Line
            name="reference"
            data={reference}
            dataKey="y"
            stroke="var(--color-reference)"
            strokeDasharray="6 4"
            type="monotone"
            dot={false}
            isAnimationActive={false}
          />
          <Scatter
            name="observations"
            data={observations}
            dataKey="y"
            fill="var(--color-observations)"
            shape="diamond"
            isAnimationActive={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        </ComposedChart>
      </ChartContainer>
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
    </div>
  );
}
