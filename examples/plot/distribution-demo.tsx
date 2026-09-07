"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { binCounts, PlotHeatmap, PlotSlider } from "@/registry/plot/ui/plot";

export const description =
  "Explore histogram binning and a Gaussian field with controls inside each card.";
const rainfall = [
  3, 7, 4, 9, 12, 8, 5, 11, 14, 6, 9, 10, 7, 4, 8, 13, 5, 9, 6, 12, 10, 7, 3, 8,
];
const colorScale = (t: number) =>
  `color-mix(in oklab, var(--chart-2) ${15 + t * 85}%, var(--card))`;

export function DistributionDemo() {
  const [bins, setBins] = React.useState(8);
  const [spread, setSpread] = React.useState(1.2);
  const { counts, low, binWidth } = binCounts(rainfall, bins, [0, 16]);
  const histogram = counts.map((count, i) => ({
    bin: `${low + i * binWidth}–${low + (i + 1) * binWidth}`,
    count,
  }));
  const grid = Array.from({ length: 32 }, (_, col) =>
    Array.from({ length: 32 }, (_, row) => {
      const x = -3 + ((col + 0.5) * 6) / 32;
      const y = -3 + ((row + 0.5) * 6) / 32;
      return Math.exp(-(x * x + y * y) / (2 * spread * spread));
    }),
  );
  return (
    <div className="grid gap-5 bg-muted/20 p-4 sm:p-6">
      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader className="gap-1.5">
          <h3 className="text-base font-semibold tracking-tight">
            Rainfall distribution
          </h3>
          <CardDescription>
            24 observations · adjust the bin count to explore the distribution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: { label: "Observations", color: "var(--chart-1)" },
            }}
            className="aspect-auto h-[260px] w-full"
          >
            <BarChart
              data={histogram}
              accessibilityLayer
              aria-label="Rainfall distribution"
              barCategoryGap={2}
              margin={{ top: 12, right: 16, bottom: 4, left: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)" }}
                allowDataOverflow
                tickMargin={10}
                minTickGap={24}
                height={54}
                label={{
                  value: "Rainfall (mm)",
                  position: "insideBottom",
                  offset: 0,
                  fill: "var(--muted-foreground)",
                }}
                dataKey="bin"
                type="category"
                scale="auto"
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
                  value: "Frequency",
                  position: "insideLeft",
                  angle: -90,
                  offset: 4,
                  style: { textAnchor: "middle" },
                  fill: "var(--muted-foreground)",
                }}
                allowDecimals={false}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <div className="grid w-full gap-5">
            <PlotSlider
              label="Number of bins"
              value={bins}
              onValueChange={setBins}
              min={4}
              max={16}
              step={4}
            />
          </div>
        </CardFooter>
      </Card>
      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader className="gap-1.5">
          <h3 className="text-base font-semibold tracking-tight">
            Gaussian field
          </h3>
          <CardDescription>
            A radial field with adjustable spread and a fixed intensity scale.
          </CardDescription>
          <span className="pt-2 font-serif text-base">
            <var>f</var>(<var>x</var>, <var>y</var>) = e
            <sup>
              −(<var>x</var>² + <var>y</var>²) / (2<var>σ</var>²)
            </sup>
          </span>
        </CardHeader>
        <CardContent className="mx-auto w-full max-w-md">
          <ChartContainer config={{}} className="aspect-square w-full">
            <ComposedChart
              accessibilityLayer
              aria-label="Gaussian field intensity from zero to one"
              margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
            >
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
                  value: "x",
                  position: "insideBottom",
                  offset: 0,
                  fill: "var(--muted-foreground)",
                }}
                domain={[-3, 3]}
                ticks={[-3, 0, 3]}
              />
              <YAxis
                type="number"
                scale="linear"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)" }}
                allowDataOverflow
                tickMargin={8}
                label={{
                  value: "y",
                  position: "insideLeft",
                  angle: -90,
                  offset: 4,
                  style: { textAnchor: "middle" },
                  fill: "var(--muted-foreground)",
                }}
                domain={[-3, 3]}
                ticks={[-3, 0, 3]}
                width={54}
              />
              <PlotHeatmap
                data={grid}
                domain={[0, 1]}
                xDomain={[-3, 3]}
                yDomain={[-3, 3]}
                colorScale={colorScale}
              />
            </ComposedChart>
          </ChartContainer>
          <div
            className="mx-auto mt-2 grid max-w-48 gap-1.5 text-xs text-muted-foreground"
            aria-label="Intensity: pale is zero, teal is one"
          >
            <div
              className="h-2 rounded-full"
              style={{
                background: `linear-gradient(to right, ${colorScale(0)}, ${colorScale(1)})`,
              }}
            />
            <div className="flex justify-between">
              <span>0</span>
              <span>Intensity</span>
              <span>1</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="grid w-full gap-5">
            <PlotSlider
              label="Spread · σ"
              value={spread}
              onValueChange={setSpread}
              min={0.4}
              max={2}
              step={0.1}
              formatValue={(n) => n.toFixed(1)}
            />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
