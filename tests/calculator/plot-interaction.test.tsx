import { expect, test } from 'bun:test'
import { act } from 'react'
import type { SolverClient } from '@/registry/calculator/lib/solver/client'
import { installHappyDom } from '../quiz/happy-dom'

test('switching to Plot uses ticked equations and updates validation on checkbox changes', async () => {
  const restore = installHappyDom()
  const { createRoot } = await import('react-dom/client')
  const { ScientificCalculator } = await import('@/registry/calculator/components/scientific-calculator')
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const snapshot = { phase: 'idle' } as const
  const client: SolverClient = {
    start() {}, dispose() {}, retry() {},
    subscribe: () => () => {}, getSnapshot: () => snapshot,
    solve: async () => ({ status: 'error', message: 'Not used' }),
  }
  async function click(selector: string) {
    const element = container.querySelector<HTMLElement>(selector)
    expect(element).not.toBeNull()
    await act(async () => element!.click())
  }
  async function add(source: string) {
    const input = container.querySelector<HTMLInputElement>('#calculator-expression')!
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(input, source)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await click('[aria-label="Add relation"]')
  }
  try {
    await act(async () => root.render(<ScientificCalculator solverClient={client} />))
    await add('x+y=1')
    await add('z=2')
    const plotTab = [...container.querySelectorAll<HTMLElement>('[role="tab"]')].find((tab) => tab.textContent === ' Plot')
      ?? [...container.querySelectorAll<HTMLElement>('[role="tab"]')].find((tab) => tab.textContent?.trim() === 'Plot')
    expect(plotTab).toBeDefined()
    await act(async () => plotTab!.click())
    expect(container.textContent).toContain('Cannot plot more than 2 variables')
    await click('[aria-label="Enable z=2"]')
    expect(container.textContent).not.toContain('Cannot plot more than 2 variables')
    expect(container.querySelector('[data-slot="chart"]')).not.toBeNull()
    await click('[aria-label="Enable x+y=1"]')
    expect(container.textContent).toContain('No relations selected')
    await click('[aria-label="Edit x+y=1"]')
    expect(container.querySelector<HTMLInputElement>('#calculator-expression')?.value).toBe('x+y=1')
  } finally {
    await act(async () => root.unmount())
    restore()
  }
})
