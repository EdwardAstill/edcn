/**
 * Workspace demo — functional test bed (segments 1–3).
 *
 * The views are deliberately real enough to prove the system: their state
 * lives in useViewWorkingState (keyed by view id), so an editor keeps its text and
 * a calculator keeps its display when the view floats, docks, splits, or
 * moves between tabs.
 */

import * as React from "react";

import { GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceProvider } from "@/registry/workspace/hooks/use-workspace";
import {
  useWorkspaceConfig,
  useWorkspaceDispatch,
  useWorkspaceState,
  useWorkspaceStore,
  type WorkspaceViewProps,
} from "@/registry/workspace/hooks/use-workspace";
import { useViewWorkingState } from "@/registry/workspace/hooks/use-view-working-state";
import { requestPopout } from "@/registry/workspace/components/workspace-popouts";
import {
  deserializeWorkspaceState,
  serializeWorkspaceState,
} from "@/registry/workspace/lib/persistence";
import { WorkspaceTiled } from "@/registry/workspace/components/workspace-tiled";
import { WorkspaceFloating } from "@/registry/workspace/components/workspace-floating";
import { createInitialState } from "@/registry/workspace/lib/factory";
import type { ModifierKey } from "@/registry/workspace/lib/keymap";

export const description =
  "IDE-style tiled workspace: views, tab stacks, splits, floating windows, keymap, and a state inspector.";

const initialLayout = createInitialState({
  direction: "horizontal",
  ratio: 0.6,
  first: {
    views: [{ type: "editor", title: "Editor" }],
  },
  second: {
    direction: "vertical",
    ratio: 0.55,
    first: {
      views: [
        { type: "calculator", title: "Calculator" },
        { type: "clock", title: "Clock" },
      ],
    },
    second: { views: [{ type: "files", title: "Files", closable: false, pinned: true }] },
  },
});

const demoViews = {
  editor: EditorView,
  calculator: CalculatorView,
  files: FilesView,
  clock: ClockView,
};

export function WorkspaceDemo() {
  const [chrome, setChrome] = React.useState<"frame" | "frameless">("frame");
  const [dragModifier, setDragModifier] = React.useState<ModifierKey>("ctrl");
  const [panel, setPanel] = React.useState<"none" | "keys" | "state">("none");

  return (
    <div className="absolute inset-0">
      <WorkspaceProvider
        views={demoViews}
        initialState={initialLayout}
        config={{ floating: { chrome, dragModifier } }}
      >
        <FloatingToolbar
          actions={<ToolbarActions />}
          secondary={
            <>
              <ConfigControls
                chrome={chrome}
                onChromeChange={setChrome}
                dragModifier={dragModifier}
                onDragModifierChange={setDragModifier}
              />
              <Button
                size="sm"
                variant={panel === "keys" ? "secondary" : "ghost"}
                onClick={() => setPanel(panel === "keys" ? "none" : "keys")}
              >
                Keys
              </Button>
              <Button
                size="sm"
                variant={panel === "state" ? "secondary" : "ghost"}
                onClick={() => setPanel(panel === "state" ? "none" : "state")}
              >
                State
              </Button>
              <PersistenceButtons />
            </>
          }
        />
        {panel === "keys" ? <KeysPanel /> : null}
        {panel === "state" ? <StateInspector /> : null}
        <WorkspaceTiled />
        <WorkspaceFloating />
        <StatusBar />
      </WorkspaceProvider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar / panels / status bar
// ---------------------------------------------------------------------------

/**
 * Compact floating toolbar: two rows, draggable by its grip. Starts centered
 * at the top (measured after first paint), then lives wherever you drop it.
 */
function FloatingToolbar({
  actions,
  secondary,
}: {
  actions: React.ReactNode;
  secondary: React.ReactNode;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const barRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const drag = React.useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  // Measure once so the bar starts centered without knowing its own width.
  React.useLayoutEffect(() => {
    if (position || !containerRef.current || !barRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      x: Math.max(8, rect.width / 2 - barRef.current.offsetWidth / 2),
      y: 10,
    });
  }, [position]);

  function onGripPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!position) return;
    event.preventDefault();
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onGripPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state) return;
    setPosition({
      x: state.originX + event.clientX - state.startX,
      y: state.originY + event.clientY - state.startY,
    });
  }

  function onGripPointerUp() {
    drag.current = null;
  }

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      <div
        ref={barRef}
        style={
          position
            ? { left: position.x, top: position.y }
            : { visibility: "hidden" }
        }
        className="pointer-events-auto absolute z-[9999] flex items-center gap-1 rounded-md border bg-background/95 p-1 shadow-md"
      >
        <div
          role="button"
          aria-label="Move toolbar"
          tabIndex={0}
          onPointerDown={onGripPointerDown}
          onPointerMove={onGripPointerMove}
          onPointerUp={onGripPointerUp}
          onPointerCancel={onGripPointerUp}
          className="flex h-full cursor-grab touch-none items-center rounded text-muted-foreground/70 hover:bg-accent hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </div>
        <div className="flex flex-col items-start gap-1">
          <div className="flex gap-1">{actions}</div>
          <div className="flex gap-1">{secondary}</div>
        </div>
      </div>
    </div>
  );
}

