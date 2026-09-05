import { afterAll, afterEach, beforeAll, expect, test } from "bun:test"
import { act, type ReactElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { DataTable, type DataTableColumn } from "@/registry/table/components/data-table"
import { resizeColumns } from "@/registry/table/lib/column-sizing"
import { installHappyDom } from "../quiz/happy-dom"

let restore: () => void
let root: Root
let container: HTMLDivElement
beforeAll(() => { restore = installHappyDom() })
afterEach(async () => {
  if (root) await act(async () => root.unmount())
  document.body.replaceChildren()
})
afterAll(() => restore())
async function mount(element: ReactElement) {
  container = document.createElement("div")
  document.body.append(container)
  root = createRoot(container)
  await act(async () => root.render(element))
}
const data = [{ id: "a", score: 100 }, { id: "b", score: 9 }, { id: "c", score: 20 }]
const columns: DataTableColumn<typeof data[number]>[] = [
  { id: "id", header: "Name", value: (row) => row.id, width: 160 },
  { id: "score", header: "Score", value: (row) => row.score, sort: true, width: 100 },
]
const rows = () => Array.from(container.querySelectorAll("tbody tr"), (row) => row.textContent)
const sizes = () => Array.from(container.querySelectorAll("col"), (col) => col.style.width)

test("double-click sorts numeric values both ways without mutating data; single click does not sort", async () => {
  await mount(<DataTable data={data} columns={columns} getRowId={(row) => row.id} />)
  const heading = container.querySelector("th button")!
  await act(async () => heading.dispatchEvent(new MouseEvent("click", { bubbles: true })))
  expect(rows()).toEqual(["a100", "b9", "c20"])
  await act(async () => heading.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })))
  expect(rows()).toEqual(["b9", "c20", "a100"])
  expect(heading.closest("th")!.getAttribute("aria-sort")).toBe("ascending")
  await act(async () => heading.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })))
  expect(rows()).toEqual(["a100", "c20", "b9"])
  expect(data.map((row) => row.id)).toEqual(["a", "b", "c"])
})

test("keyboard sorting resets pagination; shrinking data keeps the page in range", async () => {
  const render = (items = data) => <DataTable data={items} columns={columns} getRowId={(row) => row.id} pagination={{ pageSize: 2 }} />
  await mount(render())
  const next = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Next")!
  await act(async () => next.click())
  expect(rows()).toEqual(["c20"])
  await act(async () => container.querySelector("th button")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })))
  expect(rows()).toEqual(["b9", "c20"])
  await act(async () => next.click())
  await act(async () => root.render(render([data[0]])))
  expect(rows()).toEqual(["a100"])
  expect(container.textContent).toContain("Page 1 of 1")
})

test("pointer resizing uses the starting widths, supports Ctrl, and stops after pointer cancellation", async () => {
  await mount(<DataTable data={data} columns={columns} getRowId={(row) => row.id} />)
  const divider = container.querySelector<HTMLElement>('[role="separator"]')!
  let captured = false
  divider.setPointerCapture = () => { captured = true }
  divider.hasPointerCapture = () => captured
  divider.releasePointerCapture = () => { captured = false }
  async function pointer(type: string, x: number, ctrlKey = false) {
    const event = new MouseEvent(type, { bubbles: true, clientX: x, button: 0, ctrlKey })
    Object.defineProperty(event, "pointerId", { value: 1 })
    await act(async () => divider.dispatchEvent(event))
  }
  await pointer("pointerdown", 160)
  await pointer("pointermove", 180)
  expect(sizes()).toEqual(["180px", "100px"])
  await pointer("pointermove", 190)
  expect(sizes()).toEqual(["190px", "100px"])
  await pointer("pointerup", 190)
  expect(captured).toBe(false)
  await pointer("pointerdown", 190, true)
  await pointer("pointermove", 210, true)
  expect(sizes()).toEqual(["210px", "120px"])
  await pointer("pointercancel", 210)
  await pointer("pointermove", 250)
  expect(sizes()).toEqual(["210px", "120px"])
})

test("keyboard resizing respects minimums and divider double-clicks do not sort", async () => {
  await mount(<DataTable data={data} columns={columns} getRowId={(row) => row.id} />)
  const divider = container.querySelectorAll('[role="separator"]')[1]
  await act(async () => divider.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", ctrlKey: true, bubbles: true })))
  expect(sizes()).toEqual(["170px", "110px"])
  await act(async () => divider.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })))
  expect(rows()).toEqual(["a100", "b9", "c20"])
  expect(resizeColumns(columns, {}, "score", -1000, true)).toEqual({ id: 64, score: 64 })
})

test("custom cells and empty results render with the configured caption", async () => {
  await mount(<DataTable data={[]} columns={columns} getRowId={(row) => row.id} caption="Results" emptyMessage="No students" />)
  expect(container.querySelector("caption")!.textContent).toBe("Results")
  expect(rows()).toEqual(["No students"])
  await act(async () => root.render(<DataTable data={data} columns={[{ ...columns[1], cell: (row) => <strong>{row.score}%</strong> }]} getRowId={(row) => row.id} />))
  expect(container.querySelector("td strong")!.textContent).toBe("100%")
})
