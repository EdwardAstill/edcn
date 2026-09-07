import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

export const description =
  "Four compact cards comparing interpolation on the same sampled signal.";
const data = [0, 1.5, 0.5, 2, 1].map((y, x) => ({ x, y }));
const styles = [
  {
    type: "linear",
    dash: undefined,
    label: "Linear",
    note: "Straight segments between samples.",
  },
  {
    type: "stepBefore",
    dash: "6 4",
    label: "Step before",
    note: "Use the next sample’s value immediately.",
  },
  {
    type: "stepAfter",
    dash: "2 4",
    label: "Step after",
    note: "Hold each value until the next sample.",
  },
  {
    type: "monotone",
    dash: "6 4 2 4",
    label: "Monotone",
    note: "Smooth interpolation without overshoot.",
  },
] as const;

export function LineTypesDemo() {
  return (
    <div className="grid w-full gap-4 bg-muted/20 p-4 sm:grid-cols-2 sm:p-6">
      {styles.map(({ type, dash, label, note }, index) => (
        <Card key={type}>
          <CardHeader className="gap-1.5">
            <h3 className="text-sm font-semibold">{label}</h3>
            <CardDescription className="min-h-10 text-xs leading-relaxed">
              {note}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <ChartContainer
              config={{
                y: {
                  label: "Signal",
                  color: `var(--chart-${(index % 3) + 1})`,
                },
              }}
              className="aspect-auto h-[250px] w-full"
            >
              <LineChart
                data={data}
                accessibilityLayer
                aria-label={`${label} interpolation`}
                margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
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
                    value: "Sample (x)",
                    position: "insideBottom",
                    offset: 0,
                    fill: "var(--muted-foreground)",
                  }}
                  domain={[0, 4]}
                  ticks={[0, 2, 4]}
                  padding={{ left: 4, right: 4 }}
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
                  domain={[-0.2, 2.5]}
                  ticks={[0, 1, 2]}
                  width={48}
                />
                <Line
                  dataKey="y"
                  type={type}
                  strokeDasharray={dash}
                  stroke="var(--color-y)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-y)" }}
                  isAnimationActive={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
