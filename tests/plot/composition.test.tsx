import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  CartesianGrid,
  ComposedChart,
  Global,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { installHappyDom } from "../quiz/happy-dom";
import { PlotFunction, PlotHeatmap } from "@/registry/plot/ui/plot";
import { FunctionPlot } from "@/registry/plot/components/function-plot";

let restoreDom: () => void;
let previousIsSsr: boolean;
let previousBoundingRect: typeof HTMLElement.prototype.getBoundingClientRect;
let previousResizeObserver: typeof ResizeObserver;
const roots: Root[] = [];
beforeAll(() => {
  restoreDom = installHappyDom("https://plot.test/");
  previousBoundingRect = HTMLElement.prototype.getBoundingClientRect;
  // Happy DOM has no layout. Give the responsive canvas and legend realistic sizes.
  HTMLElement.prototype.getBoundingClientRect = function () {
    const chart = this.classList.contains("recharts-responsive-container");
    const width = chart ? 640 : 40;
    const height = chart ? 360 : 20;
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON() {
        return {};
      },
    };
  };
  previousIsSsr = Global.isSsr;
  Global.isSsr = false;
  previousResizeObserver = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});
afterAll(() => {
  Global.isSsr = previousIsSsr;
  HTMLElement.prototype.getBoundingClientRect = previousBoundingRect;
  globalThis.ResizeObserver = previousResizeObserver;
  restoreDom();
});

async function mount(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(element));
  return { container, root };
}

test("sampled functions compose with native Recharts lines and legends", async () => {
  const { container } = await mount(
    <ChartContainer
      config={{ model: { label: "Model" }, reference: { label: "Reference" } }}
      initialDimension={{ width: 640, height: 360 }}
    >
      <ComposedChart width={640} height={360}>
        <CartesianGrid />
        <XAxis scale="linear" dataKey="x" type="number" domain={[0, 4]} />
        <YAxis scale="linear" domain={[-4, 4]} />
        <PlotFunction
          name="model"
          fn={(x) => (x === 2 ? NaN : x)}
          xDomain={[0, 4]}
          samples={5}
        />
        <Line
          name="reference"
          data={[
            { x: 0, y: 1 },
            { x: 4, y: 1 },
          ]}
          dataKey="y"
          isAnimationActive={false}
        />
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </ComposedChart>
    </ChartContainer>,
  );
  const paths = container.querySelectorAll(".recharts-line-curve");
  expect(paths.length).toBe(2);
  expect(paths[0]!.getAttribute("d")!.match(/M/g)?.length).toBe(2);
  expect(container.textContent).toContain("Model");
  expect(container.textContent).toContain("Reference");
});

test("generated shadcn sliders update curves and report parameter values", async () => {
  const changes: [string, Readonly<Record<string, number>>][] = [];
  const { container } = await mount(
    <FunctionPlot
      title="Wave"
      description="Adjust the amplitude"
      xDomain={[0, 4]}
      yDomain={[0, 12]}
      curves={[
        {
          id: "wave",
          label: "Model",
          fn: (x, p) => x * p.amplitude!,
          samples: 5,
          parameters: {
            amplitude: {
              label: "Amplitude",
              value: 1,
              min: 0,
              max: 3,
              step: 1,
            },
          },
        },
      ]}
      onParameterChange={(id, values) => changes.push([id, values])}
    />,
  );
  const before = container
    .querySelector(".recharts-line-curve")!
    .getAttribute("d");
  expect(container.querySelector("h3")?.textContent).toBe("Wave");
  const slider = container.querySelector('input[type="range"]')!;
  expect(slider).not.toBeNull();
  await act(async () => {
    (slider as HTMLInputElement).focus();
    slider.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  expect(container.querySelector("output")?.textContent).toBe("2");
  expect(changes).toEqual([["wave", { amplitude: 2 }]]);
  expect(
    container.querySelector(".recharts-line-curve")!.getAttribute("d"),
  ).not.toBe(before);
});

test("heatmap cells use Recharts coordinates, skip invalid values, and support clicks", async () => {
  const clicked: number[][] = [];
  const { container } = await mount(
    <ComposedChart width={400} height={300}>
      <XAxis
        dataKey="x"
        scale="linear"
        type="number"
        domain={[0, 2]}
        allowDataOverflow
      />
      <YAxis scale="linear" type="number" domain={[0, 2]} allowDataOverflow />
      <PlotHeatmap
        data={[
          [0, NaN],
          [1, 2],
        ]}
        xDomain={[0, 2]}
        yDomain={[0, 2]}
        colorScale={(t) => (t === 0 ? "red" : "blue")}
        onCellClick={(col, row, value) => clicked.push([col, row, value])}
      />
    </ComposedChart>,
  );
  const cells = container.querySelectorAll(".recharts-reference-area-rect");
  expect(cells.length).toBe(3);
  expect(cells[0]!.getAttribute("fill")).toBe("red");
  await act(async () =>
    cells[0]!.dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );
  expect(clicked).toEqual([[0, 0, 0]]);
});
