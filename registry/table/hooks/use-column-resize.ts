"use client"

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { columnWidth, minimumWidth, resizeColumns, type ColumnSizing } from "@/registry/table/lib/column-sizing"

export function useColumnResize(columns: ColumnSizing[]) {
  const [widths, setWidths] = useState<Record<string, number>>({})
  const drag = useRef<{
    pointerId: number
    startX: number
    columnId: string
    widths: Record<string, number>
    columns: ColumnSizing[]
    all: boolean
  } | null>(null)

  function finish(event: PointerEvent<HTMLSpanElement>) {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function getResizeProps(column: ColumnSizing, label: string) {
    return {
      role: "separator" as const,
      tabIndex: 0,
      "aria-label": `Resize ${label}`,
      "aria-orientation": "vertical" as const,
      "aria-valuemin": minimumWidth(column),
      "aria-valuenow": columnWidth(column, widths),
      "aria-valuetext": `${columnWidth(column, widths)} pixels`,
      title: "Drag to resize. Hold Ctrl to resize all columns. Arrow keys resize by 10px.",
      onDoubleClick: (event: React.MouseEvent) => event.stopPropagation(),
      onPointerDown(event: PointerEvent<HTMLSpanElement>) {
        if (event.button !== 0 || drag.current) return
        event.preventDefault()
        event.stopPropagation()
        event.currentTarget.focus()
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { pointerId: event.pointerId, startX: event.clientX, columnId: column.id, widths, columns, all: event.ctrlKey }
      },
      onPointerMove(event: PointerEvent<HTMLSpanElement>) {
        const active = drag.current
        if (!active || active.pointerId !== event.pointerId) return
        setWidths(resizeColumns(active.columns, active.widths, active.columnId, event.clientX - active.startX, active.all))
      },
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
      onKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
        event.preventDefault()
        event.stopPropagation()
        setWidths((current) => resizeColumns(columns, current, column.id, event.key === "ArrowRight" ? 10 : -10, event.ctrlKey))
      },
    }
  }

  return { widths, getResizeProps }
}
