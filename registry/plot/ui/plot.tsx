"use client";

import {
  PlotFunction,
  type PlotFunctionProps,
} from "@/registry/plot/ui/plot-line";
import {
  PlotControls,
  PlotSlider,
  type PlotSliderProps,
} from "@/registry/plot/ui/plot-controls";
import {
  PlotHeatmap,
  type PlotHeatmapProps,
} from "@/registry/plot/ui/plot-heatmap";
import {
  sampleFunction,
  binCounts,
  dataExtent,
  type Point,
  type ParameterValues,
  type BinCounts,
} from "@/registry/plot/lib/data";

// Local bindings let the shadcn CLI rewrite imports to installation destinations.
export {
  PlotFunction,
  type PlotFunctionProps,
  PlotControls,
  PlotSlider,
  type PlotSliderProps,
  PlotHeatmap,
  type PlotHeatmapProps,
  sampleFunction,
  binCounts,
  dataExtent,
  type Point,
  type ParameterValues,
  type BinCounts,
};
