import type { ContinuousScale } from "@/registry/plot/lib/scales";

export type Point = readonly [x: number, y: number];
export type LineInterpolation =
  | "linear"
  | "step-before"
  | "step-after"
  | "monotone";

/** Build separate paths for finite runs; invalid data never joins across a gap. */
export function linePath(
  data: readonly Point[],
  xScale: ContinuousScale,
  yScale: ContinuousScale,
  defined: (point: Point, index: number) => boolean = ([x, y]) =>
    Number.isFinite(x) && Number.isFinite(y),
  interpolation: LineInterpolation = "linear",
) {
  const segments: Point[][] = [];
  let segment: Point[] = [];
  data.forEach((point, index) => {
    const mapped: Point = [xScale(point[0]), yScale(point[1])];
    if (!defined(point, index) || !mapped.every(Number.isFinite)) {
      if (segment.length) segments.push(segment);
      segment = [];
    } else segment.push(mapped);
  });
  if (segment.length) segments.push(segment);
  return segments.map((points) => segmentPath(points, interpolation)).join(" ");
}

function segmentPath(points: Point[], interpolation: LineInterpolation) {
  const first = points[0]!;
  let path = `M ${first[0]} ${first[1]}`;
  const slopes = points
    .slice(1)
    .map(
      (point, index) =>
        (point[1] - points[index]![1]) / (point[0] - points[index]![0]),
    );
  const direction = Math.sign((points[1]?.[0] ?? first[0]) - first[0]);
  const monotone =
    interpolation === "monotone" &&
    slopes.every(Number.isFinite) &&
    points
      .slice(1)
      .every(
        (point, index) => Math.sign(point[0] - points[index]![0]) === direction,
      );
  // Harmonic-mean tangents preserve local extrema without introducing overshoot.
  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0] ?? 0;
    if (index === points.length - 1) return slopes[index - 1]!;
    const left = slopes[index - 1]!;
    const right = slopes[index]!;
    return left * right <= 0 ? 0 : 2 / (1 / left + 1 / right);
  });
  for (let index = 1; index < points.length; index++) {
    const [x, y] = points[index]!;
    const [px, py] = points[index - 1]!;
    if (interpolation === "step-before") path += ` L ${px} ${y} L ${x} ${y}`;
    else if (interpolation === "step-after")
      path += ` L ${x} ${py} L ${x} ${y}`;
    else if (monotone) {
      const third = (x - px) / 3;
      path += ` C ${px + third} ${py + third * tangents[index - 1]!} ${x - third} ${y - third * tangents[index]!} ${x} ${y}`;
    } else path += ` L ${x} ${y}`;
  }
  return path;
}
