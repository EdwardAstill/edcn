"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";

export function PlotControls({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={`grid gap-4 rounded-lg border p-4 ${className ?? ""}`.trim()}
    />
  );
}

export interface PlotSliderProps {
  label: string;
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
    <div className={`grid gap-2 ${className ?? ""}`.trim()}>
      <div className="flex items-baseline justify-between gap-4">
        <label id={labelId} htmlFor={inputId} className="text-sm">
          {label}
        </label>
        <output
          id={outputId}
          className="font-mono text-sm tabular-nums text-muted-foreground"
        >
          {formatValue(value)}
        </output>
      </div>
      <Slider
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
