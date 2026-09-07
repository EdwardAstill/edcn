"use client";

import { NestedSearch, type SearchItem } from "@/registry/search/components/nested-search";

export const description = "The same browser for nested records, using a custom preview for each observation.";

type Observation = { species: string; count: number; habitat: string; notes: string };
const items: SearchItem<Observation>[] = [
  { id: "wetlands", label: "Wetlands", children: [
    { id: "north", label: "North shore", children: [
      { id: "swan", label: "Black swan", description: "Morning survey · 06:45", data: { species: "Cygnus atratus", count: 3, habitat: "Reed beds", notes: "Feeding close to the shore. One juvenile accompanied two adults." } },
      { id: "teal", label: "Grey teal", description: "Morning survey · 07:10", data: { species: "Anas gracilis", count: 2, habitat: "Open water", notes: "A pair moving between the reeds and open water." } },
    ] },
    { id: "south", label: "South shore", children: [] },
  ] },
];

export function RecordSearchDemo() {
  return <NestedSearch items={items} defaultMode="miller" defaultSelectedId="swan" aria-label="Field observations"
    renderPreview={(item) => item.data && <div className="mt-6 space-y-6">
      <p className="text-sm italic text-muted-foreground">{item.data.species}</p>
      <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4">
        <div><dt className="text-xs text-muted-foreground">Observed</dt><dd className="mt-1 text-2xl font-semibold">{item.data.count}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Habitat</dt><dd className="mt-2 text-sm">{item.data.habitat}</dd></div>
      </dl>
      <p className="text-sm leading-relaxed">{item.data.notes}</p>
    </div>} />;
}
