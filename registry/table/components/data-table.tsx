"use client"

import { useId, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useColumnResize } from "@/registry/table/hooks/use-column-resize"
import { columnWidth, type ColumnSizing } from "@/registry/table/lib/column-sizing"

export type DataTableColumn<TData> = ColumnSizing & {
  header: ReactNode
  value?: (row: TData) => string | number | boolean | null
  cell?: (row: TData) => ReactNode
  sort?: boolean | ((a: TData, b: TData) => number)
}

export type SortState = { columnId: string; direction: "asc" | "desc" } | null

export type DataTableProps<TData> = {
  data: TData[]
  columns: DataTableColumn<TData>[]
  getRowId: (row: TData) => string
  pagination?: { pageSize: number }
  emptyMessage?: string
  caption?: string
  stickyHeader?: boolean
  className?: string
}

function compareValues(a: string | number | boolean | null, b: string | number | boolean | null) {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b))
}

export function DataTable<TData>({
  data, columns, getRowId, pagination, emptyMessage = "No results.", caption,
  stickyHeader = true, className,
}: DataTableProps<TData>) {
  const instructionsId = useId()
  const [sort, setSort] = useState<SortState>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const { widths, getResizeProps } = useColumnResize(columns)
  const sizes = columns.map((column) => columnWidth(column, widths))
  const sortedColumn = columns.find((column) => column.id === sort?.columnId)
  const rows = sortedColumn?.sort && sort
    ? [...data].sort((a, b) => {
      const comparison = typeof sortedColumn.sort === "function"
        ? sortedColumn.sort(a, b)
        : compareValues(sortedColumn.value?.(a) ?? null, sortedColumn.value?.(b) ?? null)
      return sort.direction === "asc" ? comparison : -comparison
    })
    : data
  const pageSize = pagination && Number.isFinite(pagination.pageSize) ? Math.max(1, Math.floor(pagination.pageSize)) : Math.max(1, rows.length)
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(pageIndex, pageCount - 1)
  const visibleRows = pagination ? rows.slice(page * pageSize, (page + 1) * pageSize) : rows

  function toggleSort(columnId: string) {
    setSort((current) => ({ columnId, direction: current?.columnId === columnId && current.direction === "asc" ? "desc" : "asc" }))
    setPageIndex(0)
  }

  return (
    <div data-slot="data-table" className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border bg-background", className)}>
      <p id={instructionsId} className="sr-only">
        Double-click a sortable heading, or focus it and press Enter or Space, to sort.
        Drag a column divider to resize. Hold Control when starting the drag to resize all columns.
        Focus a divider and use Left or Right arrow keys to resize, with Control for all columns.
      </p>
      <div data-slot="data-table-viewport" className="relative isolate min-h-0 min-w-0 flex-1 overflow-auto" tabIndex={0} role="region" aria-label={caption ?? "Data table"} aria-describedby={instructionsId}>
        {/* Use the shared row/cell primitives with one scroll viewport; Table adds its own overflow wrapper. */}
        <table className="table-fixed border-separate border-spacing-0 text-sm" style={{ width: sizes.reduce((sum, size) => sum + size, 0) }}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <colgroup>{columns.map((column, index) => <col key={column.id} style={{ width: sizes[index] }} />)}</colgroup>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => {
                const sortable = Boolean(column.sort && (column.value || typeof column.sort === "function"))
                const direction = sort?.columnId === column.id ? sort.direction : null
                return (
                  <TableHead key={column.id} scope="col" aria-sort={sortable ? direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none" : undefined}
                    className={cn("relative border-r border-b border-border bg-background p-0", stickyHeader && "sticky top-0 z-20", index === 0 && "sticky left-0 z-10", index === 0 && stickyHeader && "z-30")}>
                    {sortable ? (
                      <button type="button" className="flex h-10 w-full items-center gap-2 overflow-hidden px-3 pr-4 text-left outline-offset-[-3px] select-none"
                        aria-describedby={instructionsId}
                        onDoubleClick={() => toggleSort(column.id)}
                        onKeyDown={(event) => {
                          if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
                            event.preventDefault()
                            toggleSort(column.id)
                          }
                        }}>
                        <span className="truncate">{column.header}</span>
                      </button>
                    ) : <div className="truncate px-3 pr-4">{column.header}</div>}
                    <span {...getResizeProps(column, typeof column.header === "string" ? column.header : column.id)}
                      className="absolute inset-y-0 right-0 z-40 w-2 cursor-col-resize touch-none hover:bg-primary/20 focus-visible:bg-primary/20 focus-visible:outline focus-visible:outline-ring" />
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((column, index) => (
                  <TableCell key={column.id} className={cn("overflow-hidden border-r border-b border-border px-3", index === 0 && "sticky left-0 z-10 bg-background")}>
                    <div className="truncate">{column.cell ? column.cell(row) : String(column.value?.(row) ?? "")}</div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {visibleRows.length === 0 && <TableRow><TableCell colSpan={Math.max(1, columns.length)} className="h-24 border-r border-b border-border text-center text-muted-foreground">{emptyMessage}</TableCell></TableRow>}
          </TableBody>
        </table>
      </div>
      {pagination && <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t p-2">
        <span className="text-sm text-muted-foreground" aria-live="polite">Page {page + 1} of {pageCount} · {rows.length} rows</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPageIndex(page - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPageIndex(page + 1)}>Next</Button>
        </div>
      </div>}
    </div>
  )
}
