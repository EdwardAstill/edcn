import { afterAll, afterEach, beforeAll, expect, spyOn, test } from "bun:test";
import { act } from "react";
import type { Root } from "react-dom/client";
import { WorkspaceProvider, useWorkspaceState } from "@/registry/workspace/hooks/use-workspace";
import { createInitialState } from "@/registry/workspace/lib/factory";
import { createWorkspaceStore, type WorkspaceStore } from "@/registry/workspace/lib/store";
import { WorkspaceTabList } from "@/registry/workspace/ui/workspace-tab-list";
import { installHappyDom } from "../quiz/happy-dom";

let restore: () => void;
let root: Root;
let container: HTMLDivElement;

beforeAll(() => { restore = installHappyDom(); });
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  document.body.replaceChildren();
});
afterAll(() => restore());

function TabLists() {
  const state = useWorkspaceState();
  return Object.keys(state.stacks).map((stackId) => (
    <WorkspaceTabList key={stackId} stackId={stackId} />
  ));
}

async function mount(store: WorkspaceStore) {
  const { createRoot } = await import("react-dom/client");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(
    <WorkspaceProvider store={store} views={{}}><TabLists /></WorkspaceProvider>,
  ));
}

function tab(title: string) {
  return Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'))
    .find((element) => element.textContent === title)!;
}

async function doubleClick(element: HTMLElement) {
  await act(async () => element.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
}

async function pointer(target: EventTarget, type: string, x: number, y: number, ctrlKey = false) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, ctrlKey });
  Object.defineProperty(event, "pointerId", { value: 1 });
  await act(async () => { target.dispatchEvent(event); });
}

test.each(["pointerup", "pointercancel", "blur"])("Ctrl-drag follows the cursor and stops on %s", async (finish) => {
  const initial = createInitialState({ views: [
    { type: "editor", title: "First" },
    { type: "editor", title: "Second" },
  ] });
  const [firstId, secondId] = Object.keys(initial.views);
  const store = createWorkspaceStore(initial);
  await mount(store);

  await act(async () => tab("Second").dispatchEvent(new MouseEvent("dragstart", {
    bubbles: true, cancelable: true,
  })));
  expect(store.getState()).toBe(initial);

  await pointer(tab("Second"), "pointerdown", 200, 100, true);
  await pointer(document, "pointermove", 201, 100);
  expect(store.getState()).toBe(initial);

  const measure = spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => {
    const surface = Object.values(store.getState().floating)[0];
    return { left: (surface?.x ?? 0) + 100, top: (surface?.y ?? 0) + 60, width: 120, height: 30 } as DOMRect;
  });
  try {
    await pointer(document, "pointermove", 220, 120);
    const state = store.getState();
    const surfaces = Object.values(state.floating);
    expect(surfaces).toHaveLength(1);
    expect(state.stacks[surfaces[0].stackId].viewIds).toEqual([secondId]);
    expect(state.stacks[initial.activeStackId!].viewIds).toEqual([firstId]);
    expect(surfaces[0].x).toBe(60);
    expect(surfaces[0].y).toBe(45);

    await pointer(document, "pointermove", 300, 190);
    const moved = store.getState().floating[surfaces[0].id];
    expect(moved.x).toBe(140);
    expect(moved.y).toBe(115);
    if (finish === "blur") {
      await act(async () => { window.dispatchEvent(new Event("blur")); });
    } else {
      await pointer(document, finish, 300, 190);
    }
    await pointer(document, "pointermove", 400, 250);
    expect(store.getState().floating[surfaces[0].id]).toBe(moved);
  } finally {
    measure.mockRestore();
  }
});

test("Ctrl-drag respects pinned tabs", async () => {
  const initial = createInitialState({ views: [{ type: "editor", title: "Pinned", pinned: true }] });
  const store = createWorkspaceStore(initial);
  await mount(store);
  await pointer(tab("Pinned"), "pointerdown", 200, 100, true);
  await pointer(document, "pointermove", 250, 150);
  await pointer(document, "pointerup", 250, 150);
  expect(store.getState()).toBe(initial);
});

test("double-click floats only the clicked tab and docks it on the next double-click", async () => {
  const initial = createInitialState({ views: [
    { type: "editor", title: "First" },
    { type: "editor", title: "Second" },
  ] });
  const [firstId, secondId] = Object.keys(initial.views);
  const stackId = initial.activeStackId!;
  const store = createWorkspaceStore(initial);
  await mount(store);

  await act(async () => tab("Second").click());
  expect(store.getState().stacks[stackId].activeViewId).toBe(secondId);
  expect(store.getState().floating).toEqual({});

  await doubleClick(tab("Second"));
  const floated = store.getState();
  const surfaces = Object.values(floated.floating);
  expect(surfaces).toHaveLength(1);
  expect(floated.stacks[surfaces[0].stackId].viewIds).toEqual([secondId]);
  expect(floated.stacks[stackId].viewIds).toEqual([firstId]);

  await doubleClick(tab("Second"));
  const docked = store.getState();
  expect(docked.floating).toEqual({});
  expect(docked.stacks[stackId].viewIds).toEqual([firstId, secondId]);
  expect(docked.stacks[stackId].activeViewId).toBe(secondId);
  expect(docked.views).toEqual(initial.views);
});

test.each([false, true])("double-click respects pinned tabs (floating: %s)", async (floating) => {
  const initial = createInitialState({ views: [{ type: "editor", title: "Pinned", pinned: true }] });
  const store = createWorkspaceStore(initial);
  if (floating) {
    store.dispatch({ type: "view/float", viewType: "clock", title: "Pinned float", pinned: true });
  }
  await mount(store);
  const before = store.getState();
  await doubleClick(tab(floating ? "Pinned float" : "Pinned"));
  expect(store.getState()).toBe(before);
});

test("double-click docks a popout tab back into the tiled layout", async () => {
  const initial = createInitialState({ views: [{ type: "editor", title: "Editor" }] });
  const viewId = Object.keys(initial.views)[0];
  const store = createWorkspaceStore(initial);
  store.dispatch({ type: "view/popout", viewId, surfaceId: "popout" });
  await mount(store);
  await doubleClick(tab("Editor"));
  expect(store.getState().popouts).toEqual({});
  expect(store.getState().floating).toEqual({});
  expect(store.getState().stacks[initial.activeStackId!].viewIds).toEqual([viewId]);
});

test("the close control does not toggle tab placement", async () => {
  const initial = createInitialState({ views: [{ type: "editor", title: "Editor" }] });
  const store = createWorkspaceStore(initial);
  await mount(store);
  const close = container.querySelector<HTMLElement>('[aria-label="Close Editor"]')!;
  await doubleClick(close);
  expect(store.getState()).toBe(initial);
  await act(async () => close.click());
  expect(store.getState().views).toEqual({});
  expect(store.getState().floating).toEqual({});
});
