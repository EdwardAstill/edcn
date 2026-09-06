"use client";

import * as React from "react";
import { Line } from "recharts";
import { sampleFunction, type ParameterValues } from "@/registry/plot/lib/data";

export interface PlotFunctionProps extends Omit<
  React.ComponentProps<typeof Line>,
  "data" | "dataKey"
> {
  fn: (x: number, parameters: Readonly<ParameterValues>) => number;
  parameters?: Readonly<ParameterValues>;
  xDomain: readonly [number, number];
  samples?: number;
  /** Return false to leave a gap, for example at a known discontinuity. */
  defined?: (x: number, y: number) => boolean;
}

/** A sampled function rendered by Recharts. Use a numeric XAxis with dataKey="x". */
export function PlotFunction({
  fn,
  parameters,
  xDomain,
  samples = 400,
  defined,
  ...props
}: PlotFunctionProps) {
  const data = sampleFunction(fn, xDomain, parameters, samples).map(
    ([x, y]) => ({
      x,
      y: Number.isFinite(y) && (!defined || defined(x, y)) ? y : null,
    }),
  );
  return (
    <Line
      type="linear"
      dot={false}
      isAnimationActive={false}
      stroke="var(--chart-1)"
      {...props}
      data={data}
      dataKey="y"
    />
  );
}
