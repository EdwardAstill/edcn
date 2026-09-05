"use client";

import * as React from "react";
import { usePlotRoot, PlotMarker } from "@/registry/plot/ui/plot-context";

export function PlotLegend({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  const { series } = usePlotRoot();
  return (
    <ul
      aria-label="Plot legend"
      {...props}
      className={`flex list-none flex-wrap items-center gap-x-4 gap-y-2 p-0 text-sm text-muted-foreground ${className ?? ""}`.trim()}
    >
      {series.map((item) => (
        <li key={item.id} className="inline-flex items-center gap-2">
          <svg width={28} height={12} aria-hidden="true">
            {item.kind === "line" && (
              <line
                x1={1}
                x2={27}
                y1={6}
                y2={6}
                stroke={item.color}
                strokeWidth={item.strokeWidth}
                strokeDasharray={item.strokeDasharray}
                strokeLinecap={item.strokeLinecap}
              />
            )}
            {item.kind === "line" || item.kind === "scatter" ? (
              <PlotMarker
                x={14}
                y={6}
                marker={item.marker ?? "none"}
                fill={item.color}
              />
            ) : (
              <rect x={8} y={1} width={12} height={10} fill={item.color} />
            )}
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
