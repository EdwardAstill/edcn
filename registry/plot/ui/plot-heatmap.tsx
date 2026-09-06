"use client";

import { ReferenceArea } from "recharts";
import { dataExtent } from "@/registry/plot/lib/data";

export interface PlotHeatmapProps {
  /** Columns of values, with rows increasing along the y domain. */
  data: readonly (readonly number[])[];
  colorScale: (normalized: number) => string;
  domain?: readonly [number, number];
  xDomain: readonly [number, number];
  yDomain: readonly [number, number];
  xAxisId?: string | number;
  yAxisId?: string | number;
  onCellClick?: (column: number, row: number, value: number) => void;
}

/** Numeric grid cells positioned and clipped by the parent Recharts axes. */
export function PlotHeatmap({
  data,
  colorScale,
  domain,
  xDomain: [x0, x1],
  yDomain: [y0, y1],
  xAxisId,
  yAxisId,
  onCellClick,
}: PlotHeatmapProps) {
  const columns = data.length;
  const rows = columns ? Math.max(...data.map((column) => column.length)) : 0;
  const extent = domain ?? dataExtent(data);
  if (!columns || !rows || !extent) return null;
  const [low, high] = extent;
  return data.flatMap((column, col) =>
    column.map((value, row) =>
      Number.isFinite(value) ? (
        <ReferenceArea
          key={`${col}-${row}`}
          xAxisId={xAxisId}
          yAxisId={yAxisId}
          x1={x0 + (col / columns) * (x1 - x0)}
          x2={x0 + ((col + 1) / columns) * (x1 - x0)}
          y1={y0 + (row / rows) * (y1 - y0)}
          y2={y0 + ((row + 1) / rows) * (y1 - y0)}
          fill={colorScale(
            Math.max(0, Math.min(1, (value - low) / (high - low || 1))),
          )}
          fillOpacity={1}
          stroke="none"
          ifOverflow="hidden"
          onClick={onCellClick ? () => onCellClick(col, row, value) : undefined}
        />
      ) : null,
    ),
  );
}
