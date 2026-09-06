import { describe, expect, test } from "bun:test";
import { binCounts, dataExtent } from "@/registry/plot/lib/data";

describe("plot data helpers", () => {
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
