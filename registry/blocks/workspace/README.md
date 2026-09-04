# Workspace

An IDE-style workspace system packaged as shadcn-style registry items: tiled
layouts, tab stacks, floating windows, browser popouts, drag & drop docking,
keyboard commands, and state persistence.

Built for React 19 with **zero dependencies beyond React** — the state core is
plain TypeScript, the store is a ~40-line `useSyncExternalStore` binding, and
the UI uses only Tailwind classes.

Run the demo with `bun run dev` and open the **Workspace Demo** block.

## Glossary — Views / Stacks / Surfaces

Three levels, deliberately kept apart (one word per concept):

| Concept | Meaning |
| -------- | ---------------------------------------------------------------------------------------- |
| **View** | WHAT is open (an editor, a calculator). Never knows where it is. A "tab" is just a view placed in a stack. |
| **Stack** | A group of views rendered as tabs. There is exactly **one** stack type; it knows nothing about placement. |
| **Surface** | WHERE a stack lives: a leaf of the tiled tree, a floating window, or a popout browser window. |

The rule that falls out of this: **placement is never a property of content.**
Floating, docking, splitting, and popping out only change state/surfaces — the
view component itself is unaware of any of it.

## Quick start

```tsx
import { Workspace } from "@/registry/blocks/workspace/workspace";
import { createInitialState } from "@/registry/lib/workspace/factory";
import type { WorkspaceViewProps } from "@/registry/hooks/use-workspace";
import { useViewWorkingState } from "@/registry/hooks/use-view-working-state";

function EditorView({ view }: WorkspaceViewProps) {
  // Working state keyed by the view's STABLE id — survives tabs, splits,
  // floats, docks, and popouts, all of which remount the component.
  const [text, setText] = useViewWorkingState(view.id, () => "");
  return <textarea value={text} onChange={(e) => setText(e.target.value)} />;
}

<Workspace
  views={{ editor: EditorView }}
  initialState={createInitialState({
    direction: "horizontal",
    first: { views: [{ type: "editor", title: "Editor" }] },
    second: { views: [{ type: "clock", title: "Clock" }] },
  })}
  config={{ floating: { chrome: "frame", dragModifier: "ctrl" } }}
/>
```

A view component receives `{ view }` (`WorkspaceViewProps`): the view
descriptor with its stable `id`, `type`, and `title`. Register components per
view type via the `views` map.

## Registry items

| Item | Type | Purpose |
| --- | --- | --- |
| `workspace-core` | lib | Framework-agnostic state: types, reducer + model layer, store, factory, config, keymap, drop-edge, persistence |
| `use-workspace` | hook | React bindings: `WorkspaceProvider`, `useWorkspaceState/Dispatch/Store/Config`, `useViewComponent` |
| `use-view-working-state` | hook | Per-view state keyed by view id; survives every placement change |
| `use-workspace-drag` | hook | Drag & drop context; live drop-preview state |
| `workspace-tab-list` | ui | Tab strip; draggable tabs, activate/close |
| `workspace-stack` | ui | Tab strip + active view; drop target for docking |
| `workspace-layout` | ui | Recursively renders the tiled tree with resizable splits |
| `workspace-resize-handle` | ui | Divider: pointer drag, arrow keys, double-click reset |
| `workspace-drop-overlay` | ui | Live "where will it land" preview |
| `workspace-demo` | block | The full `<Workspace>` block plus a functional demo |

## Architecture

```text
registry/blocks/workspace/   <Workspace> — provider + surfaces (tiled, floating, popouts)
registry/ui/                 placement-agnostic primitives (stack, tabs, layout, handles)
registry/hooks/              React bindings (store, keymap, drag, per-view state)
registry/lib/workspace/
  types.ts                   serializable state shape
  actions.ts                 serializable action objects
  reducer.ts                 thin command interpreter
  model/stack.ts             tab ops on one stack record   (add/remove/activate/cycle)
  model/layout.ts            tiled tree surgery            (split, prune, resize)
  model/surface.ts           floating/popout queries + placement lookup
  store.ts                   subscribe/getSnapshot store — shared with popout windows
  factory.ts                 createInitialState(...) builder
  config.ts                  WorkspaceConfig (floating chrome, drag modifier, keymap)
  keymap.ts                  commands + default alt+ combos
  drop-edge.ts               edge-hit math (24% threshold) for drag docking
  persistence.ts             serialize / deserialize with schema validation
```

Dependencies point one way: `model/*` → `types`; `reducer` → `model/*`; hooks
and UI → store/state. Nothing in `lib/` imports React.

## State & actions

