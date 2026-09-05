import {
  Plot,
  PlotTitle,
  PlotDescription,
  PlotCanvas,
  PlotXAxis,
  PlotYAxis,
  PlotData,
  PlotGrid,
  PlotHistogram,
  PlotHeatmap,
  PlotLegend,
} from "@/registry/plot/ui/plot";

export const description =
  "Histograms and heatmaps share their canvas coordinates with explicit axes.";
const rainfall = [
  3, 7, 4, 9, 12, 8, 5, 11, 14, 6, 9, 10, 7, 4, 8, 13, 5, 9, 6, 12, 10, 7, 3, 8,
];
const grid = Array.from({ length: 16 }, (_, x) =>
  Array.from({ length: 12 }, (_, y) => Math.sin(x / 3) * Math.cos(y / 3)),
);

export function DistributionDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-8">
      <Plot xDomain={[0, 16]} yDomain={[0, 7]}>
        <PlotTitle>Rainfall distribution</PlotTitle>
        <PlotCanvas height={280}>
          <PlotGrid x={false} />
          <PlotXAxis label="Rainfall (mm)" />
          <PlotYAxis label="Observations" />
          <PlotData>
            <PlotHistogram
              id="rainfall"
              label="Daily rainfall"
              values={rainfall}
              bins={8}
            />
          </PlotData>
        </PlotCanvas>
        <PlotLegend />
      </Plot>
      <Plot xDomain={[0, 16]} yDomain={[0, 12]}>
        <PlotTitle>Spatial intensity</PlotTitle>
        <PlotDescription>
          Darker cells indicate higher intensity, from −1 to 1.
        </PlotDescription>
        <PlotCanvas height={280}>
          <PlotXAxis label="x" />
          <PlotYAxis label="y" />
          <PlotData>
            <PlotHeatmap
              id="intensity"
              label="Intensity"
              data={grid}
              domain={[-1, 1]}
              colorScale={(t) => `hsl(220 75% ${92 - t * 58}%)`}
            />
          </PlotData>
        </PlotCanvas>
        <PlotLegend />
      </Plot>
    </div>
  );
}
