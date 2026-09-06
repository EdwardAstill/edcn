import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

export const description =
  "Use Recharts directly for line interpolation, strokes, and markers.";
const data = [0, 1.5, 0.5, 2, 1].map((y, x) => ({ x, y }));
const styles = [
  { type: "linear", dash: undefined, label: "Linear · solid" },
  { type: "stepBefore", dash: "6 4", label: "Step before · dashed" },
  { type: "stepAfter", dash: "2 4", label: "Step after · dotted" },
  { type: "monotone", dash: "6 4 2 4", label: "Monotone · dash-dot" },
] as const;

export function LineTypesDemo() {
  return (
    <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2">
      {styles.map(({ type, dash, label }, index) => (
        <div key={type} className="grid gap-4">
          <h3 className="font-semibold">{label}</h3>
          <ChartContainer
            config={{ y: { label, color: `var(--chart-${index + 1})` } }}
            className="h-[260px] w-full"
          >
            <LineChart data={data} accessibilityLayer aria-label={label}>
              <CartesianGrid />
              <XAxis dataKey="x" type="number" domain={[0, 4]} />
              <YAxis domain={[-0.5, 2.5]} />
              <Line
                dataKey="y"
                type={type}
                strokeDasharray={dash}
                stroke="var(--color-y)"
                dot
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        </div>
      ))}
    </div>
  );
}
