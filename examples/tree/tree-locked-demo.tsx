"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tree, type TreeItem } from "@/registry/tree/components/tree";

export const description = "Lock individual files or folders without locking their contents. Try dragging or held-Space sorting, then toggle the selected item's lock.";

const initialItems: TreeItem[] = [
  { id: "src", label: "src", parentId: null, isBranch: true, locked: true },
  { id: "app", label: "app.tsx", parentId: "src" },
  { id: "styles", label: "styles.css", parentId: "src" },
  { id: "assets", label: "assets", parentId: null, isBranch: true },
  { id: "logo", label: "logo.svg", parentId: "assets" },
  { id: "package", label: "package.json", parentId: null, locked: true },
  { id: "notes", label: "notes.md", parentId: null },
];

export function TreeLockedDemo() {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState("src");
  const selected = items.find((item) => item.id === selectedId)!;

  return <div className="w-full max-w-md space-y-4">
    <p className="text-sm text-muted-foreground">The locked src folder and package.json cannot be moved. Try moving app.tsx out of src, or notes.md into it.</p>
    <Tree items={items} onItemsChange={setItems} selectedId={selectedId} onSelectedIdChange={setSelectedId} sortable aria-label="Tree with move locks" />
    <div className="space-y-2">
      <p className="text-sm">Selected: <span className="font-medium">{selected.label}</span></p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setItems((previous) => previous.map((item) => item.id === selectedId ? { ...item, locked: !item.locked } : item))}>
          {selected.locked ? "Unlock selected" : "Lock selected"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setItems(initialItems); setSelectedId("src"); }}>Reset items</Button>
      </div>
    </div>
    <p className="text-sm text-muted-foreground">Drag a row onto a folder's centre to nest it, or near an edge to reorder. Keyboard: hold Space and use Up/Down to reorder, Right to nest, or Left to move out. Locks only apply to the item itself, not its children.</p>
  </div>;
}
