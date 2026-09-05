import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { installHappyDom } from "../quiz/happy-dom";
import {
  Plot,
  PlotTitle,
  PlotDescription,
  PlotCanvas,
  PlotXAxis,
  PlotYAxis,
  PlotData,
  PlotLine,
  PlotFunction,
  PlotScatter,
  PlotHistogram,
  PlotHeatmap,
  PlotReferenceLine,
  PlotLegend,
  PlotControls,
  PlotSlider,
  Line,
} from "@/registry/plot/ui/plot";
import { FunctionPlot } from "@/registry/plot/components/function-plot";

let restoreDom: () => void;
const roots: Root[] = [];
beforeAll(() => {
  restoreDom = installHappyDom("https://plot.test/");
});
afterEach(async () => {
  await act(async () => {
    roots.splice(0).forEach((root) => root.unmount());
  });
  document.body.replaceChildren();
});
afterAll(() => restoreDom());

async function mount(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(element));
  return { container, root };
}

function canvas(children: React.ReactNode) {
  return (
    <PlotCanvas
      width={200}
      height={120}
      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
    >
      {children}
    </PlotCanvas>
  );
}

test("composed plots use shared scales, visible labels, and a unique data clip", async () => {
  const { container } = await mount(
    <Plot xDomain={[0, 10]} yDomain={[0, 10]}>
      <PlotTitle>Measurements</PlotTitle>
      <PlotDescription>Two observations</PlotDescription>
      {canvas(
        <>
          <PlotXAxis label="Time" />
          <PlotYAxis label="Value" />
          <PlotData>
            <PlotLine
              id="line"
              label="Measured"
              data={[
                [0, 0],
                [10, 10],
              ]}
              strokeStyle="dash-dot"
              marker="diamond"
              color="red"
            />
          </PlotData>
        </>,
      )}
      <PlotLegend />
    </Plot>,
  );
  const svg = container.querySelector('svg[role="img"]')!;
  expect(container.querySelector("h3")?.textContent).toBe("Measurements");
  expect(svg.getAttribute("aria-labelledby")).toBe(
    container.querySelector("h3")!.id,
  );
  expect(svg.getAttribute("aria-describedby")).toBe(
    container.querySelector("p")!.id,
  );
  expect(
    container
      .querySelector('[data-plot-series="line"] path')
      ?.getAttribute("d"),
  ).toBe("M 0 100 L 180 0");
  const clip = container.querySelector("clipPath")!;
  expect(
    container.querySelector("g[clip-path]")?.getAttribute("clip-path"),
  ).toBe(`url(#${clip.id})`);
  expect(clip.querySelector("rect")?.getAttribute("width")).toBe("180");
  const legend = container.querySelector("ul")!;
  expect(legend.textContent).toBe("Measured");
  expect(legend.querySelector("line")?.getAttribute("stroke-dasharray")).toBe(
    "8 4 1 4",
  );
  expect(legend.querySelector("path")?.getAttribute("fill")).toBe("red");
});

test("legend metadata follows updates and conditional series inside custom components", async () => {
  function Series({ show, color }: { show: boolean; color: string }) {
    return (
      <>
        <PlotLine
          id="line"
          label={color}
          color={color}
          data={[
            [0, 0],
            [1, 1],
          ]}
        />
        {show && (
          <PlotScatter
            id="points"
            label="Points"
            data={[[0, 0]]}
            marker="square"
          />
        )}
      </>
    );
  }
  const view = (show: boolean, color: string) => (
    <React.StrictMode>
      <Plot xDomain={[0, 1]} yDomain={[0, 1]}>
        {canvas(
          <PlotData>
            <Series show={show} color={color} />
          </PlotData>,
        )}
        <PlotLegend />
      </Plot>
    </React.StrictMode>
  );
  const { container, root } = await mount(view(true, "red"));
  expect(container.querySelectorAll("li")).toHaveLength(2);
  await act(async () => root.render(view(false, "blue")));
  expect(container.querySelectorAll("li")).toHaveLength(1);
  expect(container.querySelector("li")?.textContent).toBe("blue");
  expect(container.querySelector("li line")?.getAttribute("stroke")).toBe(
    "blue",
  );
});

test("a controlled slider changes a function path and its formatted output", async () => {
  function Interactive() {
    const [amplitude, setAmplitude] = React.useState(1);
    return (
      <Plot xDomain={[0, 1]} yDomain={[0, 3]}>
        {canvas(
          <PlotData>
            <PlotFunction id="wave" fn={(x) => amplitude * x} samples={2} />
          </PlotData>,
        )}
        <PlotControls>
          <PlotSlider
            label="Amplitude"
            min={0}
            max={3}
            step={0.1}
            value={amplitude}
            onValueChange={setAmplitude}
            formatValue={(value) => `${value.toFixed(1)} m`}
          />
        </PlotControls>
      </Plot>
    );
  }
  const { container } = await mount(<Interactive />);
  const before = container.querySelector("path")!.getAttribute("d");
  const input = container.querySelector("input")!;
  expect(container.querySelector("label")?.htmlFor).toBe(input.id);
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, "2");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(container.querySelector("output")?.textContent).toBe("2.0 m");
  expect(container.querySelector("path")!.getAttribute("d")).not.toBe(before);
});

