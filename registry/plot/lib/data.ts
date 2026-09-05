import type { Point } from "@/registry/plot/lib/paths";
export type ParameterValues = Record<string, number>;

export function dataExtent(
  data: readonly (readonly number[])[],
  invalid: (value: number) => boolean = (value) => !Number.isFinite(value),
): readonly [number, number] | null {
  let low = Infinity;
  let high = -Infinity;

  for (const column of data) {
    for (const value of column) {
      if (invalid(value)) continue;
      if (value < low) low = value;
      if (value > high) high = value;
    }
  }

  return Number.isFinite(low) && Number.isFinite(high) ? [low, high] : null;
}

export interface BinCounts {
  counts: number[];
  low: number;
  high: number;
  binWidth: number;
}

export function binCounts(
  values: readonly number[],
  bins: number,
  domain?: readonly [number, number],
): BinCounts {
  const finite = values.filter(Number.isFinite);
  const binTotal = Number.isFinite(bins) ? Math.floor(bins) : 0;
  if (finite.length === 0 || binTotal <= 0) {
    return { counts: [], low: 0, high: 0, binWidth: 0 };
  }

  const low = domain?.[0] ?? Math.min(...finite);
  const high = domain?.[1] ?? Math.max(...finite);
  const binWidth = (high - low || 1) / binTotal;
  const counts = Array.from({ length: binTotal }, () => 0);

  for (const value of finite) {
    let index = Math.floor((value - low) / binWidth);
    if (value === high) index = binTotal - 1;
    if (index >= 0 && index < binTotal) counts[index]++;
  }

  return { counts, low, high, binWidth };
}

export function sampleFunction(
  fn: (x: number, parameters: Readonly<ParameterValues>) => number,
  domain: readonly [number, number],
  parameters: Readonly<ParameterValues> = {},
  samples = 400,
): Point[] {
  const count = Number.isFinite(samples)
    ? Math.max(2, Math.floor(samples))
    : 400;
  const [start, end] = domain;

  return Array.from({ length: count }, (_, index) => {
    const x = start + (index / (count - 1)) * (end - start);
    try {
      const y = fn(x, parameters);
      return [x, Number.isFinite(y) ? y : Number.NaN] as const;
    } catch {
      return [x, Number.NaN] as const;
    }
  });
}
