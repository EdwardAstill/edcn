'use client'

import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { PlotFunction } from '@/registry/plot/ui/plot'
import type { Relation } from '@/registry/calculator/lib/model'
import { PLOT_DOMAIN, preparePlot } from '@/registry/calculator/lib/plot'

export function RelationPlot({ relations }: { relations: readonly Relation[] }) {
  const result = useMemo(() => {
    try {
      return { plot: preparePlot(relations) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unable to plot the selected relations.' }
    }
  }, [relations])

  if (!result.plot) {
    return <Alert variant="destructive" role="alert"><AlertTitle>Cannot plot</AlertTitle><AlertDescription>{result.error}</AlertDescription></Alert>
  }
  const { curves, xLabel, yLabel } = result.plot
  if (curves.length === 0) {
    return <Alert><AlertTitle>No relations selected</AlertTitle><AlertDescription>Tick a saved equation or expression to plot it.</AlertDescription></Alert>
  }
  const config = Object.fromEntries(curves.map((curve, index) => [curve.id, {
    label: curve.label, color: `var(--chart-${index % 5 + 1})`,
  }]))
  return (
    <div className="grid min-w-0 gap-2">
      <ChartContainer config={config} initialDimension={{ width: 480, height: 360 }} style={{ width: '100%', height: 360 }}>
        <LineChart accessibilityLayer aria-label="Selected relations plot" margin={{ top: 16, right: 24, bottom: 20, left: 8 }}>
          <CartesianGrid />
          <XAxis dataKey="x" type="number" domain={PLOT_DOMAIN} allowDataOverflow label={{ value: xLabel, position: 'insideBottom', offset: -12 }} />
          <YAxis type="number" domain={PLOT_DOMAIN} allowDataOverflow label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
          {curves.map((curve) => curve.fn ? (
            <PlotFunction key={curve.id} name={curve.id} fn={curve.fn} xDomain={PLOT_DOMAIN} stroke={config[curve.id]!.color} />
          ) : (
            <Line key={curve.id} name={curve.id} data={curve.data} dataKey="y" type="linear" dot={false} connectNulls={false} isAnimationActive={false} stroke={config[curve.id]!.color} />
          ))}
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        </LineChart>
      </ChartContainer>
      <p className="text-sm text-muted-foreground">Approximate plot from −10 to 10 on each axis.</p>
    </div>
  )
}
