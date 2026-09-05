import { FunctionPlot } from "@/registry/plot/components/function-plot";

export const description =
  "Parameterized wave and envelope curves with generated sliders.";

export function FunctionPlotDemo() {
  return (
    <FunctionPlot
      width={640}
      height={360}
      xDomain={[-Math.PI * 2, Math.PI * 2]}
      yDomain={[-3, 3]}
      xLabel="x"
      yLabel="y"
      title="Parameterized functions"
      curves={[
        {
          id: "wave",
          label: "Wave",
          fn: (x, p) => p.amplitude! * Math.sin(p.frequency! * x + p.phase!),
          parameters: {
            amplitude: { value: 1, min: 0, max: 3, step: 0.1 },
            frequency: { value: 1, min: 0.1, max: 5, step: 0.1 },
            phase: { value: 0, min: -Math.PI, max: Math.PI, step: 0.1 },
          },
          line: { stroke: "var(--chart-1)" },
        },
        {
          id: "envelope",
          label: "Envelope",
          fn: (x, p) => p.scale! * Math.exp(-p.decay! * x * x),
          parameters: {
            scale: { value: 2, min: 0, max: 4, step: 0.1 },
            decay: { value: 0.2, min: 0.01, max: 1, step: 0.01 },
          },
          variant: "dashed",
          line: { stroke: "var(--chart-2)" },
        },
      ]}
    />
  );
}
