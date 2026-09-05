"use client";

import * as React from "react";
import { usePlot } from "@/registry/plot/ui/plot-context";
import { lineVariants, type LineVariant } from "@/registry/plot/ui/plot-line";

export type PlotReferenceLineProps = Omit<
  React.ComponentProps<"line">,
  "x" | "y"
> &
  ({ x: number; y?: never } | { y: number; x?: never }) & {
    strokeStyle?: LineVariant;
  };

export function PlotReferenceLine({
  x,
  y,
  strokeStyle = "dashed",
  ...props
}: PlotReferenceLineProps) {
  const { xScale, yScale, innerWidth, innerHeight } = usePlot();
  const position = x !== undefined ? xScale(x) : yScale(y!);
  if (!Number.isFinite(position)) return null;
  return (
    <line
      stroke="var(--muted-foreground)"
      {...lineVariants[strokeStyle]}
      {...props}
      x1={x !== undefined ? position : 0}
      x2={x !== undefined ? position : innerWidth}
      y1={x !== undefined ? 0 : position}
      y2={x !== undefined ? innerHeight : position}
    />
  );
}
