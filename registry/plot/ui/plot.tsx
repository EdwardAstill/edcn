"use client";

import * as React from "react";
import {
  type LinearScale,
  type LogScale,
  type ContinuousScale,
  type OrdinalScale,
  type Scale,
  scale,
} from "@/registry/plot/lib/scales";
import { ticks } from "@/registry/plot/lib/ticks";
import {
  type Point,
  type LineInterpolation,
  linePath,
} from "@/registry/plot/lib/paths";
import {
  type ParameterValues,
  dataExtent,
  type BinCounts,
  binCounts,
  sampleFunction,
} from "@/registry/plot/lib/data";
import {
  type PlotMargin,
  type PlotRenderArgs,
  type FrameProps,
  Frame,
  type LegacyPlotProps,
  LegacyPlot,
} from "@/registry/plot/ui/plot-frame";
import {
  type AxisProps,
  Axis,
  type PlotAxisProps,
  PlotXAxis,
  PlotYAxis,
  PlotGrid,
} from "@/registry/plot/ui/plot-axis";
import {
  type LineVariant,
  lineVariants,
  type LineProps,
  Line,
  type PlotLineProps,
  PlotLine,
  type PlotFunctionProps,
  PlotFunction,
} from "@/registry/plot/ui/plot-line";
import {
  type ScatterProps,
  Scatter,
  type PlotScatterProps,
  PlotScatter,
} from "@/registry/plot/ui/plot-scatter";
import {
  type HistogramProps,
  Histogram,
  type PlotHistogramProps,
  PlotHistogram,
} from "@/registry/plot/ui/plot-histogram";
import {
  type HeatmapProps,
  Heatmap,
  type PlotHeatmapProps,
  PlotHeatmap,
} from "@/registry/plot/ui/plot-heatmap";
import {
  type PlotReferenceLineProps,
  PlotReferenceLine,
} from "@/registry/plot/ui/plot-reference-line";
import { PlotLegend } from "@/registry/plot/ui/plot-legend";
import {
  PlotControls,
  type PlotSliderProps,
  PlotSlider,
} from "@/registry/plot/ui/plot-controls";
import {
  PlotRootContext,
  PlotCanvasContext,
  usePlotRoot,
  usePlot,
  type PlotSeriesMetadata,
  type PlotMarkerType,
} from "@/registry/plot/ui/plot-context";

// Export local bindings: shadcn preserves install targets for imports, but not direct re-exports.
export {
  type LinearScale,
  type LogScale,
  type ContinuousScale,
  type OrdinalScale,
  type Scale,
  scale,
  ticks,
  type Point,
  type LineInterpolation,
  linePath,
  type ParameterValues,
  dataExtent,
  type BinCounts,
  binCounts,
  sampleFunction,
  type PlotMargin,
  type PlotRenderArgs,
  type FrameProps,
  Frame,
  type LegacyPlotProps,
  type AxisProps,
  Axis,
  type PlotAxisProps,
  PlotXAxis,
  PlotYAxis,
  PlotGrid,
  type LineVariant,
  lineVariants,
  type LineProps,
  Line,
  type PlotLineProps,
  PlotLine,
  type PlotFunctionProps,
  PlotFunction,
  type ScatterProps,
  Scatter,
  type PlotScatterProps,
  PlotScatter,
  type HistogramProps,
  Histogram,
  type PlotHistogramProps,
  PlotHistogram,
  type HeatmapProps,
  Heatmap,
  type PlotHeatmapProps,
  PlotHeatmap,
  type PlotReferenceLineProps,
  PlotReferenceLine,
  PlotLegend,
  PlotControls,
  type PlotSliderProps,
  PlotSlider,
  usePlot,
  type PlotMarkerType,
};

export interface PlotRootProps extends React.ComponentProps<"div"> {
  xDomain: readonly [number, number];
  yDomain: readonly [number, number];
  xScaleType?: "linear" | "log";
  yScaleType?: "linear" | "log";
  xLogBase?: number;
  yLogBase?: number;
  width?: never;
}

export type PlotProps = PlotRootProps | LegacyPlotProps;

export function Plot(props: PlotProps) {
  // The original width/height API remains available for existing consumers.
  if (props.width !== undefined)
    return <LegacyPlot {...(props as LegacyPlotProps)} />;
  return <PlotRoot {...(props as PlotRootProps)} />;
}

