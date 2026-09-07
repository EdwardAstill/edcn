import { FunctionPlot } from "@/registry/plot/components/function-plot";

export const description =
  "A wave explorer with a formula key and integrated parameter sliders.";

export function FunctionPlotDemo() {
  return (
    <div className="bg-muted/20 p-4 sm:p-6">
      <FunctionPlot
        height={300}
        xDomain={[-Math.PI * 2, Math.PI * 2]}
        yDomain={[-3, 3]}
        xLabel="Phase (rad)"
        yLabel="Amplitude"
        xTicks={[-2 * Math.PI, -Math.PI, 0, Math.PI, 2 * Math.PI]}
        yTicks={[-3, -1.5, 0, 1.5, 3]}
        xTickFormat={(x) =>
          Math.abs(x) < 0.001
            ? "0"
            : `${x < 0 ? "−" : ""}${Math.abs(x / Math.PI) === 1 ? "" : Number(Math.abs(x / Math.PI).toFixed(2))}π`
        }
        title="Harmonic motion"
        description="Explore how amplitude, frequency, and phase shape a sine wave."
        curves={[
          {
            id: "wave",
            label: (
              <span className="font-serif text-base">
                <var>f</var>(<var>x</var>) = <var>A</var> sin(<var>ωx</var> +{" "}
                <var>φ</var>)
              </span>
            ),
            fn: (x, p) => p.amplitude! * Math.sin(p.frequency! * x + p.phase!),
            parameters: {
              amplitude: {
                label: "Amplitude · A",
                value: 1.5,
                min: 0,
                max: 3,
                step: 0.1,
                formatValue: (n) => n.toFixed(1),
              },
              frequency: {
                label: "Frequency · ω",
                value: 1,
                min: 0.5,
                max: 3,
                step: 0.1,
                formatValue: (n) => n.toFixed(1),
              },
              phase: {
                label: "Phase · φ",
                value: 0,
                min: -Math.PI,
                max: Math.PI,
                step: Math.PI / 20,
                formatValue: (n) => `${Number((n / Math.PI).toFixed(2))}π`,
              },
            },
          },
          {
            id: "reference",
            label: (
              <span className="font-serif text-base">
                <var>g</var>(<var>x</var>) = sin(<var>x</var>)
              </span>
            ),
            fn: (x) => Math.sin(x),
            variant: "dashed",
            line: { stroke: "var(--chart-2)", strokeWidth: 1.5 },
          },
        ]}
      />
    </div>
  );
}
