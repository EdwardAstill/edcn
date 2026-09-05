import { describe, expect, test } from "bun:test";

import { sampleFunction } from "../../registry/plot/ui/function-plot";

describe("sampleFunction", () => {
  test("samples a parameterized function across both domain bounds", () => {
    const points = sampleFunction(
      (x, parameters) => parameters.amplitude! * x,
      [-1, 1],
      { amplitude: 2 },
      3,
    );

    expect(points).toEqual([
      [-1, -2],
      [0, 0],
      [1, 2],
    ]);
  });

  test("uses at least two samples", () => {
    expect(sampleFunction((x) => x, [0, 1], {}, 1)).toEqual([
      [0, 0],
      [1, 1],
    ]);
  });

  test("turns evaluation errors and non-finite values into gaps", () => {
    const errors = sampleFunction(() => {
      throw new Error("outside domain");
    }, [0, 1]);
    const infinities = sampleFunction(() => Number.POSITIVE_INFINITY, [0, 1]);

    expect(Number.isNaN(errors[0]![1])).toBe(true);
    expect(Number.isNaN(infinities[0]![1])).toBe(true);
  });
});
