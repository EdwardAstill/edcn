"use client";

import * as React from "react";
import type { ContinuousScale } from "@/registry/plot/lib/scales";

export type PlotMarkerType = "none" | "circle" | "square" | "diamond";
export interface PlotSeriesMetadata {
  id: string;
  label: string;
  color: string;
  kind: "line" | "scatter" | "histogram" | "heatmap";
  marker?: PlotMarkerType;
  strokeWidth?: string | number;
  strokeDasharray?: string | number;
  strokeLinecap?: "butt" | "round" | "square" | "inherit";
}

export interface PlotRootContextValue {
  xDomain: readonly [number, number];
  yDomain: readonly [number, number];
  xScaleType: "linear" | "log";
  yScaleType: "linear" | "log";
  xLogBase: number;
  yLogBase: number;
  titleId: string;
  descriptionId: string;
  titlePresent: boolean;
  descriptionPresent: boolean;
  setTitlePresent: (present: boolean) => void;
  setDescriptionPresent: (present: boolean) => void;
  series: readonly PlotSeriesMetadata[];
  registerSeries: (series: PlotSeriesMetadata) => void;
  unregisterSeries: (id: string) => void;
}

export const PlotRootContext = React.createContext<PlotRootContextValue | null>(
  null,
);
export const PlotCanvasContext = React.createContext<{
  xScale: ContinuousScale;
  yScale: ContinuousScale;
  innerWidth: number;
  innerHeight: number;
} | null>(null);

export function usePlotRoot() {
  const context = React.useContext(PlotRootContext);
  if (!context) throw new Error("Plot components must be inside <Plot>.");
  return context;
}

export function usePlot() {
  const context = React.useContext(PlotCanvasContext);
  if (!context)
    throw new Error("Plot data and axes must be inside <PlotCanvas>.");
  return context;
}

export function usePlotSeries(metadata: PlotSeriesMetadata) {
  const { registerSeries, unregisterSeries } = usePlotRoot();
  const {
    id,
    label,
    color,
    kind,
    marker,
    strokeWidth,
    strokeDasharray,
    strokeLinecap,
  } = metadata;
  React.useEffect(() => {
    registerSeries({
      id,
      label,
      color,
      kind,
      marker,
      strokeWidth,
      strokeDasharray,
      strokeLinecap,
    });
  }, [
    registerSeries,
    id,
    label,
    color,
    kind,
    marker,
    strokeWidth,
    strokeDasharray,
    strokeLinecap,
  ]);
  React.useEffect(() => () => unregisterSeries(id), [unregisterSeries, id]);
}

export function PlotMarker({
  marker = "circle",
  x,
  y,
  size = 3,
  ...props
}: Omit<React.SVGProps<SVGElement>, "ref"> & {
  marker?: PlotMarkerType;
  x: number;
  y: number;
  size?: number;
}) {
  if (marker === "none") return null;
  if (marker === "square")
    return (
      <rect
        {...props}
        x={x - size}
        y={y - size}
        width={size * 2}
        height={size * 2}
      />
    );
  if (marker === "diamond")
    return (
      <path
        {...props}
        d={`M ${x} ${y - size} L ${x + size} ${y} L ${x} ${y + size} L ${x - size} ${y} Z`}
      />
    );
  return <circle {...props} cx={x} cy={y} r={size} />;
}
