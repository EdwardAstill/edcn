import {
  Plot,
  PlotTitle,
  PlotDescription,
  PlotCanvas,
  PlotXAxis,
  PlotYAxis,
  PlotData,
  PlotGrid,
  PlotLine,
  PlotLegend,
  type Point,
  type LineInterpolation,
  type LineVariant,
} from "@/registry/plot/ui/plot";

export const description =
  "Straight, step, and monotone connections with independent stroke styles and point markers.";

const points: Point[] = [
  [0, 0],
  [1, 1.5],
  [2, 0.5],
  [3, 2],
  [4, 1],
];
const styles: {
  interpolation: LineInterpolation;
  strokeStyle: LineVariant;
  label: string;
}[] = [
  { interpolation: "linear", strokeStyle: "solid", label: "Linear · solid" },
  {
    interpolation: "step-before",
    strokeStyle: "dashed",
    label: "Step before · dashed",
  },
  {
    interpolation: "step-after",
    strokeStyle: "dotted",
    label: "Step after · dotted",
  },
  {
    interpolation: "monotone",
    strokeStyle: "dash-dot",
    label: "Monotone · dash-dot",
  },
];

export function LineTypesDemo() {
  return (
    <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2">
      {styles.map(({ interpolation, strokeStyle, label }, index) => (
        <Plot key={interpolation} xDomain={[0, 4]} yDomain={[-0.5, 2.5]}>
          <PlotTitle>{label}</PlotTitle>
          <PlotDescription>
            The same five points with a different connection and stroke.
          </PlotDescription>
          <PlotCanvas width={400} height={260}>
            <PlotGrid />
            <PlotXAxis label="x" />
            <PlotYAxis label="y" />
            <PlotData>
              <PlotLine
                id={interpolation}
                label={label}
                data={points}
                interpolation={interpolation}
                strokeStyle={strokeStyle}
                marker="circle"
                color={`var(--chart-${index + 1})`}
              />
            </PlotData>
          </PlotCanvas>
          <PlotLegend />
        </Plot>
      ))}
    </div>
  );
}