function ToolbarActions() {
  const dispatch = useWorkspaceDispatch();
  const store = useWorkspaceStore();
  const state = useWorkspaceState();

  function popoutActive() {
    const viewId = state.activeStackId
      ? state.stacks[state.activeStackId]?.activeViewId
      : undefined;
    if (viewId) requestPopout(store, viewId);
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          dispatch({
            type: "view/open",
            viewType: "editor",
            title: `Editor ${new Date().toLocaleTimeString()}`,
          })
        }
      >
        Open Editor
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          dispatch({ type: "view/open", viewType: "files", title: "Files" })
        }
      >
        Open Files
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          dispatch({
            type: "stack/split",
            direction: "horizontal",
            viewType: "editor",
            title: "Editor",
          })
        }
      >
        Split Right
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => store.applyCommand("view/float")}
      >
        Float
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => store.applyCommand("view/dock")}
      >
        Dock
      </Button>
      <Button size="sm" variant="ghost" onClick={popoutActive}>
        Popout
      </Button>
    </>
  );
}

const STORAGE_KEY = "edcn-workspace-demo";

function PersistenceButtons() {
  const state = useWorkspaceState();
  const store = useWorkspaceStore();

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          localStorage.setItem(STORAGE_KEY, serializeWorkspaceState(state))
        }
      >
        Save
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          const json = localStorage.getItem(STORAGE_KEY);
          if (!json) return;
          const restored = deserializeWorkspaceState(json);
          if (restored) store.hydrate(restored);
        }}
      >
        Load
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          localStorage.removeItem(STORAGE_KEY);
          store.hydrate(initialLayout);
        }}
      >
        Reset
      </Button>
    </>
  );
}

function ConfigControls({
  chrome,
  onChromeChange,
  dragModifier,
  onDragModifierChange,
}: {
  chrome: "frame" | "frameless";
  onChromeChange: (chrome: "frame" | "frameless") => void;
  dragModifier: ModifierKey;
  onDragModifierChange: (modifier: ModifierKey) => void;
}) {
  return (
    <>
      <Button
        size="sm"
        variant={chrome === "frame" ? "secondary" : "ghost"}
        onClick={() =>
          onChromeChange(chrome === "frame" ? "frameless" : "frame")
        }
      >
        {chrome === "frame" ? "Chrome: frame" : "Chrome: frameless"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          onDragModifierChange(dragModifier === "ctrl" ? "alt" : "ctrl")
        }
      >
        Drag: {dragModifier}
      </Button>
    </>
  );
}

function KeysPanel() {
  const config = useWorkspaceConfig();
  return (
    <div className="absolute top-12 left-1/2 z-[9999] w-96 -translate-x-1/2 rounded-md border bg-background p-3 text-xs shadow-md">
      <p className="mb-2 font-medium">Keyboard (override via config.keymap)</p>
      <ul className="space-y-1 font-mono text-muted-foreground">
        <li>alt+w — close active view</li>
        <li>alt+ArrowDown / alt+ArrowUp — next / previous tab</li>
        <li>alt+f — float active view</li>
        <li>alt+d — dock active view</li>
        <li>alt+p — popout active view into its own browser window</li>
      </ul>
      <p className="mt-3 mb-2 font-medium">Pointer</p>
      <ul className="space-y-1 font-mono text-muted-foreground">
        <li>
          drag divider — resize panes · double-click — reset · arrows — nudge
        </li>
        <li>
          {config.floating.chrome === "frameless"
            ? `hold ${config.floating.dragModifier} + drag — move window from anywhere`
            : "drag title bar to move · ctrl+drag also works anywhere"}
        </li>
        <li>click a floating window — bring to front</li>
      </ul>
      <p className="mt-3 text-muted-foreground">
        Tip: click a tab strip to focus a stack — Open/Split target it.
      </p>
    </div>
  );
}

function StateInspector() {
  const state = useWorkspaceState();
  return (
    <pre className="absolute top-12 left-1/2 z-[9999] max-h-72 w-[28rem] -translate-x-1/2 overflow-auto rounded-md border bg-background p-3 text-left text-xs shadow-md">
      {JSON.stringify(state, null, 2)}
    </pre>
  );
}

function StatusBar() {
  const state = useWorkspaceState();
  const activeStack = state.activeStackId
    ? state.stacks[state.activeStackId]
    : undefined;
  const activeView = activeStack?.activeViewId
    ? state.views[activeStack.activeViewId]
    : undefined;

  return (
    <div className="absolute inset-x-0 bottom-0 z-[9999] flex items-center justify-between border-t bg-background/95 px-3 py-1 text-xs text-muted-foreground">
      <span>
        Active view:{" "}
        <span className="font-mono text-foreground">
          {activeView ? `${activeView.title} · ${activeView.id}` : "none"}
        </span>
      </span>
      <span>
        stacks {Object.keys(state.stacks).length} · views{" "}
        {Object.keys(state.views).length} · floating{" "}
        {Object.keys(state.floating).length}
      </span>
    </div>
  );
}

