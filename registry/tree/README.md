# Tree

A file-explorer tree built from shadcn `Collapsible` and `Button`, with chevrons, folder/file icons, and nested indentation. Selection and keyboard navigation extend the collapsible pattern; sorting adapted from [keyboard-sortable-tree](https://github.com/EdwardAstill/keyboard-sortable-tree) is opt-in.

```sh
bunx shadcn@latest add EdwardAstill/edcn/tree
```

```tsx
import { Tree, type TreeItem } from "@/components/tree/tree";

const items: TreeItem[] = [
  { id: "fruit", label: "Fruit", parentId: null },
  { id: "apple", label: "Apple", parentId: "fruit" },
];

<Tree defaultItems={items} aria-label="Produce" />
<Tree defaultItems={items} sortable onItemsChange={saveItems} />
```

Use `items` with `onItemsChange` for controlled state, or `defaultItems` for internal state. `defaultItems` is read on mount. Each item has a unique string `id`, a string `label`, and a `parentId` pointing to an existing item or `null` for the root. Supply an acyclic hierarchy. Array order determines sibling order. Branches start expanded; collapse state is kept internally and does not change the item data.

`sortable` defaults to `false`: no pointer sorting or keyboard sorting. It can be toggled at runtime; disabling it cancels an active drag. Click a branch row to select and toggle it; click a leaf to select it. Enter toggles a focused branch, and Space does too when sorting is off. Both modes support click selection, up/down navigation through visible rows, and Home/End. Left collapses the focused branch; Right expands it. Neither key changes selection, and both do nothing on leaves. Collapsing a parent preserves its descendants’ collapse state. The tree exposes levels, sibling positions, selection, and live movement announcements to assistive technology.

With sorting enabled:

- Hold Space and press up/down to reorder siblings, right to nest under the previous sibling, or left to move out immediately after the parent. Release Space to finish. Keyboard moves take effect immediately. Moving into a collapsed branch expands the destination ancestors so the moved row stays visible.
- Drag a row with mouse, pen, or touch. The top and bottom quarters of a row insert before/after it; the middle half nests inside it. Insertion lines preview before/after placement; an underlined label previews nesting. Children move with their parent.
- To return a child to the root, drop above or below a root row. Drops onto the moving branch or its descendants are rejected.
- Pointer changes commit only on release over a valid target. Escape, pointer cancellation, focus leaving the window, or releasing outside a target cancels the drag. A small movement threshold avoids accidental drags. In sorting mode, touch gestures on rows move items; scroll from outside the tree.

Rows have no borders or focus rings: selection is gray, and a grabbed row is black with white text.

Use `className`, `[data-selected]`, `[data-grabbed]`, and `[data-drop-position]` for styling. The example in `examples/tree/tree-demo.tsx` demonstrates browsing and controlled sorting. Branches are items with children; leaves become branches when another item is nested inside them. The kit ships its component and pure tree helpers, and installs the official `button` and `collapsible` basics plus `lucide-react` as dependencies. It has no drag-and-drop package dependency.

## Controlled composition

Use `selectedId` / `onSelectedIdChange` and `collapsedIds` / `onCollapsedIdsChange`
to connect an external selection and expansion model. `collapsedIds` is a set of
closed item IDs. `renderItem(item)` replaces row contents, and `getItemProps(item)`
adds row attributes, refs, and event handlers; prevent default in a key handler
to override built-in navigation. The tree still owns row styling and structure.
Mark an item `isBranch: true` to retain folder semantics when its children are
empty, filtered out, or loaded later. Nested search uses these controls to render
the same Explorer with search filtering and match-only Tab navigation.
