# Nested search

A browser for nested files, documents, or records, inspired by the local
speed-searcher.nvim picker. Switch between an expandable file tree and Miller
columns without losing the query, selected item, or content preview.

Use the assembled `NestedSearch` component, compose the UI pieces, or use just
the headless hook. The data and navigation layer has no file icons, preview
format, or layout dependency.

```bash
bunx shadcn@latest add EdwardAstill/edcn/nested-search
```

```tsx
import { NestedSearch, type SearchItem } from "@/components/search/nested-search";

const items: SearchItem[] = [
  { id: "notes", label: "Notes", children: [
    { id: "first", label: "First note", content: "Content to preview." },
  ] },
];

export function Library() {
  return <NestedSearch items={items} defaultSelectedId="first" />;
}
```

Each item has a globally unique `id` and a `label`, with optional `description`,
`content` (plain text), and `data` (your payload). `children` denotes a container;
an empty array is an empty container, while omitting it denotes a leaf.
Duplicate IDs throw an error. Supply an acyclic tree in the desired display order.
Treat `items` as immutable when updating the component.

Search uses case-insensitive fuzzy subsequences against complete label paths.
Matching leaves retain their ancestors; matching containers expose their full
subtrees. Results preserve tree order. Both modes search the entire data set,
including collapsed containers. Bold rows are direct matches, preferring name
matches over path-only matches. Clearing search restores manual expansion.

| Prop | Purpose |
| --- | --- |
| `items: SearchItem<T>[]` | Nested data, required |
| `defaultMode` | `"files"` (default) or `"miller"` |
| `defaultSelectedId` | Initial selection; ancestors are expanded automatically |
| `defaultExpandedIds` | Additional containers initially expanded in Files |
| `renderItem(entry, state)` | Replace row contents, including icons and metadata |
| `renderPreview(item)` | Custom leaf preview; use `item.data` for rich records |
| `onSelect(item)` | User selection changes, including containers |
| `onOpen(item)` | Leaf activation by Enter, double-click, or the Open button |
| `className`, `aria-label` | Outer styling and visible/accessibility label |

Selection, query, expansion, and view mode are managed internally. Default props
apply on mount. Preview renderers run only for the selected leaf. For asynchronous
content, return your own component that handles loading, errors, and cancellation.
Strings render as text, never HTML. No filesystem access or content fetching is
performed by this component. All supplied item names/paths are searched in memory.

Use Up/Down in the search input to navigate without leaving it. On rows, Left/Right
collapse/expand the tree or move between Miller levels; Home/End jump within the
current list. Enter browses containers or invokes `onOpen` on leaves. Ctrl+Up/Down
visits direct matches in the current list. Escape clears the query and focuses
search. Horizontal arrows in the input retain normal text editing behavior.

Files mode places the preview beside results on desktop and below them on small
screens. Miller mode always uses three panes: parent items on the left, the
current selection and its siblings in the middle, and children or a leaf preview
on the right. Entering or leaving a container shifts the contents of these fixed
panes, keeping the selection in the middle. At the root, the parent pane stays
empty. The three panes remain side by side at every screen size.

See `examples/search/` for a file library and a typed record browser.

## Build your own interface

Install `EdwardAstill/edcn/search-primitives` for the styled pieces and hook, or
`EdwardAstill/edcn/use-nested-search` for the hook alone. The hook has no shadcn
component or icon dependencies. `nested-search` installs both automatically.

```tsx
import { useNestedSearch } from "@/hooks/search/use-nested-search";
import { SearchInput, SearchResults, SearchPreview } from "@/ui/search/search";
import type { SearchItem } from "@/lib/search/search";

export function TopicBrowser({ items }: { items: SearchItem[] }) {
  const browser = useNestedSearch({ items, defaultMode: "miller" });
  return <section>
    <SearchInput browser={browser} placeholder="Find a topic…" />
    <button onClick={() => browser.setMode(browser.mode === "miller" ? "files" : "miller")}>
      Switch view
    </button>
    <SearchResults
      browser={browser}
      renderItem={({ item }, state) => <span>
        {state.isContainer ? "Topic: " : "Note: "}{item.label}
      </span>}
      preview={<SearchPreview className="p-4">
        {browser.selected?.item.content ?? "Choose a note."}
      </SearchPreview>}
    />
  </section>;
}
```

`SearchInput` accepts native input props, including your own label and placeholder.
Its change and keyboard handlers compose with yours; `preventDefault()` skips
the built-in handler. `SearchResults` owns the default tree/three-pane layout;
its optional `preview` is any React node. `SearchPreview` is only an aside shell:
you control its headings, actions, content, and empty states. All three pieces
accept `className`. They require no context provider.

`renderItem(entry, state)` replaces the entire row interior while the outer row
retains selection, accessibility, and keyboard behavior. State contains
`isContainer`, `isSelected`, `isAncestor`, `isExpanded`, and `isMatch`. Keep row
contents non-interactive; place independent actions in your preview or toolbar.

For a completely custom layout, use the hook directly:

- Read `mode`, `query`, `selected`, `entries`, `visibleEntries`, `columns`,
  `searching`, and `matchCount`. Entries include the original typed item,
  ancestors, depth, and path. Miller `columns` always has parent/current/children
  entries; your renderer puts the leaf preview in the third pane.
- Call `setQuery`, `setMode`, `select(id)`, `setExpanded(id, open)`, `open()`, or
  `focusSearch()`. `select` expands the item's ancestors; active search filtering
  still applies. The hook accepts the same data, default state, and callbacks as
  the assembled component.
- Spread `getInputProps()` onto an input, `getListProps(columnIndex)` onto each
  list div, and `getItemProps(entry)` onto each row div. These provide IDs, ARIA,
  refs, and keyboard/focus handlers. Render each item once per hook instance and
  preserve the returned refs and handlers. `getItemState(entry)` provides row
  state for your own styling. In tree mode, `getListProps()` needs no index.

The course browser in `examples/search/composed-search-demo.tsx` demonstrates
custom rows, a separate toolbar, and a preview without file-specific framing.
