"use client";

import * as React from "react";
import { usePlot } from "@/registry/plot/ui/plot-context";
import type { Scale } from "@/registry/plot/lib/scales";
import { ticks } from "@/registry/plot/lib/ticks";
export interface AxisProps {
  scale: Scale;
  side: "bottom" | "left" | "top" | "right";
  label?: string;
  tickFormat?: (value: number | string) => React.ReactNode;
  numTicks?: number;
  tickSize?: number;
  className?: string;
}

export function Axis({
  scale: currentScale,
  side,
  label,
  tickFormat = String,
  numTicks = 5,
  tickSize = 6,
  className,
}: AxisProps) {
  const horizontal = side === "bottom" || side === "top";
  const values = ticks(currentScale, numTicks);
  const [rangeStart, rangeEnd] = currentScale.range;
  const tickDirection = side === "bottom" || side === "right" ? 1 : -1;

  const position = (value: number | string) => {
    if (currentScale.type === "ordinal") {
      return currentScale(value as string);
    }
    return currentScale(value as number);
  };

  if (horizontal) {
    const labelOffset = tickDirection * (tickSize + 14);
    const axisLabelOffset = tickDirection * (tickSize + 32);

    return (
      <g className={className}>
        <line
          x1={rangeStart}
          y1={0}
          x2={rangeEnd}
          y2={0}
          stroke="var(--border)"
        />
        {values.map((value) => {
          const x = position(value);
          return (
            <g key={String(value)} transform={`translate(${x}, 0)`}>
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={tickDirection * tickSize}
                stroke="var(--border)"
              />
              <text
                x={0}
                y={labelOffset}
                textAnchor="middle"
                dominantBaseline={side === "bottom" ? "hanging" : "auto"}
                fill="var(--muted-foreground)"
                fontFamily="var(--font-mono), ui-monospace, monospace"
                fontSize={11}
              >
                {tickFormat(value)}
              </text>
            </g>
          );
        })}
        {label ? (
          <text
            x={(rangeStart + rangeEnd) / 2}
            y={axisLabelOffset}
            textAnchor="middle"
            dominantBaseline={side === "bottom" ? "hanging" : "auto"}
            fill="var(--foreground)"
            fontFamily="var(--font-sans), ui-sans-serif, sans-serif"
            fontSize={12}
            fontWeight={500}
          >
            {label}
          </text>
        ) : null}
      </g>
    );
  }

  const labelOffset = tickDirection * (tickSize + 6);
  const axisLabelOffset = tickDirection * (tickSize + 38);
  const center = (rangeStart + rangeEnd) / 2;

  return (
    <g className={className}>
      <line
        x1={0}
        y1={rangeStart}
        x2={0}
        y2={rangeEnd}
        stroke="var(--border)"
      />
      {values.map((value) => {
        const y = position(value);
        return (
          <g key={String(value)} transform={`translate(0, ${y})`}>
            <line
              x1={0}
              y1={0}
              x2={tickDirection * tickSize}
              y2={0}
              stroke="var(--border)"
            />
            <text
              x={labelOffset}
              y={0}
              textAnchor={side === "left" ? "end" : "start"}
              dominantBaseline="middle"
              fill="var(--muted-foreground)"
              fontFamily="var(--font-mono), ui-monospace, monospace"
              fontSize={11}
            >
              {tickFormat(value)}
            </text>
          </g>
        );
      })}
      {label ? (
        <text
          x={axisLabelOffset}
          y={center}
          textAnchor="middle"
          transform={`rotate(-90, ${axisLabelOffset}, ${center})`}
          fill="var(--foreground)"
          fontFamily="var(--font-sans), ui-sans-serif, sans-serif"
          fontSize={12}
          fontWeight={500}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

// The low-level Axis export above also supports legacy frames and ordinal scales.
export interface PlotAxisProps extends Omit<AxisProps, "scale" | "side"> {
  side?: "bottom" | "top";
}

export function PlotXAxis({ side = "bottom", ...props }: PlotAxisProps) {
  const { xScale, innerHeight } = usePlot();
  return (
    <g transform={`translate(0, ${side === "bottom" ? innerHeight : 0})`}>
      <Axis {...props} scale={xScale} side={side} />
    </g>
  );
}

export function PlotYAxis({
  side = "left",
  ...props
}: Omit<PlotAxisProps, "side"> & { side?: "left" | "right" }) {
  const { yScale, innerWidth } = usePlot();
  return (
    <g transform={`translate(${side === "right" ? innerWidth : 0}, 0)`}>
      <Axis {...props} scale={yScale} side={side} />
    </g>
  );
}

export function PlotGrid({
  x = true,
  y = true,
  xNumTicks = 5,
  yNumTicks = 5,
  ...props
}: Omit<React.ComponentProps<"g">, "x" | "y"> & {
  x?: boolean;
  y?: boolean;
  xNumTicks?: number;
  yNumTicks?: number;
}) {
  const { xScale, yScale, innerWidth, innerHeight } = usePlot();
  return (
    <g stroke="var(--border)" strokeOpacity={0.5} aria-hidden="true" {...props}>
      {x &&
        ticks(xScale, xNumTicks).map((value) => (
          <line
            key={`x-${value}`}
            x1={xScale(Number(value))}
            x2={xScale(Number(value))}
            y1={0}
            y2={innerHeight}
          />
        ))}
      {y &&
        ticks(yScale, yNumTicks).map((value) => (
          <line
            key={`y-${value}`}
            y1={yScale(Number(value))}
            y2={yScale(Number(value))}
            x1={0}
            x2={innerWidth}
          />
        ))}
    </g>
  );
}
