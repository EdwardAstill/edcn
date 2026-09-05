"use client";

import * as React from "react";
import { usePlot, usePlotSeries } from "@/registry/plot/ui/plot-context";
import { dataExtent } from "@/registry/plot/lib/data";
export interface HeatmapProps {
  data: readonly (readonly number[])[];
  width: number;
  height: number;
  colorScale: (value: number) => string;
  domain?: readonly [number, number];
  invalid?: (value: number) => boolean;
  flipY?: boolean;
  onCellClick?: (column: number, row: number, value: number) => void;
  className?: string;
}

export function Heatmap({
  data,
  width,
  height,
  colorScale,
  domain,
  invalid = (value) => !Number.isFinite(value),
  flipY = true,
  onCellClick,
  className,
}: HeatmapProps) {
  const columns = data.length;
  const rows =
    columns > 0 ? Math.max(...data.map((column) => column.length)) : 0;
  if (columns === 0 || rows === 0) return <g className={className} />;

  const extent = domain ?? dataExtent(data, invalid);
  if (!extent) return <g className={className} />;

  const [low, high] = extent;
  const span = high - low || 1;
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  return (
    <g className={className}>
      {data.flatMap((column, columnIndex) =>
        column.map((value, rowIndex) => {
          if (invalid(value)) return null;
          const normalized = Math.max(0, Math.min(1, (value - low) / span));
          return (
            <rect
              key={`${columnIndex}-${rowIndex}`}
              x={columnIndex * cellWidth}
              y={
                flipY
                  ? height - (rowIndex + 1) * cellHeight
                  : rowIndex * cellHeight
              }
              width={cellWidth + 0.5}
              height={cellHeight + 0.5}
              fill={colorScale(normalized)}
              style={onCellClick ? { cursor: "pointer" } : undefined}
              onClick={
                onCellClick
                  ? () => onCellClick(columnIndex, rowIndex, value)
                  : undefined
              }
            />
          );
        }),
      )}
    </g>
  );
}

export interface PlotHeatmapProps
  extends Omit<React.ComponentProps<"g">, "id"> {
  id: string;
  label?: string;
  /** Columns of values, with rows increasing along the y domain. */
  data: readonly (readonly number[])[];
  colorScale: (normalized: number) => string;
  domain?: readonly [number, number];
  xDomain?: readonly [number, number];
  yDomain?: readonly [number, number];
  onCellClick?: (column: number, row: number, value: number) => void;
}

export function PlotHeatmap({
  id,
  label = id,
  data,
  colorScale,
  domain,
  xDomain,
  yDomain,
  onCellClick,
  ...props
}: PlotHeatmapProps) {
  const { xScale, yScale } = usePlot();
  usePlotSeries({ id, label, color: colorScale(0.5), kind: "heatmap" });
  const columns = data.length;
  const rows = columns ? Math.max(...data.map((column) => column.length)) : 0;
  const extent = domain ?? dataExtent(data);
  if (!columns || !rows || !extent) return null;
  const [low, high] = extent;
  const [x0, x1] = xDomain ?? xScale.domain;
  const [y0, y1] = yDomain ?? yScale.domain;
  return (
    <g {...props} data-plot-series={id}>
      {data.flatMap((column, col) =>
        column.map((value, row) => {
          const left = xScale(x0 + (col / columns) * (x1 - x0));
          const right = xScale(x0 + ((col + 1) / columns) * (x1 - x0));
          const bottom = yScale(y0 + (row / rows) * (y1 - y0));
          const top = yScale(y0 + ((row + 1) / rows) * (y1 - y0));
          if (![value, left, right, bottom, top].every(Number.isFinite))
            return null;
          return (
            <rect
              key={`${col}-${row}`}
              x={Math.min(left, right)}
              y={Math.min(top, bottom)}
              width={Math.abs(right - left)}
              height={Math.abs(bottom - top)}
              fill={colorScale(
                Math.max(0, Math.min(1, (value - low) / (high - low || 1))),
              )}
              onClick={
                onCellClick ? () => onCellClick(col, row, value) : undefined
              }
            />
          );
        }),
      )}
    </g>
  );
}
