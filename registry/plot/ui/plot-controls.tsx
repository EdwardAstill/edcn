"use client";

import * as React from "react";
import { cn } from "cn";
import { Slider } from "@/components/ui/slider";

export function PlotControls({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="plot-controls"
      className={cn("grid w-full min-w-0 gap-5", className)}
    />
  );
}

export interface PlotSliderProps {
  label: React.ReactNode;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function PlotSlider({
  label,
  value,
  onValueChange,
  min,
  max,
  step,
  formatValue = String,
  id,
  className,
  disabled,
}: PlotSliderProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const labelId = `${inputId}-label`;
  const outputId = `${inputId}-value`;
  return (
    <div className={cn("grid min-w-0 gap-3", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label id={labelId} htmlFor={inputId} className="text-sm">
          {label}
        </label>
        <output
          id={outputId}
          htmlFor={inputId}
          className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs tabular-nums text-foreground"
        >
          {formatValue(value)}
        </output>
      </div>
      <Slider
        thumbAlignment="center"
        id={inputId}
        aria-labelledby={labelId}
        aria-describedby={outputId}
        value={[value]}
        onValueChange={(next) =>
          onValueChange(Array.isArray(next) ? next[0]! : next)
        }
        min={min}
        max={max}
        step={step ?? (Math.abs(max - min) / 100 || 1)}
        disabled={disabled}
      />
    </div>
  );
}
