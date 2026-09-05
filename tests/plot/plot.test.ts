import { describe, expect, test } from "bun:test";

import {
  binCounts,
  dataExtent,
  linePath,
  lineVariants,
  scale,
  ticks,
} from "../../registry/plot/ui/plot";

describe("scales", () => {
  test("linear scales map and invert values", () => {
    const x = scale.linear({ domain: [0, 10], range: [0, 100] });
    expect(x(5)).toBe(50);
    expect(x.invert(25)).toBe(2.5);
  });

  test("a constant domain maps to the middle of the range", () => {
    const x = scale.linear({ domain: [4, 4], range: [0, 100] });
    expect(x(4)).toBe(50);
    expect(x.invert(50)).toBe(4);
  });

  test("log ticks respect the configured base", () => {
    const x = scale.log({ domain: [1, 64], range: [0, 100], base: 2 });
    expect(ticks(x)).toEqual([1, 2, 4, 8, 16, 32, 64]);
  });

  test("ordinal scales return band centers", () => {
    const x = scale.ordinal({ domain: ["a", "b"], range: [0, 100] });
    expect(x("a")).toBe(25);
    expect(x("b")).toBe(75);
    expect(x.bandwidth).toBe(50);
  });
});

describe("plot helpers", () => {
  test("linePath starts a new segment after invalid data", () => {
    const x = scale.linear({ domain: [0, 2], range: [0, 20] });
    const y = scale.linear({ domain: [0, 2], range: [20, 0] });
    expect(
      linePath(
        [
          [0, 0],
          [Number.NaN, 1],
          [2, 2],
        ],
        x,
        y,
      ),
    ).toBe("M 0 20 M 20 0");
  });

  test("line variants provide dashed and dotted presets", () => {
    expect(lineVariants.dashed.strokeDasharray).toBe("8 5");
    expect(lineVariants.dotted.strokeLinecap).toBe("round");
  });

  test("dataExtent ignores non-finite cells", () => {
    expect(
      dataExtent([
        [1, Number.NaN],
        [3, Number.POSITIVE_INFINITY],
      ]),
    ).toEqual([1, 3]);
  });

  test("binCounts includes a value on the right edge", () => {
    expect(binCounts([0, 5, 10], 2, [0, 10]).counts).toEqual([1, 2]);
  });

  test("binCounts drops non-finite and out-of-domain values", () => {
    const result = binCounts(
      [-1, 0, 5, 10, 11, Number.NaN, Number.POSITIVE_INFINITY],
      2,
      [0, 10],
    );
    expect(result.counts).toEqual([1, 2]);
  });
});

describe("line interpolation", () => {
  const x = scale.linear({ domain: [0, 2], range: [0, 2] });
  const y = scale.linear({ domain: [0, 2], range: [0, 2] });

  test("step variants change the expected coordinate first", () => {
    expect(
      linePath(
        [
          [0, 0],
          [2, 2],
        ],
        x,
        y,
        undefined,
        "step-before",
      ),
    ).toBe("M 0 0 L 0 2 L 2 2");
    expect(
      linePath(
        [
          [0, 0],
          [2, 2],
        ],
        x,
        y,
        undefined,
        "step-after",
      ),
    ).toBe("M 0 0 L 2 0 L 2 2");
  });

  test("monotone curves preserve extrema and do not bridge missing data", () => {
    const path = linePath(
      [
        [0, 0],
        [1, 2],
        [2, 0],
        [NaN, NaN],
        [0, 1],
      ],
      x,
      y,
      undefined,
      "monotone",
    );
    expect(path).toContain(" C ");
    expect(path).toEndWith("M 0 1");
    const numbers = path
      .split(/[MC L]+/)
      .filter(Boolean)
      .map(Number);
    expect(numbers.every((value) => value >= 0 && value <= 2)).toBe(true);
  });

  test("monotone falls back to straight segments for repeated or unordered x values", () => {
    expect(
      linePath(
        [
          [0, 0],
          [0, 1],
          [1, 2],
        ],
        x,
        y,
        undefined,
        "monotone",
      ),
    ).toBe("M 0 0 L 0 1 L 1 2");
    expect(
      linePath(
        [
          [0, 0],
          [2, 1],
          [1, 2],
        ],
        x,
        y,
        undefined,
        "monotone",
      ),
    ).toBe("M 0 0 L 2 1 L 1 2");
  });

  test("monotone handles descending domains without introducing invalid coordinates", () => {
    const reversed = scale.linear({ domain: [2, 0], range: [0, 2] });
    const path = linePath(
      [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      reversed,
      y,
      undefined,
      "monotone",
    );
    expect(path).toStartWith("M 2 0 C ");
    expect(path).toEndWith("0 2");
    expect(path).not.toContain("NaN");
  });

  test("logarithmic scales split paths at invalid projected coordinates", () => {
    const log = scale.log({ domain: [1, 100], range: [0, 2] });
    expect(
      linePath(
        [
          [1, 0],
          [0, 1],
          [100, 2],
        ],
        log,
        y,
      ),
    ).toBe("M 0 0 M 2 2");
  });
});
