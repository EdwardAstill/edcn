# Table

A data table with a permanently sticky first column, resizable columns,
double-click sorting, a sticky header, and optional client-side pagination.

## Install

```sh
bunx shadcn@latest add EdwardAstill/edcn/data-table
```

The item installs the shared shadcn `table` and `button` dependencies. Table
primitives in the root `components/ui/` folder are preview infrastructure only.

## Usage

```tsx
import { DataTable, type DataTableColumn } from "@/components/table/data-table"

type Student = { id: string; name: string; score: number }

const columns: DataTableColumn<Student>[] = [
  { id: "name", header: "Name", value: (row) => row.name, width: 200, sort: true },
  {
    id: "score",
    header: "Score",
    value: (row) => row.score,
    cell: (row) => <strong>{row.score}%</strong>,
    width: 140,
    minWidth: 80,
    sort: true,
  },
]

export function Results({ students }: { students: Student[] }) {
  return (
    <div className="h-[400px] w-full min-w-0">
      <DataTable
        data={students}
        columns={columns}
        getRowId={(row) => row.id}
        caption="Student results"
        pagination={{ pageSize: 10 }}
        className="h-full"
      />
    </div>
  )
}
```

## Interactions

- The first displayed column stays at the left edge during horizontal scrolling.
- Double-click a sortable heading to sort ascending, then descending. A single
  click leaves the order unchanged. Enter or Space on the heading also sorts.
- Drag the divider at a heading's right edge to resize that column.
- Hold Control when starting the drag to change every column by the same pixel
  amount. Each column clamps independently at its minimum width. The modifier is
  fixed for the duration of the drag.
- Focus a divider and press Left/Right to resize by 10px. Control resizes all
  columns. Pointer cancellation ends resizing and keeps the last applied widths.

## API and sizing

`DataTableColumn<TData>` defines `id`, `header`, optional `value`, `cell`, `sort`,
`width`, and `minWidth`. Column IDs must be unique and stable. `getRowId` must
return a unique stable ID for each row.

`value` supplies the raw string, number, boolean, or null used for display and
sorting. `cell` overrides display only. `sort: true` enables numeric comparison
for numbers and text comparison for other non-null values; nulls sort last in
ascending order and first in descending order. A comparator `(a, b) => number`
can replace this behavior and enable sorting without a `value` function.
Sorting copies the data and returns to the first page.

Column widths are pixels: 160 by default, with a default minimum of 64. Explicit
minimums have a 40px floor so controls remain usable. Widths are initial values;
user resizing is retained by column ID for the lifetime of the component.
Columns keep their widths even if their total is smaller than the viewport.
When wider, they scroll inside the frame. Long cell content is truncated; use a
custom cell renderer for content that needs another presentation.

The parent controls the available height and width. Use `className="h-full"`
inside a parent with a defined height, and `min-w-0` / `min-h-0` where needed in
flex or grid layouts. Without a constrained height, the table grows with its
rows. The header is sticky by default (`stickyHeader={false}` disables this);
pagination sits outside the scroll viewport. The first column is always sticky,
even when resized wider than the viewport, in which case it covers the visible
space. There is no automatic unpinning or shrinking.

`pagination={{ pageSize: 10 }}` enables pagination. Omit it to show all rows.
`emptyMessage` defaults to “No results.” `caption` supplies an accessible table
name. `className` styles the outer frame.

## Files

- `components/data-table.tsx`: public types, sorting, pagination, and rendering.
- `hooks/use-column-resize.ts`: pointer capture and keyboard resizing.
- `lib/column-sizing.ts`: default widths and minimum-width calculations.
- `../../examples/table/table-demo.tsx`: constrained preview with both scroll axes.

This first version uses local state and renders the visible rows directly;
it does not include virtualization, server-side sorting, editing, or pin menus.
