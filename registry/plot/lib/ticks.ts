import type {
  Scale,
  OrdinalScale,
  LinearScale,
  LogScale,
} from "@/registry/plot/lib/scales";

/** Compute readable tick values for a linear, logarithmic, or ordinal scale. */
export function ticks<T extends string | number>(
  currentScale: Scale | OrdinalScale<T>,
  count = 5,
): Array<number | string> {
  if (currentScale.type === "ordinal") {
    return [...currentScale.domain] as Array<number | string>;
  }

  if (currentScale.type === "log") {
    return logTicks(currentScale);
  }

  return linearTicks(currentScale, count);
}

function linearTicks(currentScale: LinearScale, count: number): number[] {
  const [first, last] = currentScale.domain;
  const descending = last < first;
  const low = Math.min(first, last);
  const high = Math.max(first, last);
  const span = high - low;
  if (span === 0) return [first];

  const roughStep = span / Math.max(count, 2);
  const magnitude = Math.floor(Math.log10(roughStep));
  const power = Math.pow(10, magnitude);
  const ratio = roughStep / power;
  const multiplier = ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10;
  const step = multiplier * power;
  const start = Math.ceil(low / step) * step;
  const end = Math.floor(high / step) * step;
  const result: number[] = [];
  const steps = Math.round((end - start) / step);

  for (let index = 0; index <= steps; index++) {
    result.push(Number.parseFloat((start + index * step).toPrecision(12)));
  }

  const values = result.length >= 2 ? result : [low, high];
  return descending ? values.reverse() : values;
}

function logTicks(currentScale: LogScale): number[] {
  const [first, last] = currentScale.domain;
  const descending = last < first;
  const low = Math.min(first, last);
  const high = Math.max(first, last);
  const logBase = Math.log(currentScale.base);
  const start = Math.ceil(Math.log(low) / logBase);
  const end = Math.floor(Math.log(high) / logBase);
  const result: number[] = [];

  for (let exponent = start; exponent <= end; exponent++) {
    result.push(Math.pow(currentScale.base, exponent));
  }

  const values = result.length >= 2 ? result : [low, high];
  return descending ? values.reverse() : values;
}
