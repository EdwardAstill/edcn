"use client";

import * as React from "react";
import {
  CartesianGrid,
  ComposedChart,
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
import { PlotFunction, PlotSlider } from "@/registry/plot/ui/plot";

export const description =
  "Compose a fitted function, observations, and a shared control inside a chart card.";
const xDomain = [0, 6] as const;
const observations = Array.from({ length: 13 }, (_, i) => {
  const x = i / 2;
  return { x, y: 1.4 * Math.sin(x) + 0.12 * Math.cos(x * 3) };
});
const config = {
  model: {
    label: (
      <span className="font-serif text-base">
        <var>f</var>(<var>x</var>) = <var>A</var> sin(<var>x</var>)
      </span>
    ),
    color: "var(--chart-1)",
  },
  observations: { label: "Observations", color: "var(--chart-3)" },
};

export function PlotDemo() {
  const [amplitude, setAmplitude] = React.useState(1);
  const rmse = Math.sqrt(
    observations.reduce(
      (sum, { x, y }) => sum + (y - amplitude * Math.sin(x)) ** 2,
      0,
    ) / observations.length,
  );
  return (
    <div>
      <section className="flex flex-col gap-6">
        <header className="grid gap-2">
          <h3 className="text-base font-semibold tracking-tight">
            Fit a sine wave
          </h3>
          <p className="text-sm text-muted-foreground">
            Adjust the amplitude to bring the model closer to the observations.
          </p>
        </header>
        <div className="min-w-0">
          <ChartContainer
            config={config}
            className="aspect-auto h-[300px] w-full"
          >
            <ComposedChart
              accessibilityLayer
              aria-label="Sine model and observed values"
              margin={{ top: 12, right: 16, bottom: 4, left: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                type="number"
                scale="linear"
                dataKey="x"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)" }}
                allowDataOverflow
                tickMargin={10}
                minTickGap={24}
                height={54}
                label={{
                  value: "x (rad)",
                  position: "insideBottom",
                  offset: 0,
                  fill: "var(--muted-foreground)",
                }}
                domain={[...xDomain]}
                tickCount={7}
              />
              <YAxis
                type="number"
                scale="linear"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)" }}
                allowDataOverflow
                tickMargin={8}
                width={64}
                label={{
                  value: "Response",
                  position: "insideLeft",
                  angle: -90,
                  offset: 4,
                  style: { textAnchor: "middle" },
                  fill: "var(--muted-foreground)",
                }}
                domain={[-2, 2]}
                tickCount={5}
              />
              <ReferenceLine y={0} stroke="var(--border)" />
              <PlotFunction
                name="model"
                fn={(x) => amplitude * Math.sin(x)}
                xDomain={xDomain}
                stroke="var(--color-model)"
              />
              <Scatter
                name="observations"
                data={observations}
                dataKey="y"
                fill="var(--color-observations)"
                isAnimationActive={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent nameKey="name" hideLabel />}
              />
              <ChartLegend
                content={
                  <ChartLegendContent
                    nameKey="name"
                    className="flex-wrap gap-x-5 gap-y-2 pt-4"
                  />
                }
              />
            </ComposedChart>
          </ChartContainer>
        </div>
        <footer className="grid gap-6 sm:grid-cols-[1fr_auto]">
          <div className="grid w-full gap-5">
            <PlotSlider
              label="Amplitude · A"
              value={amplitude}
              onValueChange={setAmplitude}
              min={0}
              max={2}
              step={0.05}
              formatValue={(n) => n.toFixed(2)}
            />
          </div>
          <div className="grid gap-1 sm:border-l sm:pl-6">
            <span className="text-xs text-muted-foreground">
              Root mean square error
            </span>
            <output className="font-mono text-lg tabular-nums">
              {rmse.toFixed(3)}
            </output>
          </div>
        </footer>
      </section>
    </div>
  );
}
