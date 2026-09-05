"use client";

import * as React from "react";
import {
  Plot,
  PlotTitle,
  PlotCanvas,
  PlotXAxis,
  PlotYAxis,
  PlotGrid,
  PlotData,
  PlotFunction,
  PlotLegend,
  PlotControls,
  PlotSlider,
  type LineProps,
  type LineVariant,
  type LegacyPlotProps,
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
  variant?: LineVariant;
  line?: Omit<LineProps, "data" | "xScale" | "yScale" | "defined">;
}

export interface FunctionPlotProps
  extends Omit<LegacyPlotProps, "children" | "className"> {
  curves: readonly FunctionCurve[];
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
  xScaleType,
  yScaleType,
  xLogBase,
  yLogBase,
  xLabel,
  yLabel,
  xTickFormat,
  yTickFormat,
  xNumTicks,
  yNumTicks,
  title,
  ...canvasProps
}: FunctionPlotProps) {
  const [parameterValues, setParameterValues] = React.useState<
    Record<string, ParameterValues>
  >({});
  return (
    <Plot
      xDomain={xDomain}
      yDomain={yDomain}
      xScaleType={xScaleType}
      yScaleType={yScaleType}
      xLogBase={xLogBase}
      yLogBase={yLogBase}
      className={className}
    >
      {title && <PlotTitle>{title}</PlotTitle>}
      <PlotCanvas {...canvasProps} className={plotClassName}>
        <PlotGrid xNumTicks={xNumTicks} yNumTicks={yNumTicks} />
        <PlotXAxis
          label={xLabel}
          tickFormat={xTickFormat}
          numTicks={xNumTicks}
        />
        <PlotYAxis
          label={yLabel}
          tickFormat={yTickFormat}
          numTicks={yNumTicks}
        />
        <PlotData>
          {curves.map((curve, index) => (
            <PlotFunction
              key={curve.id}
              {...curve.line}
              id={curve.id}
              label={curve.label}
              fn={curve.fn}
              parameters={valuesFor(curve, parameterValues)}
              samples={curve.samples ?? samples}
              variant={curve.line?.variant ?? curve.variant}
              color={`var(--chart-${(index % 5) + 1}, var(--primary))`}
            />
          ))}
        </PlotData>
      </PlotCanvas>
      {showLegend && <PlotLegend />}
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
    </Plot>
  );
}
