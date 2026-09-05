"use client";

// Compatibility entry point. Keep the implementation first in registry.json:
// shadcn resolves duplicate basenames in manifest order.
import {
  FunctionPlot,
  sampleFunction,
  type ParameterValues,
  type ParameterDefinition,
  type FunctionCurve,
  type FunctionPlotProps,
} from "@/registry/plot/components/function-plot";

export {
  FunctionPlot,
  sampleFunction,
  type ParameterValues,
  type ParameterDefinition,
  type FunctionCurve,
  type FunctionPlotProps,
};
