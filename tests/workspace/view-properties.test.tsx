import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createInitialState } from "@/registry/workspace/lib/factory";
import { applyWorkspaceCommand, canMoveView, reducer } from "@/registry/workspace/lib/reducer";
import { serializeWorkspaceState, deserializeWorkspaceState } from "@/registry/workspace/lib/persistence";
import { WorkspaceProvider } from "@/registry/workspace/hooks/use-workspace";
import { WorkspaceTabList } from "@/registry/workspace/ui/workspace-tab-list";
import { WorkspaceFloating } from "@/registry/workspace/components/workspace-floating";

test("non-closable tabs hide close controls and resist actions and keyboard commands", () => {
  const state = createInitialState({ views: [
    { type: "editor", title: "Permanent", closable: false },
    { type: "editor", title: "Normal" },
  ] });
  const [permanent, normal] = Object.keys(state.views);
  expect(reducer(state, { type: "view/close", viewId: permanent })).toBe(state);
  expect(applyWorkspaceCommand(state, "view/close")).toBe(state);
  expect(reducer(state, { type: "view/close", viewId: normal }).views[normal]).toBeUndefined();
  const html = renderToStaticMarkup(
    <WorkspaceProvider initialState={state} views={{}}>
      <WorkspaceTabList stackId={state.activeStackId!} />
    </WorkspaceProvider>,
  );
  expect(html).not.toContain('aria-label="Close Permanent"');
  expect(html).toContain('aria-label="Close Normal"');
});

test("pinned tiled views cannot float, pop out, or move into a floating stack", () => {
  const initial = createInitialState({ views: [{ type: "editor", pinned: true }] });
  const viewId = Object.keys(initial.views)[0];
  const state = reducer(initial, { type: "view/float", viewType: "clock" });
  const targetStackId = Object.values(state.floating)[0].stackId;
  expect(reducer(state, { type: "view/float", viewId })).toBe(state);
  expect(reducer(state, { type: "view/popout", viewId, surfaceId: "popout" })).toBe(state);
  expect(canMoveView(state, viewId, targetStackId)).toBe(false);
  for (const edge of ["center", "left", "right", "top", "bottom"] as const) {
    expect(reducer(state, { type: "view/move", viewId, targetStackId, edge })).toBe(state);
  }
  expect(reducer(state, { type: "stack/split", stackId: targetStackId, direction: "horizontal", viewId })).toBe(state);
  expect(applyWorkspaceCommand(initial, "view/float")).toBe(initial);
  expect(applyWorkspaceCommand(initial, "view/popout")).toBe(initial);
});

test("pinned floating views cannot dock or be inserted into tiled stacks", () => {
  const initial = createInitialState({ views: [] });
  const targetStackId = initial.activeStackId!;
  const state = reducer(initial, { type: "view/float", viewType: "clock", pinned: true });
  const viewId = Object.keys(state.views)[0];
  expect(state.views[viewId].pinned).toBe(true);
  expect(reducer(state, { type: "view/dock", viewId })).toBe(state);
  expect(applyWorkspaceCommand(state, "view/dock")).toBe(state);
  for (const edge of ["center", "left", "right", "top", "bottom"] as const) {
    expect(reducer(state, { type: "view/move", viewId, targetStackId, edge })).toBe(state);
  }
  const surfaceId = Object.keys(state.floating)[0];
  expect(reducer(state, { type: "floating/move", surfaceId, x: 100, y: 200 }).floating[surfaceId].x).toBe(100);
  expect(reducer(state, { type: "floating/resize", surfaceId, width: 500, height: 400 }).floating[surfaceId].width).toBe(500);
  expect(reducer(state, { type: "view/close", viewId }).views[viewId]).toBeUndefined();
});

test("pinned views can still split and move within the tiled layout", () => {
  const initial = createInitialState({ views: [
    { type: "editor", pinned: true },
    { type: "clock" },
  ] });
  const viewId = Object.keys(initial.views)[0];
  const state = reducer(initial, { type: "stack/split", direction: "horizontal", viewId });
  expect(state).not.toBe(initial);
  expect(state.views[viewId]).toEqual(initial.views[viewId]);
  const moved = reducer(state, { type: "view/move", viewId, targetStackId: initial.activeStackId!, edge: "center" });
  expect(moved.stacks[initial.activeStackId!].viewIds).toContain(viewId);
});

test("floating window close cannot bypass a non-closable tab", () => {
  let state = reducer(createInitialState({ views: [] }), {
    type: "view/float", viewType: "editor", closable: false,
  });
  state = reducer(state, { type: "view/open", viewType: "clock" });
  const surfaceId = Object.keys(state.floating)[0];
  expect(reducer(state, { type: "floating/close", surfaceId })).toBe(state);
  const html = renderToStaticMarkup(
    <WorkspaceProvider initialState={state} views={{}} config={{ floating: { chrome: "frame" } }}>
      <WorkspaceFloating />
    </WorkspaceProvider>,
  );
  expect(html.match(/aria-label="Close clock"/g)).toHaveLength(1);
  expect(html).not.toContain('aria-label="Close editor"');
  const clock = Object.values(state.views).find((view) => view.type === "clock")!;
  expect(reducer(state, { type: "view/close", viewId: clock.id }).views[clock.id]).toBeUndefined();
});

test("creation actions and persistence preserve both properties", () => {
  let state = createInitialState({ views: [] });
  state = reducer(state, { type: "view/open", viewType: "editor", closable: false, pinned: true });
  state = reducer(state, { type: "stack/split", direction: "vertical", viewType: "clock", closable: false, pinned: true });
  state = reducer(state, { type: "view/float", viewType: "clock", closable: false, pinned: true });
  state = reducer(state, { type: "stack/split", direction: "horizontal", viewType: "editor", closable: false, pinned: true });
  expect(Object.values(state.views)).toHaveLength(4);
  for (const view of Object.values(state.views)) {
    expect(view.closable).toBe(false);
    expect(view.pinned).toBe(true);
  }
  expect(deserializeWorkspaceState(serializeWorkspaceState(state))).toEqual(state);
});

test("omitted properties keep floating and docking enabled", () => {
  const initial = createInitialState({ views: [{ type: "editor" }] });
  const viewId = Object.keys(initial.views)[0];
  const floated = reducer(initial, { type: "view/float", viewId });
  expect(Object.values(floated.floating)).toHaveLength(1);
  const docked = reducer(floated, { type: "view/dock", viewId });
  expect(Object.values(docked.floating)).toHaveLength(0);
  expect(docked.stacks[initial.activeStackId!].viewIds).toContain(viewId);
});
