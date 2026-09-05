"use client";

import * as React from "react";
import {
  scale,
  type Scale,
  type ContinuousScale,
} from "@/registry/plot/lib/scales";
import { Axis } from "@/registry/plot/ui/plot-axis";
export interface PlotMargin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface PlotRenderArgs<
  XScale extends Scale = Scale,
  YScale extends Scale = Scale,
> {
  xScale: XScale;
  yScale: YScale;
  innerWidth: number;
  innerHeight: number;
}

export interface FrameProps<
  XScale extends Scale = Scale,
  YScale extends Scale = Scale,
> {
  width: number;
  height: number;
  margin?: PlotMargin;
  xScale: XScale;
  yScale: YScale;
  xLabel?: string;
  yLabel?: string;
  xTickFormat?: (value: number | string) => React.ReactNode;
  yTickFormat?: (value: number | string) => React.ReactNode;
  xNumTicks?: number;
  yNumTicks?: number;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  children?:
    | React.ReactNode
    | ((args: PlotRenderArgs<XScale, YScale>) => React.ReactNode);
}

function resolveMargin(
  margin: PlotMargin | undefined,
  xLabel: string | undefined,
  yLabel: string | undefined,
) {
  return {
    top: margin?.top ?? 16,
    right: margin?.right ?? 16,
    bottom: margin?.bottom ?? (xLabel ? 58 : 38),
    left: margin?.left ?? (yLabel ? 64 : 46),
  };
}

export function Frame<XScale extends Scale, YScale extends Scale>({
  width,
  height,
  margin: marginInput,
  xScale,
  yScale,
  xLabel,
  yLabel,
  xTickFormat,
  yTickFormat,
  xNumTicks,
  yNumTicks,
  title,
  className,
  style,
  children,
}: FrameProps<XScale, YScale>) {
  const margin = resolveMargin(marginInput, xLabel, yLabel);
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);
  const renderArgs = { xScale, yScale, innerWidth, innerHeight };
  const content =
    typeof children === "function" ? children(renderArgs) : children;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={title ?? "Plot"}
      className={className}
      style={{ display: "block", width: "100%", height: "auto", ...style }}
    >
      {title ? <title>{title}</title> : null}
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {content}
        <g transform={`translate(0, ${innerHeight})`}>
          <Axis
            scale={xScale}
            side="bottom"
            label={xLabel}
            tickFormat={xTickFormat}
            numTicks={xNumTicks}
          />
        </g>
        <Axis
          scale={yScale}
          side="left"
          label={yLabel}
          tickFormat={yTickFormat}
          numTicks={yNumTicks}
        />
      </g>
    </svg>
  );
}

export interface LegacyPlotProps
  extends Omit<
    FrameProps<ContinuousScale, ContinuousScale>,
    "xScale" | "yScale" | "children"
  > {
  xDomain: readonly [number, number];
  yDomain: readonly [number, number];
  xScaleType?: "linear" | "log";
  yScaleType?: "linear" | "log";
  xLogBase?: number;
  yLogBase?: number;
  children?:
    | React.ReactNode
    | ((
        args: PlotRenderArgs<ContinuousScale, ContinuousScale>,
      ) => React.ReactNode);
}

/** A convenient frame that derives correctly sized x and y scales from domains. */
export function LegacyPlot({
  xDomain,
  yDomain,
  xScaleType = "linear",
  yScaleType = "linear",
  xLogBase = 10,
  yLogBase = 10,
  margin: marginInput,
  xLabel,
  yLabel,
  width,
  height,
  children,
  ...props
}: LegacyPlotProps) {
  const margin = resolveMargin(marginInput, xLabel, yLabel);
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);
  const xScale =
    xScaleType === "log"
      ? scale.log({ domain: xDomain, range: [0, innerWidth], base: xLogBase })
      : scale.linear({ domain: xDomain, range: [0, innerWidth] });
  const yScale =
    yScaleType === "log"
      ? scale.log({ domain: yDomain, range: [innerHeight, 0], base: yLogBase })
      : scale.linear({ domain: yDomain, range: [innerHeight, 0] });

  return (
    <Frame
      {...props}
      width={width}
      height={height}
      margin={margin}
      xScale={xScale}
      yScale={yScale}
      xLabel={xLabel}
      yLabel={yLabel}
    >
      {children}
    </Frame>
  );
}
