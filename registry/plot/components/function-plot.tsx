"use client";

import * as React from "react";
import { CartesianGrid, LineChart, XAxis, YAxis } from "recharts";
import { cn } from "cn";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
  label?: React.ReactNode;
  formatValue?: (value: number) => string;
}

export interface FunctionCurve {
  id: string;
  label?: React.ReactNode;
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
  xTicks?: number[];
  yTicks?: number[];
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
  margin = { top: 12, right: 16, bottom: 4, left: 0 },
  xScaleType = "linear",
  yScaleType = "linear",
  xLabel,
  yLabel,
  xTickFormat,
  yTickFormat,
  xNumTicks,
  yNumTicks,
  xTicks,
  yTicks,
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
  const dashFor = (curve: FunctionCurve) =>
    curve.line?.strokeDasharray ??
    (curve.variant === "dashed"
      ? "6 4"
      : curve.variant === "dotted"
        ? "2 4"
        : curve.variant === "dash-dot"
          ? "6 4 2 4"
          : undefined);
  const hasControls =
    showControls &&
    curves.some((curve) => Object.keys(curve.parameters ?? {}).length > 0);
  return (
    <Card
      className={cn(
        "@container/plot min-w-0 w-full [--card-spacing:--spacing(6)]",
        className,
      )}
    >
      {(title || description) && (
        <CardHeader className="gap-1.5">
          {title && (
            <h3 id={titleId} className="text-base font-semibold tracking-tight">
              {title}
            </h3>
          )}
          {description && (
            <p
              id={descriptionId}
              className="text-sm leading-relaxed text-muted-foreground"
            >
              {description}
            </p>
          )}
        </CardHeader>
      )}
      <CardContent className="min-w-0">
        <ChartContainer
          config={config}
          className={cn("aspect-auto w-full", plotClassName)}
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
            <CartesianGrid vertical={false} />
            <XAxis
              type="number"
              dataKey="x"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)" }}
              allowDataOverflow
              tickMargin={10}
              minTickGap={24}
              height={54}
              label={
                xLabel
                  ? {
                      value: xLabel,
                      position: "insideBottom",
                      offset: 0,
                      fill: "var(--muted-foreground)",
                    }
                  : undefined
              }
              domain={[...xDomain]}
              scale={xScaleType}
              tickFormatter={xTickFormat}
              tickCount={xNumTicks ?? 5}
              ticks={xTicks}
            />
            <YAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)" }}
              allowDataOverflow
              tickMargin={8}
              width={64}
              label={
                yLabel
                  ? {
                      value: yLabel,
                      position: "insideLeft",
                      angle: -90,
                      offset: 4,
                      style: { textAnchor: "middle" },
                      fill: "var(--muted-foreground)",
                    }
                  : undefined
              }
              domain={[...yDomain]}
              scale={yScaleType}
              tickFormatter={yTickFormat}
              tickCount={yNumTicks ?? 5}
              ticks={yTicks}
            />
            {curves.map((curve) => (
              <PlotFunction
                key={curve.id}
                name={curve.id}
                stroke={config[curve.id]!.color}
                strokeDasharray={dashFor(curve)}
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
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="[&_.font-mono]:ml-4"
                  nameKey="name"
                  labelFormatter={(_, payload) => {
                    const x = payload[0]?.payload?.x;
                    return typeof x === "number"
                      ? `${xLabel ?? "x"} = ${xTickFormat ? xTickFormat(x) : Number(x.toFixed(3))}`
                      : null;
                  }}
                />
              }
            />
            {showLegend && (
              <ChartLegend
                content={
                  <ChartLegendContent
                    nameKey="name"
                    className="flex-wrap gap-x-5 gap-y-2 pt-4"
                  />
                }
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
      {hasControls && (
        <CardFooter>
          <div className={cn("grid w-full gap-5", controlsClassName)}>
            {curves
              .filter((curve) => Object.keys(curve.parameters ?? {}).length > 0)
              .map((curve) => (
                <fieldset key={curve.id} className="grid min-w-0 gap-4">
                  <legend className="mb-4 text-xs font-medium text-muted-foreground">
                    {curve.label ?? curve.id}
                  </legend>
                  <div className="grid gap-5 @min-[480px]/plot:grid-cols-3">
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
                  </div>
                </fieldset>
              ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
