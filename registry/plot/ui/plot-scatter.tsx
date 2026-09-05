"use client";

import * as React from "react";
import {
  usePlot,
  usePlotSeries,
  PlotMarker,
  type PlotMarkerType,
} from "@/registry/plot/ui/plot-context";
import type { ContinuousScale } from "@/registry/plot/lib/scales";
import type { Point } from "@/registry/plot/lib/paths";
export interface ScatterProps
  extends Omit<React.SVGProps<SVGGElement>, "children"> {
  data: readonly Point[];
  xScale: ContinuousScale;
  yScale: ContinuousScale;
  radius?: number;
  pointProps?: (
    point: Point,
    index: number,
  ) => React.SVGProps<SVGCircleElement>;
}

export function Scatter({
  data,
  xScale,
  yScale,
  radius = 3,
  fill = "var(--primary)",
  pointProps,
  ...props
}: ScatterProps) {
  return (
    <g {...props} fill={fill}>
      {data.map((point, index) => {
        if (!Number.isFinite(point[0]) || !Number.isFinite(point[1]))
          return null;
        return (
          <circle
            key={index}
            cx={xScale(point[0])}
            cy={yScale(point[1])}
            r={radius}
            {...pointProps?.(point, index)}
          />
        );
      })}
    </g>
  );
}

export interface PlotScatterProps
  extends Omit<React.ComponentProps<"g">, "id"> {
  id: string;
  label?: string;
  data: readonly Point[];
  color?: string;
  marker?: PlotMarkerType;
  markerSize?: number;
}

export function PlotScatter({
  id,
  label = id,
  data,
  color = "var(--chart-2, var(--primary))",
  marker = "circle",
  markerSize = 3,
  ...props
}: PlotScatterProps) {
  const { xScale, yScale } = usePlot();
  usePlotSeries({ id, label, color, kind: "scatter", marker });
  return (
    <g {...props} data-plot-series={id} fill={color}>
      {data.map(([x, y], index) => {
        const px = xScale(x);
        const py = yScale(y);
        return Number.isFinite(px) && Number.isFinite(py) ? (
          <PlotMarker
            key={index}
            marker={marker}
            x={px}
            y={py}
            size={markerSize}
          />
        ) : null;
      })}
    </g>
  );
}
