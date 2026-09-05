export type ColumnSizing = { id: string; width?: number; minWidth?: number }

export function minimumWidth(column: ColumnSizing) {
  return Number.isFinite(column.minWidth) ? Math.max(40, column.minWidth!) : 64
}

export function columnWidth(column: ColumnSizing, widths: Record<string, number>) {
  const width = widths[column.id] ?? column.width ?? 160
  return Math.max(minimumWidth(column), Number.isFinite(width) ? width : 160)
}

export function resizeColumns(
  columns: ColumnSizing[],
  widths: Record<string, number>,
  columnId: string,
  delta: number,
  all: boolean,
): Record<string, number> {
  return Object.fromEntries(columns.map((column) => [
    column.id,
    Math.max(minimumWidth(column), columnWidth(column, widths) + (all || column.id === columnId ? delta : 0)),
  ]))
}