/** Shows the view's stable id — the same instance follows its window around. */
function ViewBadge({ view }: { view: { id: string } }) {
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      {view.id}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Demo views — each keeps working state in useViewWorkingState, keyed by view id,
// so state survives float / dock / split / tab moves.
// ---------------------------------------------------------------------------

function EditorView({ view }: WorkspaceViewProps) {
  const [text, setText] = useViewWorkingState(
    view.id,
    () => `# ${view.title}\n\nType here, then Float or Dock me.\n`,
  );
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-2 py-1">
        <ViewBadge view={view} />
        <span className="text-[10px] text-muted-foreground">
          {text.split("\n").length} lines · {words} words
        </span>
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="h-full w-full resize-none bg-transparent p-3 font-mono text-sm outline-none"
        spellCheck={false}
      />
    </div>
  );
}

interface CalcState {
  display: string;
  acc: number | null;
  op: string | null;
  fresh: boolean;
}

const CALC_KEYS = [
  ["7", "8", "9", "/"],
  ["4", "5", "6", "*"],
  ["1", "2", "3", "-"],
  ["0", ".", "=", "+"],
] as const;

function applyOp(a: number, b: number, op: string): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? NaN : a / b;
    default:
      return b;
  }
}

function calcPress(state: CalcState, key: string): CalcState {
  if (key === "C") return { display: "0", acc: null, op: null, fresh: true };
  if (key === "=") {
    if (state.op !== null && state.acc !== null) {
      return {
        display: String(applyOp(state.acc, Number(state.display), state.op)),
        acc: null,
        op: null,
        fresh: true,
      };
    }
    return state;
  }
  if (["+", "-", "*", "/"].includes(key)) {
    const current = Number(state.display);
    const acc =
      state.op !== null && state.acc !== null && !state.fresh
        ? applyOp(state.acc, current, state.op)
        : current;
    return { display: String(acc), acc, op: key, fresh: true };
  }
  if (state.fresh) {
    return { ...state, display: key === "." ? "0." : key, fresh: false };
  }
  if (key === "." && state.display.includes(".")) return state;
  return {
    ...state,
    display: state.display === "0" && key !== "." ? key : state.display + key,
  };
}

const INITIAL_CALC: CalcState = {
  display: "0",
  acc: null,
  op: null,
  fresh: true,
};

function CalculatorView({ view }: WorkspaceViewProps) {
  const [calc, setCalc] = useViewWorkingState(
    `calc:${view.id}`,
    () => INITIAL_CALC,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-2 py-1">
        <ViewBadge view={view} />
        {calc.op !== null ? (
          <span className="text-[10px] text-muted-foreground">
            pending {calc.op} {calc.acc}
          </span>
        ) : null}
      </div>
      <div className="px-3 py-2 text-right font-mono text-2xl tabular-nums">
        {calc.display}
      </div>
      <div className="grid flex-1 grid-cols-4 gap-1 p-2">
        {CALC_KEYS.flat().map((key) => (
          <Button
            key={key}
            variant={
              ["/", "*", "-", "+", "="].includes(key) ? "secondary" : "outline"
            }
            size="sm"
            className="font-mono"
            onClick={() => setCalc((prev) => calcPress(prev, key))}
          >
            {key}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="col-span-4 font-mono text-destructive"
          onClick={() => setCalc(INITIAL_CALC)}
        >
          C
        </Button>
      </div>
    </div>
  );
}

const DEMO_FILES = [
  "preview/main.tsx",
  "preview/registry-preview.tsx",
  "registry/workspace/lib/reducer.ts",
  "registry/workspace/lib/types.ts",
  "package.json",
];

function FilesView({ view }: WorkspaceViewProps) {
  const [selected, setSelected] = useViewWorkingState<string | null>(
    `files:${view.id}`,
    () => null,
  );
  const dispatch = useWorkspaceDispatch();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-2 py-1">
        <ViewBadge view={view} />
        <span className="text-[10px] text-muted-foreground">
          click a file to open it
        </span>
      </div>
      <ul className="flex-1 overflow-auto p-1 text-sm">
        {DEMO_FILES.map((file) => (
          <li key={file}>
            <button
              type="button"
              onClick={() => {
                setSelected(file);
                // Opens into the ACTIVE stack — click a tab strip first to
                // choose the target.
                dispatch({
                  type: "view/open",
                  viewType: "editor",
                  title: file,
                });
              }}
              className={
                "w-full truncate rounded px-2 py-1 text-left font-mono text-xs " +
                (selected === file
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")
              }
            >
              {file}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClockView({ view }: WorkspaceViewProps) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <span className="text-3xl font-bold tabular-nums">
        {now.toLocaleTimeString()}
      </span>
      <ViewBadge view={view} />
    </div>
  );
}
