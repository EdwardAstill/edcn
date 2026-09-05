"use client"

import { DataTable, type DataTableColumn } from "@/registry/table/components/data-table"

export const description = "Sticky first column, double-click sorting, and draggable dividers. Hold Ctrl while starting a drag to resize every column."

type Student = { id: string; name: string; unit: string; score: number; attendance: number; status: string }
const students: Student[] = Array.from({ length: 36 }, (_, index) => ({
  id: String(index),
  name: `${["Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey"][index % 6]} ${["Chen", "Patel", "Smith", "Wilson", "Lee", "Brown"][Math.floor(index / 6)]}`,
  unit: ["Mathematics", "Computer Science", "Physics"][index % 3],
  score: 55 + (index * 17) % 46,
  attendance: 70 + (index * 7) % 31,
  status: index % 5 === 0 ? "Awaiting review" : "Complete",
}))
const columns: DataTableColumn<Student>[] = [
  { id: "name", header: "Student", value: (row) => row.name, sort: true, width: 190 },
  { id: "unit", header: "Unit", value: (row) => row.unit, sort: true, width: 220 },
  { id: "score", header: "Score", value: (row) => row.score, cell: (row) => <strong>{row.score}%</strong>, sort: true, width: 140 },
  { id: "attendance", header: "Attendance", value: (row) => row.attendance, cell: (row) => `${row.attendance}%`, sort: true, width: 160 },
  { id: "status", header: "Status", value: (row) => row.status, sort: true, width: 190 },
]

export function TableDemo() {
  return <div className="w-full min-w-0 space-y-3">
    <p className="text-sm text-muted-foreground">Double-click headings to sort. Drag dividers to resize; hold Ctrl to resize all columns. The first column stays visible when scrolling.</p>
    <div className="h-[360px] w-full max-w-3xl min-w-0">
      <DataTable data={students} columns={columns} getRowId={(row) => row.id} pagination={{ pageSize: 12 }} caption="Student results" className="h-full" />
    </div>
  </div>
}
