"use client";

import * as React from "react";
import { usePlot, usePlotSeries } from "@/registry/plot/ui/plot-context";
import { binCounts } from "@/registry/plot/lib/data";
export interface HistogramProps {
  values: readonly number[];
  bins: number;
  width: number;
  height: number;
  domain?: readonly [number, number];
  highlight?: (binCenter: number) => boolean;
  fill?: string;
  highlightFill?: string;
  maxCount?: number;
  gap?: number;
  className?: string;
}

export function Histogram({
  values,
  bins,
  width,
  height,
  domain,
  highlight,
  fill = "var(--muted-foreground)",
  highlightFill = "var(--primary)",
  maxCount,
  gap = 1,
  className,
}: HistogramProps) {
  const { counts, low, binWidth } = binCounts(values, bins, domain);
  if (counts.length === 0) return <g className={className} />;

  const cap = Math.max(maxCount ?? Math.max(...counts), 1);
  const barWidth = width / counts.length;

  return (
    <g className={className}>
      {counts.map((count, index) => {
        const barHeight = (count / cap) * height;
        const center = low + (index + 0.5) * binWidth;
        return (
          <rect
            key={index}
            x={index * barWidth + gap / 2}
            y={height - barHeight}
            width={Math.max(0, barWidth - gap)}
            height={barHeight}
            fill={
              highlight
                ? highlight(center)
                  ? highlightFill
                  : fill
                : highlightFill
            }
          />
        );
      })}
    </g>
  );
}

export interface PlotHistogramProps
  extends Omit<React.ComponentProps<"g">, "id" | "values"> {
  id: string;
  label?: string;
  values: readonly number[];
  bins: number;
  domain?: readonly [number, number];
  color?: string;
  gap?: number;
  baseline?: number;
}

export function PlotHistogram({
  id,
  label = id,
  values,
  bins,
  domain,
  color = "var(--chart-3, var(--primary))",
  gap = 1,
  baseline,
  ...props
}: PlotHistogramProps) {
  const { xScale, yScale } = usePlot();
  usePlotSeries({ id, label, color, kind: "histogram" });
  const bounds = domain ?? [
    Math.min(...xScale.domain),
    Math.max(...xScale.domain),
  ];
  const { counts, low, binWidth } = binCounts(values, bins, bounds);
  const base = yScale(
    baseline ?? (yScale.type === "log" ? Math.min(...yScale.domain) : 0),
  );
  return (
    <g {...props} data-plot-series={id} fill={color}>
      {counts.map((count, index) => {
        const start = xScale(low + index * binWidth);
        const end = xScale(low + (index + 1) * binWidth);
        const top = yScale(count);
        if (![start, end, top, base].every(Number.isFinite)) return null;
        return (
          <rect
            key={index}
            x={Math.min(start, end) + gap / 2}
            y={Math.min(top, base)}
            width={Math.max(0, Math.abs(end - start) - gap)}
            height={Math.abs(base - top)}
          />
        );
      })}
    </g>
  );
}
