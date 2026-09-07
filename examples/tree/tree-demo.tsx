"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tree, type TreeItem } from "@/registry/tree/components/tree";

export const description = "A collapsible file explorer with selection, keyboard navigation, and optional dragging or held-Space sorting.";
const initialItems: TreeItem[] = [
  { id: "components", label: "components", parentId: null },
  { id: "ui", label: "ui", parentId: "components" },
  { id: "button", label: "button.tsx", parentId: "ui" },
  { id: "card", label: "card.tsx", parentId: "ui" },
  { id: "dialog", label: "dialog.tsx", parentId: "ui" },
  { id: "login", label: "login-form.tsx", parentId: "components" },
  { id: "lib", label: "lib", parentId: null },
  { id: "utils", label: "utils.ts", parentId: "lib" },
  { id: "api", label: "api.ts", parentId: "lib" },
  { id: "hooks", label: "hooks", parentId: null },
  { id: "media-query", label: "use-media-query.ts", parentId: "hooks" },
  { id: "app", label: "app.tsx", parentId: null },
  { id: "package", label: "package.json", parentId: null },
  { id: "readme", label: "README.md", parentId: null },
];

export function TreeDemo() {
  const [items, setItems] = useState(initialItems);
  const [sortable, setSortable] = useState(true);
  return <div className="grid w-full max-w-xl items-start gap-6 sm:grid-cols-2">
    <Card size="sm" className="gap-2">
      <CardHeader><CardTitle>Explorer</CardTitle></CardHeader>
      <CardContent><Tree defaultItems={initialItems} aria-label="File explorer" /></CardContent>
    </Card>
    <div className="space-y-3">
      <Card size="sm" className="gap-2">
        <CardHeader><CardTitle>Organise</CardTitle></CardHeader>
        <CardContent><Tree items={items} onItemsChange={setItems} sortable={sortable} aria-label="Organise files" /></CardContent>
      </Card>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sortable} onChange={(event) => setSortable(event.target.checked)} />Enable sorting</label>
      <p className="text-sm text-muted-foreground">{sortable ? "Drag rows or hold Space and use arrows to move them. Drop near an edge to reorder, or in the centre to nest." : "Click folders to expand or collapse. Use arrow keys to explore."}</p>
    </div>
  </div>;
}
