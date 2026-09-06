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
import { binCounts, PlotHeatmap } from "@/registry/plot/ui/plot";

export const description =
  "Histogram binning and a numeric heatmap on shadcn charts.";
const rainfall = [
  3, 7, 4, 9, 12, 8, 5, 11, 14, 6, 9, 10, 7, 4, 8, 13, 5, 9, 6, 12, 10, 7, 3, 8,
];
const { counts, low, binWidth } = binCounts(rainfall, 8, [0, 16]);
const histogram = counts.map((count, i) => ({
  bin: `${low + i * binWidth}–${low + (i + 1) * binWidth}`,
  count,
}));
const grid = Array.from({ length: 16 }, (_, x) =>
  Array.from({ length: 12 }, (_, y) => Math.sin(x / 3) * Math.cos(y / 3)),
);

export function DistributionDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-8">
      <div className="grid gap-4">
        <h3 className="font-semibold">Rainfall distribution</h3>
        <ChartContainer
          config={{ count: { label: "Observations", color: "var(--chart-1)" } }}
          className="h-[280px] w-full"
        >
          <BarChart
            data={histogram}
            accessibilityLayer
            aria-label="Rainfall distribution"
            barCategoryGap={1}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="bin" />
            <YAxis allowDecimals={false} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              isAnimationActive={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </BarChart>
        </ChartContainer>
      </div>
      <div className="grid gap-4">
        <h3 className="font-semibold">Spatial intensity</h3>
        <p className="text-sm text-muted-foreground">
          Darker cells indicate higher intensity, from −1 to 1.
        </p>
        <ChartContainer config={{}} className="h-[280px] w-full">
          <ComposedChart
            accessibilityLayer
            aria-label="Spatial intensity, from minus one to one"
          >
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, 16]}
              allowDataOverflow
            />
            <YAxis type="number" domain={[0, 12]} allowDataOverflow />
            <PlotHeatmap
              data={grid}
              domain={[-1, 1]}
              xDomain={[0, 16]}
              yDomain={[0, 12]}
              colorScale={(t) => `hsl(220 75% ${92 - t * 58}%)`}
            />
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  );
}
