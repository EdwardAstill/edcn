"use client";

import * as React from "react";
import { CartesianGrid, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  PlotFunction,
  PlotControls,
  PlotSlider,
  type PlotFunctionProps,
} from "@/registry/plot/ui/plot";
import { sampleFunction, type ParameterValues } from "@/registry/plot/lib/data";

export { sampleFunction, type ParameterValues };

export interface ParameterDefinition {
  value: number;
  min: number;
  max: number;
  step?: number;
  label?: string;
  formatValue?: (value: number) => string;
}

export interface FunctionCurve {
  id: string;
  label?: string;
  fn: (x: number, parameters: Readonly<ParameterValues>) => number;
  parameters?: Record<string, ParameterDefinition>;
  samples?: number;
  variant?: "solid" | "dashed" | "dotted" | "dash-dot";
  line?: Omit<PlotFunctionProps, "fn" | "parameters" | "xDomain" | "samples">;
}

export interface FunctionPlotProps {
  curves: readonly FunctionCurve[];
  xDomain: readonly [number, number];
  yDomain: readonly [number, number];
  width?: number;
  height?: number;
  margin?: React.ComponentProps<typeof LineChart>["margin"];
  xScaleType?: "linear" | "log";
  yScaleType?: "linear" | "log";
  xLabel?: string;
  yLabel?: string;
  xTickFormat?: (value: number) => string;
  yTickFormat?: (value: number) => string;
  xNumTicks?: number;
  yNumTicks?: number;
  title?: string;
  description?: string;
  samples?: number;
  showControls?: boolean;
  showLegend?: boolean;
  className?: string;
  plotClassName?: string;
  controlsClassName?: string;
  onParameterChange?: (
    curveId: string,
    parameters: Readonly<ParameterValues>,
  ) => void;
}

function valuesFor(
  curve: FunctionCurve,
  values: Record<string, ParameterValues>,
) {
  return Object.fromEntries(
    Object.entries(curve.parameters ?? {}).map(([name, definition]) => [
      name,
      values[curve.id]?.[name] ?? definition.value,
    ]),
  );
}

export function FunctionPlot({
  curves,
  samples = 400,
  showControls = true,
  showLegend = true,
  className,
  plotClassName,
  controlsClassName,
  onParameterChange,
  xDomain,
  yDomain,
  width = 640,
  height = 360,
  margin = { top: 16, right: 24, bottom: 20, left: 8 },
  xScaleType = "linear",
  yScaleType = "linear",
  xLabel,
  yLabel,
  xTickFormat,
  yTickFormat,
  xNumTicks,
  yNumTicks,
  title,
  description,
}: FunctionPlotProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const [parameterValues, setParameterValues] = React.useState<
    Record<string, ParameterValues>
  >({});
  const config: ChartConfig = Object.fromEntries(
    curves.map((curve, index) => [
      curve.id,
      {
        label: curve.label ?? curve.id,
        color: curve.line?.stroke ?? `var(--chart-${(index % 5) + 1})`,
      },
    ]),
  );
  return (
    <div className={`grid min-w-0 gap-4 ${className ?? ""}`.trim()}>
      {title && (
        <h3 id={titleId} className="text-base font-semibold">
          {title}
        </h3>
      )}
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <ChartContainer
        config={config}
        className={plotClassName}
        style={{ height, width: "100%" }}
        initialDimension={{ width, height }}
      >
        <LineChart
          accessibilityLayer
          aria-label={title ? undefined : "Function plot"}
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          margin={margin}
        >
          <CartesianGrid />
          <XAxis
            dataKey="x"
            type="number"
            domain={[...xDomain]}
            scale={xScaleType}
            allowDataOverflow
            tickFormatter={xTickFormat}
            tickCount={xNumTicks}
            label={
              xLabel
                ? { value: xLabel, position: "insideBottom", offset: -12 }
                : undefined
            }
          />
          <YAxis
            type="number"
            domain={[...yDomain]}
            scale={yScaleType}
            allowDataOverflow
            tickFormatter={yTickFormat}
            tickCount={yNumTicks}
            label={
              yLabel
                ? { value: yLabel, angle: -90, position: "insideLeft" }
                : undefined
            }
          />
          {curves.map((curve) => (
            <PlotFunction
              key={curve.id}
              name={curve.id}
              stroke={config[curve.id]!.color}
              strokeDasharray={
                curve.variant === "dashed"
                  ? "6 4"
                  : curve.variant === "dotted"
                    ? "2 4"
                    : curve.variant === "dash-dot"
                      ? "6 4 2 4"
                      : undefined
              }
              {...curve.line}
              fn={curve.fn}
              parameters={valuesFor(curve, parameterValues)}
              xDomain={xDomain}
              samples={curve.samples ?? samples}
              defined={(x, y) =>
                (xScaleType !== "log" || x > 0) &&
                (yScaleType !== "log" || y > 0) &&
                (!curve.line?.defined || curve.line.defined(x, y))
              }
            />
          ))}
          <ChartTooltip content={<ChartTooltipContent />} />
          {showLegend && (
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          )}
        </LineChart>
      </ChartContainer>
      {showControls &&
        curves.some(
          (curve) => Object.keys(curve.parameters ?? {}).length > 0,
        ) && (
          <PlotControls className={controlsClassName}>
            {curves
              .filter((curve) => Object.keys(curve.parameters ?? {}).length > 0)
              .map((curve) => (
                <fieldset key={curve.id} className="grid gap-4">
                  <legend className="mb-2 text-sm font-medium">
                    {curve.label ?? curve.id}
                  </legend>
                  {Object.entries(curve.parameters ?? {}).map(
                    ([name, definition]) => (
                      <PlotSlider
                        key={name}
                        {...definition}
                        label={definition.label ?? name}
                        value={valuesFor(curve, parameterValues)[name]!}
                        onValueChange={(value) => {
                          const next = {
                            ...valuesFor(curve, parameterValues),
                            [name]: value,
                          };
                          setParameterValues((current) => ({
                            ...current,
                            [curve.id]: next,
                          }));
                          onParameterChange?.(curve.id, next);
                        }}
                      />
                    ),
                  )}
                </fieldset>
              ))}
          </PlotControls>
        )}
    </div>
  );
}
