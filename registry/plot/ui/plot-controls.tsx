"use client";

import * as React from "react";

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

export interface PlotSliderProps
  extends Omit<
    React.ComponentProps<"input">,
    | "type"
    | "value"
    | "defaultValue"
    | "onChange"
    | "onInput"
    | "min"
    | "max"
    | "step"
  > {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
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
  ...props
}: PlotSliderProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={inputId} className="text-sm">
          {label}
        </label>
        <output
          htmlFor={inputId}
          className="font-mono text-sm tabular-nums text-muted-foreground"
        >
          {formatValue(value)}
        </output>
      </div>
      <input
        {...props}
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step ?? (Math.abs(max - min) / 100 || 1)}
        value={value}
        onInput={(event) => onValueChange(event.currentTarget.valueAsNumber)}
        className={`h-2 w-full cursor-pointer accent-primary ${className ?? ""}`.trim()}
      />
    </div>
  );
}