function PlotRoot({
  xDomain,
  yDomain,
  xScaleType = "linear",
  yScaleType = "linear",
  xLogBase = 10,
  yLogBase = 10,
  children,
  className,
  ...props
}: PlotRootProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const [titlePresent, setTitlePresent] = React.useState(false);
  const [descriptionPresent, setDescriptionPresent] = React.useState(false);
  const [series, setSeries] = React.useState<PlotSeriesMetadata[]>([]);
  const registerSeries = React.useCallback((next: PlotSeriesMetadata) => {
    setSeries((current) => {
      const index = current.findIndex((item) => item.id === next.id);
      if (index === -1) return [...current, next];
      if (
        Object.keys(next).every(
          (key) =>
            current[index]![key as keyof PlotSeriesMetadata] ===
            next[key as keyof PlotSeriesMetadata],
        )
      )
        return current;
      return current.map((item, i) => (i === index ? next : item));
    });
  }, []);
  const unregisterSeries = React.useCallback((id: string) => {
    setSeries((current) => current.filter((item) => item.id !== id));
  }, []);
  return (
    <PlotRootContext.Provider
      value={{
        xDomain,
        yDomain,
        xScaleType,
        yScaleType,
        xLogBase,
        yLogBase,
        titleId,
        descriptionId,
        titlePresent,
        descriptionPresent,
        setTitlePresent,
        setDescriptionPresent,
        series,
        registerSeries,
        unregisterSeries,
      }}
    >
      <div
        {...props}
        className={`grid min-w-0 gap-4 ${className ?? ""}`.trim()}
      >
        {children}
      </div>
    </PlotRootContext.Provider>
  );
}

export function PlotTitle({ className, ...props }: React.ComponentProps<"h3">) {
  const { titleId, setTitlePresent } = usePlotRoot();
  React.useEffect(() => {
    setTitlePresent(true);
    return () => setTitlePresent(false);
  }, [setTitlePresent]);
  return (
    <h3
      {...props}
      id={titleId}
      className={`text-base font-semibold ${className ?? ""}`.trim()}
    />
  );
}

export function PlotDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const { descriptionId, setDescriptionPresent } = usePlotRoot();
  React.useEffect(() => {
    setDescriptionPresent(true);
    return () => setDescriptionPresent(false);
  }, [setDescriptionPresent]);
  return (
    <p
      {...props}
      id={descriptionId}
      className={`text-sm text-muted-foreground ${className ?? ""}`.trim()}
    />
  );
}

export interface PlotCanvasProps extends React.ComponentProps<"svg"> {
  width?: number;
  height?: number;
  margin?: PlotMargin;
}

export function PlotCanvas({
  width = 640,
  height = 360,
  margin,
  children,
  style,
  ...props
}: PlotCanvasProps) {
  const root = usePlotRoot();
  const resolved = { top: 20, right: 24, bottom: 58, left: 64, ...margin };
  const innerWidth = Math.max(0, width - resolved.left - resolved.right);
  const innerHeight = Math.max(0, height - resolved.top - resolved.bottom);
  const xScale =
    root.xScaleType === "log"
      ? scale.log({
          domain: root.xDomain,
          range: [0, innerWidth],
          base: root.xLogBase,
        })
      : scale.linear({ domain: root.xDomain, range: [0, innerWidth] });
  const yScale =
    root.yScaleType === "log"
      ? scale.log({
          domain: root.yDomain,
          range: [innerHeight, 0],
          base: root.yLogBase,
        })
      : scale.linear({ domain: root.yDomain, range: [innerHeight, 0] });
  return (
    <PlotCanvasContext.Provider
      value={{ xScale, yScale, innerWidth, innerHeight }}
    >
      <svg
        role="img"
        aria-label="Plot"
        aria-labelledby={root.titlePresent ? root.titleId : undefined}
        aria-describedby={
          root.descriptionPresent ? root.descriptionId : undefined
        }
        {...props}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{ display: "block", width: "100%", height: "auto", ...style }}
      >
        <g transform={`translate(${resolved.left}, ${resolved.top})`}>
          {children}
        </g>
      </svg>
    </PlotCanvasContext.Provider>
  );
}

export function PlotData({ children, ...props }: React.ComponentProps<"g">) {
  const { innerWidth, innerHeight } = usePlot();
  const clipId = React.useId();
  return (
    <g {...props}>
      <defs>
        <clipPath id={clipId}>
          <rect width={innerWidth} height={innerHeight} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{children}</g>
    </g>
  );
}
