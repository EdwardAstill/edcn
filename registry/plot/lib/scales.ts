interface ContinuousScaleBase {
  (value: number): number;
  invert(value: number): number;
  domain: readonly [number, number];
  range: readonly [number, number];
}

export interface LinearScale extends ContinuousScaleBase {
  type: "linear";
}

export interface LogScale extends ContinuousScaleBase {
  type: "log";
  base: number;
}

export type ContinuousScale = LinearScale | LogScale;

export interface OrdinalScale<T extends string | number = string | number> {
  (value: T): number;
  domain: readonly T[];
  range: readonly [number, number];
  bandwidth: number;
  type: "ordinal";
}

export type Scale = ContinuousScale | OrdinalScale;

function makeLinear(
  domain: readonly [number, number],
  range: readonly [number, number],
): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const domainSpan = d1 - d0;

  const fn = (value: number) =>
    domainSpan === 0
      ? (r0 + r1) / 2
      : ((value - d0) / domainSpan) * (r1 - r0) + r0;

  const result = fn as LinearScale;
  result.invert = (value) =>
    r1 === r0 ? d0 : ((value - r0) / (r1 - r0)) * domainSpan + d0;
  result.domain = domain;
  result.range = range;
  result.type = "linear";
  return result;
}

function makeLog(
  domain: readonly [number, number],
  range: readonly [number, number],
  base: number,
): LogScale {
  const [d0, d1] = domain;
  if (d0 <= 0 || d1 <= 0) {
    throw new Error(`scale.log: domain values must be > 0, got [${d0}, ${d1}]`);
  }
  if (base <= 1) {
    throw new Error(`scale.log: base must be > 1, got ${base}`);
  }

  const logBase = Math.log(base);
  const logD0 = Math.log(d0) / logBase;
  const logD1 = Math.log(d1) / logBase;
  const [r0, r1] = range;

  const fn = (value: number) => {
    const logValue = Math.log(value) / logBase;
    return logD1 === logD0
      ? (r0 + r1) / 2
      : ((logValue - logD0) / (logD1 - logD0)) * (r1 - r0) + r0;
  };

  const result = fn as LogScale;
  result.invert = (value) => {
    const logValue =
      r1 === r0 ? logD0 : ((value - r0) / (r1 - r0)) * (logD1 - logD0) + logD0;
    return Math.pow(base, logValue);
  };
  result.domain = domain;
  result.range = range;
  result.type = "log";
  result.base = base;
  return result;
}

function makeOrdinal<T extends string | number>(
  domain: readonly T[],
  range: readonly [number, number],
): OrdinalScale<T> {
  const [r0, r1] = range;
  const bandwidth = domain.length === 0 ? 0 : (r1 - r0) / domain.length;

  const fn = (value: T) => {
    const index = domain.indexOf(value);
    if (index === -1) {
      throw new Error(
        `scale.ordinal: value ${String(value)} not in domain [${domain.join(", ")}]`,
      );
    }
    return r0 + index * bandwidth + bandwidth / 2;
  };

  const result = fn as OrdinalScale<T>;
  result.domain = domain;
  result.range = range;
  result.bandwidth = bandwidth;
  result.type = "ordinal";
  return result;
}

export const scale = {
  linear({
    domain,
    range,
  }: {
    domain: readonly [number, number];
    range: readonly [number, number];
  }): LinearScale {
    return makeLinear(domain, range);
  },

  log({
    domain,
    range,
    base = 10,
  }: {
    domain: readonly [number, number];
    range: readonly [number, number];
    base?: number;
  }): LogScale {
    return makeLog(domain, range, base);
  },

  ordinal<T extends string | number>({
    domain,
    range,
  }: {
    domain: readonly T[];
    range: readonly [number, number];
  }): OrdinalScale<T> {
    return makeOrdinal(domain, range);
  },
};
