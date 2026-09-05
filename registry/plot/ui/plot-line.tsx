"use client";

import * as React from "react";
import {
  usePlot,
  usePlotSeries,
  PlotMarker,
  type PlotMarkerType,
} from "@/registry/plot/ui/plot-context";
import { sampleFunction, type ParameterValues } from "@/registry/plot/lib/data";
import type { ContinuousScale } from "@/registry/plot/lib/scales";
import {
  linePath,
  type Point,
  type LineInterpolation,
} from "@/registry/plot/lib/paths";
export type LineVariant = "solid" | "dashed" | "dotted" | "dash-dot";

export const lineVariants: Record<
  LineVariant,
  Pick<React.SVGProps<SVGPathElement>, "strokeDasharray" | "strokeLinecap">
> = {
  solid: {},
  "dash-dot": { strokeDasharray: "8 4 1 4", strokeLinecap: "round" },
  dashed: { strokeDasharray: "8 5" },
  dotted: { strokeDasharray: "1 6", strokeLinecap: "round" },
};

export interface LineProps extends Omit<React.SVGProps<SVGPathElement>, "d"> {
  data: readonly Point[];
  xScale: ContinuousScale;
  yScale: ContinuousScale;
  defined?: (point: Point, index: number) => boolean;
  variant?: LineVariant;
  interpolation?: LineInterpolation;
}

export function Line({
  data,
  xScale,
  yScale,
  defined,
  variant = "solid",
  interpolation = "linear",
  fill = "none",
  stroke = "var(--primary)",
  strokeWidth = 2,
  strokeDasharray,
  strokeLinecap,
  vectorEffect = "non-scaling-stroke",
  ...props
}: LineProps) {
  const variantProps = lineVariants[variant];

  return (
    <path
      {...props}
      d={linePath(data, xScale, yScale, defined, interpolation)}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray ?? variantProps.strokeDasharray}
      strokeLinecap={strokeLinecap ?? variantProps.strokeLinecap}
      vectorEffect={vectorEffect}
    />
  );
}

export interface PlotLineProps
  extends Omit<LineProps, "xScale" | "yScale" | "id"> {
  id: string;
  label?: string;
  color?: string;
  strokeStyle?: LineVariant;
  marker?: PlotMarkerType;
  markerSize?: number;
}

export function PlotLine({
  id,
  label = id,
  color = "var(--chart-1, var(--primary))",
  strokeStyle,
  variant = "solid",
  marker = "none",
  markerSize = 3,
  data,
  stroke = color,
  strokeWidth = 2,
  strokeDasharray,
  strokeLinecap,
  defined,
  ...props
}: PlotLineProps) {
  const { xScale, yScale } = usePlot();
  const style = lineVariants[strokeStyle ?? variant];
  usePlotSeries({
    id,
    label,
    color: stroke,
    kind: "line",
    marker,
    strokeWidth,
    strokeDasharray: strokeDasharray ?? style.strokeDasharray,
    strokeLinecap: strokeLinecap ?? style.strokeLinecap,
  });
  return (
    <g data-plot-series={id}>
      <Line
        {...props}
        data={data}
        xScale={xScale}
        yScale={yScale}
        defined={defined}
        stroke={stroke}
        strokeWidth={strokeWidth}
        variant={strokeStyle ?? variant}
        strokeDasharray={strokeDasharray}
        strokeLinecap={strokeLinecap}
      />
      {marker !== "none" &&
        data.map((point, index) => {
          const x = xScale(point[0]);
          const y = yScale(point[1]);
          if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            (defined && !defined(point, index))
          )
            return null;
          return (
            <PlotMarker
              key={index}
              marker={marker}
              x={x}
              y={y}
              size={markerSize}
              fill={stroke}
            />
          );
        })}
    </g>
  );
}

export interface PlotFunctionProps extends Omit<PlotLineProps, "data"> {
  fn: (x: number, parameters: Readonly<ParameterValues>) => number;
  parameters?: Readonly<ParameterValues>;
  samples?: number;
}

export function PlotFunction({
  fn,
  parameters = {},
  samples = 400,
  ...props
}: PlotFunctionProps) {
  const { xScale } = usePlot();
  return (
    <PlotLine
      {...props}
      data={sampleFunction(fn, xScale.domain, parameters, samples)}
    />
  );
}