State is plain serializable data:

```ts
interface WorkspaceState {
  views: Record<string, WorkspaceView>;       // id, type, title
  stacks: Record<string, TabStack>;           // viewIds + activeViewId
  tiled: LayoutNode;                          // split tree; leaves reference stacks
  activeStackId: string | null;               // focus: open/split target
  floating: Record<string, FloatingSurface>;  // x, y, width, height, zIndex
  popouts: Record<string, PopoutSurface>;     // width, height (serializable facts)
  nextZIndex: number;
}
```

Every transition is a serializable action dispatched to the store:

| Action | Effect |
| --- | --- |
| `view/open` | Open a view into a stack (active stack by default) |
| `view/close` | Close a view; empty stacks are pruned, floating windows/popouts close with their last tab |
| `view/activate` | Make a view the active tab of its stack |
| `stack/split` | Split at a stack; seeds a new view or moves an existing one |
| `layout/resize` | Set a split's ratio (clamped 10–90%) |
| `view/float` | Move a view into a new floating window |
| `view/dock` | Move a floating/popout view back into the tiled tree |
| `view/popout` | Move a view into its own browser window |
| `view/move` | Drag & drop: `center` tabs into a stack, edges split beside it |
| `floating/move` `floating/resize` `floating/focus` `floating/close` | Floating window lifecycle |
| `popout/close` | Close a popout window and its views |

Two invariants the reducer guarantees (fuzzer-enforced): every view lives in
**exactly one** stack, and every stack is reachable from a surface — the tiled
tree, a floating window, or a popout. Empty stacks disappear (the lone empty
root stack is kept so the tiled surface never vanishes).

## Drag & drop

Native HTML5 drag (no libraries), ported from the tiling-tabs behavior:
hovering a stack shows a **live preview** — center means "tab into this
stack", an edge zone (outer 24%) means "split beside it, 50/50". Edge drops
targeting floating windows or popouts degrade to `center`, because those
surfaces host a single unsplittable stack.

## Floating windows

Geometry lives in state, so windows persist and serialize. Chrome (title bar)
is optional via `config.floating.chrome`: `"frame"` adds a draggable title
bar; `"frameless"` moves with the configured `dragModifier` (e.g. hold ctrl
and drag anywhere). Clicking a window brings it to front (`zIndex` from
`nextZIndex`).

## Popouts

`view/popout` hosts a view in a real browser window. State keeps only
serializable facts (`PopoutSurface`); the popouts layer owns the `Window`
handles and renders a second React root bound to the **same store instance**,
so the popout is a live viewport onto one workspace state — edit in either
window and both update. Windows are opened synchronously inside the click
gesture (`requestPopout`) to stay popup-blocker-safe; programmatic surfaces
that the browser refuses roll back automatically. Scope line: HTML5 drag
cannot cross browser windows, so tab dragging between windows is out of scope.

## Persistence

```ts
import { serializeWorkspaceState, deserializeWorkspaceState } from "@/registry/lib/workspace/persistence";

localStorage.setItem("ws", serializeWorkspaceState(state));   // anywhere
const restored = deserializeWorkspaceState(localStorage.getItem("ws") ?? "");
if (restored) store.hydrate(restored);
```

The payload carries a schema version and is structurally validated on load;
corrupt or foreign input deserializes to `null` rather than poisoning the
reducer. View working state (`useViewWorkingState`) is session-level and not
persisted.

## Keyboard

Commands (config, not state) with browser-safe defaults:

| Command | Default |
| --- | --- |
| `view/close` | `alt+w` |
| `view/activate-next` / `view/activate-prev` | `alt+ArrowDown` / `alt+ArrowUp` |
| `view/float` | `alt+f` |
| `view/dock` | `alt+d` |
| `view/popout` | `alt+p` |

Override via `config.keymap` (supports combos like `"mod+shift+e"`). Avoid
combos the browser reserves (`mod+w`, `ctrl+t`); page JavaScript cannot
intercept those.

## Testing

The reducer's invariants are fuzz-tested: random action sequences checked
after every dispatch (no phantom/orphan stacks, no ghost views, `activeViewId`
coherence, every view in exactly one stack).

```bash
bun test scripts/reducer-fuzz.test.ts   # 60 seeds × 40 steps
bun scripts/reducer-fuzz.ts             # full 300 seeds × 40 steps
```

## Demo

`bun run dev` → open the preview at [http://localhost:3000](http://localhost:3000)
and select **Workspace Demo**: editor/calculator/files/clock views whose state
survives every move, a draggable toolbar, live state inspector, and Save /
Load / Reset persistence buttons.