test("histograms, heatmaps and reference lines align with canvas coordinates", async () => {
  const { container } = await mount(
    <Plot xDomain={[0, 10]} yDomain={[0, 4]}>
      {canvas(
        <PlotData>
          <PlotHistogram id="hist" values={[0, 1, 5, 10]} bins={2} gap={0} />
          <PlotHeatmap
            id="heat"
            data={[
              [0, 1],
              [2, 3],
            ]}
            colorScale={(value) => `rgb(${value * 255},0,0)`}
          />
          <PlotReferenceLine y={2} />
        </PlotData>,
      )}
    </Plot>,
  );
  const bars = container.querySelectorAll('[data-plot-series="hist"] rect');
  expect(bars[0]!.getAttribute("x")).toBe("0");
  expect(bars[0]!.getAttribute("y")).toBe("50");
  expect(bars[0]!.getAttribute("width")).toBe("90");
  expect(bars[0]!.getAttribute("height")).toBe("50");
  expect(bars[1]!.getAttribute("x")).toBe("90");
  const cells = container.querySelectorAll('[data-plot-series="heat"] rect');
  expect(cells).toHaveLength(4);
  expect(cells[0]!.getAttribute("y")).toBe("50");
  expect(cells[0]!.getAttribute("width")).toBe("90");
  expect(cells[0]!.getAttribute("height")).toBe("50");
  expect(container.querySelector("line")?.getAttribute("y1")).toBe("50");
});

test("logarithmic data layers discard invalid coordinates and share the log scales", async () => {
  const { container } = await mount(
    <Plot
      xDomain={[1, 100]}
      yDomain={[1, 100]}
      xScaleType="log"
      yScaleType="log"
    >
      {canvas(
        <PlotData>
          <PlotLine
            id="line"
            data={[
              [1, 1],
              [-1, 2],
              [10, 10],
              [100, 100],
            ]}
            marker="circle"
          />
          <PlotScatter
            id="scatter"
            data={[
              [0, 5],
              [10, 10],
            ]}
          />
          <PlotHeatmap
            id="heat"
            data={[[1], [2]]}
            xDomain={[1, 100]}
            colorScale={() => "blue"}
          />
        </PlotData>,
      )}
    </Plot>,
  );
  expect(
    container
      .querySelector('[data-plot-series="line"] path')
      ?.getAttribute("d"),
  ).toBe("M 0 100 M 90 50 L 180 0");
  expect(
    container.querySelectorAll('[data-plot-series="line"] circle'),
  ).toHaveLength(3);
  expect(
    container.querySelectorAll('[data-plot-series="scatter"] circle'),
  ).toHaveLength(1);
  const cells = container.querySelectorAll('[data-plot-series="heat"] rect');
  expect(Number(cells[0]!.getAttribute("width"))).toBeGreaterThan(
    Number(cells[1]!.getAttribute("width")),
  );
});

test("legacy render-prop plots and the FunctionPlot shortcut remain usable", async () => {
  const markup = renderToStaticMarkup(
    <Plot
      width={200}
      height={120}
      xDomain={[0, 1]}
      yDomain={[0, 1]}
      title="Legacy"
    >
      {({ xScale, yScale }) => (
        <Line
          data={[
            [0, 0],
            [1, 1],
          ]}
          xScale={xScale}
          yScale={yScale}
        />
      )}
    </Plot>,
  );
  expect(markup).toContain('aria-label="Legacy"');
  const changes: number[] = [];
  const { container } = await mount(
    <FunctionPlot
      width={200}
      height={120}
      xDomain={[0, 1]}
      yDomain={[0, 3]}
      title="Shortcut"
      onParameterChange={(_, values) => changes.push(values.amplitude!)}
      curves={[
        {
          id: "wave",
          label: "Wave",
          fn: (x, p) => p.amplitude! * x,
          parameters: { amplitude: { value: 1, min: 0, max: 3 } },
        },
      ]}
    />,
  );
  expect(container.querySelector("h3")?.textContent).toBe("Shortcut");
  expect(container.querySelectorAll("li")).toHaveLength(1);
  const input = container.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, "2");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(changes).toEqual([2]);
});

test("optional headings leave no dangling ARIA references and plots keep independent IDs", async () => {
  const view = (show: boolean) => (
    <>
      {[0, 1].map((index) => (
        <Plot key={index} xDomain={[0, 1]} yDomain={[0, 1]}>
          {show && (
            <>
              <PlotTitle>Plot {index}</PlotTitle>
              <PlotDescription>Details</PlotDescription>
            </>
          )}
          {canvas(<PlotData />)}
        </Plot>
      ))}
    </>
  );
  const { container, root } = await mount(view(true));
  const canvases = container.querySelectorAll('svg[role="img"]');
  expect(canvases[0]!.getAttribute("aria-labelledby")).not.toBe(
    canvases[1]!.getAttribute("aria-labelledby"),
  );
  const clips = container.querySelectorAll("clipPath");
  expect(clips[0]!.id).not.toBe(clips[1]!.id);
  await act(async () => root.render(view(false)));
  for (const svg of canvases) {
    expect(svg.hasAttribute("aria-labelledby")).toBe(false);
    expect(svg.hasAttribute("aria-describedby")).toBe(false);
    expect(svg.getAttribute("aria-label")).toBe("Plot");
  }
});
