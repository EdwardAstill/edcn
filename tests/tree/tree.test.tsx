import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Tree, type TreeItem } from "@/registry/tree/components/tree";
import { dropNode, flattenTree } from "@/registry/tree/lib/tree";
import { installHappyDom } from "../quiz/happy-dom";

const items: TreeItem[] = [
  { id: "a", label: "A", parentId: null },
  { id: "child", label: "Child", parentId: "a" },
  { id: "b", label: "B", parentId: null },
  { id: "c", label: "C", parentId: null },
];
let restore: () => void;
let root: Root;
let container: HTMLDivElement;
beforeAll(() => { restore = installHappyDom(); });
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  document.body.replaceChildren();
});
afterAll(() => restore());
async function mount(element: ReactElement) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(element));
}
function row(id: string) { return container.querySelector<HTMLButtonElement>(`[data-tree-item="${id}"]`)!; }
function order() { return Array.from(container.querySelectorAll<HTMLElement>("[data-tree-item]"), (node) => node.dataset.treeItem); }
async function key(id: string, key: string, type = "keydown") {
  await act(async () => row(id).dispatchEvent(new KeyboardEvent(type, { key, bubbles: true })));
}

test("drop placement preserves branches, sibling order, and the original data", () => {
  const before = structuredClone(items);
  expect(flattenTree(dropNode(items, "a", "b", "after")).map((node) => node.id)).toEqual(["b", "a", "child", "c"]);
  expect(dropNode(items, "c", "b", "before").map((node) => node.id)).toEqual(["a", "child", "c", "b"]);
  expect(dropNode(items, "a", "b", "inside").find((node) => node.id === "a")?.parentId).toBe("b");
  expect(dropNode(items, "child", "a", "before").find((node) => node.id === "child")?.parentId).toBeNull();
  expect(dropNode(items, "a", "child", "after")).toBe(items);
  expect(dropNode(items, "a", "a", "inside")).toBe(items);
  expect(items).toEqual(before);
});

test("default tree navigates and selects but cannot sort", async () => {
  let changes = 0;
  await mount(<Tree defaultItems={items} onItemsChange={() => changes++} />);
  expect(container.querySelector("[data-tree-draggable]")).toBeNull();
  await act(async () => row("a").focus());
  await key("a", "ArrowRight");
  expect(document.activeElement).toBe(row("child"));
  await key("child", "ArrowLeft");
  expect(document.activeElement).toBe(row("a"));
  await key("a", " ");
  await key("a", "ArrowDown");
  expect(order()).toEqual(["a", "child", "b", "c"]);
  expect(changes).toBe(0);
  expect(container.querySelector("[data-grabbed]")).toBeNull();
  await key("child", "End");
  expect(document.activeElement).toBe(row("c"));
  expect(row("child").getAttribute("aria-level")).toBe("2");
});

test("held Space reorders, groups and ungroups without losing focus", async () => {
  await mount(<Tree defaultItems={items} sortable />);
  await act(async () => row("a").focus());
  await key("a", " ");
  await key("a", "ArrowDown");
  expect(order()).toEqual(["b", "a", "child", "c"]);
  expect(document.activeElement).toBe(row("a"));
  await key("a", "ArrowRight");
  expect(row("a").dataset.depth).toBe("1");
  expect(row("child").dataset.depth).toBe("2");
  await key("a", "ArrowLeft");
  expect(row("a").dataset.depth).toBe("0");
  await key("a", " ", "keyup");
  expect(container.querySelector("[data-grabbed]")).toBeNull();
});

test("normal arrows collapse and expand branches, skip hidden rows, and retain nested collapse state", async () => {
  let changes = 0;
  const nested = [...items, { id: "grandchild", label: "Grandchild", parentId: "child" }];
  await mount(<Tree items={nested} onItemsChange={() => changes++} />);
  await act(async () => row("child").focus());
  await key("child", "ArrowLeft");
  expect(row("grandchild") === null).toBe(true);
  expect(row("child").getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(row("child"));
  await key("child", "ArrowLeft");
  expect(document.activeElement).toBe(row("a"));
  await key("a", "ArrowLeft");
  expect(order()).toEqual(["a", "b", "c"]);
  expect(document.activeElement).toBe(row("a"));
  await key("a", "ArrowDown");
  expect(document.activeElement).toBe(row("b"));
  await key("b", "ArrowUp");
  await key("a", "ArrowRight");
  expect(document.activeElement).toBe(row("a"));
  expect(order()).toEqual(["a", "child", "b", "c"]);
  expect(row("a").getAttribute("aria-expanded")).toBe("true");
  await key("a", "ArrowRight");
  expect(document.activeElement).toBe(row("child"));
  await key("child", "ArrowRight");
  expect(row("grandchild") !== null).toBe(true);
  expect(document.activeElement).toBe(row("child"));
  await key("child", "ArrowRight");
  expect(document.activeElement).toBe(row("grandchild"));
  await key("grandchild", "ArrowRight");
  expect(document.activeElement).toBe(row("grandchild"));
  expect(row("grandchild").hasAttribute("aria-expanded")).toBe(false);
  expect(changes).toBe(0);
});

test("holding Space still groups into a collapsed branch and ungroups while preserving focus", async () => {
  await mount(<Tree defaultItems={items} sortable />);
  await act(async () => row("a").focus());
  await key("a", "ArrowLeft");
  expect(row("child") === null).toBe(true);
  await key("a", "ArrowDown");
  await key("b", " ");
  await key("b", "ArrowRight");
  expect(row("b").dataset.depth).toBe("1");
  expect(row("a").getAttribute("aria-expanded")).toBe("true");
  expect(document.activeElement).toBe(row("b"));
  await key("b", "ArrowLeft");
  expect(row("b").dataset.depth).toBe("0");
  await key("b", " ", "keyup");
  await key("b", "ArrowUp");
  await key("child", "ArrowLeft");
  await key("a", "ArrowLeft");
  expect(row("child") === null).toBe(true);
});

function setupPointer() {
  for (const [index, id] of ["a", "child", "b", "c"].entries()) {
    row(id).getBoundingClientRect = () => ({ left: 0, right: 300, top: index * 40, bottom: (index + 1) * 40, height: 40, width: 300, x: 0, y: index * 40, toJSON() {} });
  }
  const handle = row("a");
  let captured = false;
  handle.setPointerCapture = () => { captured = true; };
  handle.hasPointerCapture = () => captured;
  handle.releasePointerCapture = () => { captured = false; };
  return async (type: string, y: number, x = 20) => {
    const event = new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y });
    Object.defineProperty(event, "pointerId", { value: 1 });
    await act(async () => handle.dispatchEvent(event));
  };
}

test("pointer previews and commits grouping only on release", async () => {
  await mount(<Tree defaultItems={items} sortable />);
  const pointer = setupPointer();
  await pointer("pointerdown", 20);
  await pointer("pointermove", 100);
  expect(row("b").dataset.dropPosition).toBe("inside");
  expect(order()).toEqual(["a", "child", "b", "c"]);
  await pointer("pointerup", 100);
  expect(order()).toEqual(["b", "a", "child", "c"]);
  expect(row("a").dataset.depth).toBe("1");
  expect(row("child").dataset.depth).toBe("2");
  expect(container.querySelector("[data-grabbed]")).toBeNull();
});

test("Escape, invalid descendants, outside release, and pointer cancellation leave data intact", async () => {
  await mount(<Tree defaultItems={items} sortable />);
  const pointer = setupPointer();
  await pointer("pointerdown", 20);
  await pointer("pointermove", 100);
  await key("a", "Escape");
  await pointer("pointerup", 100);
  await pointer("pointerdown", 20);
  await pointer("pointermove", 60);
  expect(container.querySelector("[data-drop-position]")).toBeNull();
  await pointer("pointerup", 60);
  await pointer("pointerdown", 20);
  await pointer("pointermove", 100);
  await pointer("pointerup", 100, 500);
  await pointer("pointerdown", 20);
  await pointer("pointermove", 100);
  await pointer("pointercancel", 100);
  await pointer("pointerup", 100);
  expect(order()).toEqual(["a", "child", "b", "c"]);
});

test("controlled changes require owner updates and disabling sorting cancels a drag", async () => {
  let next: TreeItem[] | undefined;
  const render = (sortable: boolean, data = items) => <Tree items={data} sortable={sortable} onItemsChange={(value) => { next = value; }} />;
  await mount(render(true));
  await key("a", " ");
  await key("a", "ArrowDown");
  expect(order()).toEqual(["a", "child", "b", "c"]);
  expect(next?.map((item) => item.id)).toEqual(["b", "a", "child", "c"]);
  await act(async () => root.render(render(true, next)));
  expect(order()).toEqual(["b", "a", "child", "c"]);
  const pointer = setupPointer();
  next = undefined;
  await pointer("pointerdown", 20);
  await pointer("pointermove", 100);
  await act(async () => root.render(render(false)));
  await pointer("pointerup", 100);
  expect(next).toBeUndefined();
  expect(container.querySelector("[data-tree-draggable]")).toBeNull();
  expect(container.querySelector("[data-grabbed]")).toBeNull();
});

test("branch buttons toggle nested groups and leaf buttons only select", async () => {
  let changes = 0;
  await mount(<Tree defaultItems={items} onItemsChange={() => changes++} />);
  expect(row("a").tagName).toBe("BUTTON");
  const groupId = row("a").getAttribute("aria-owns")!;
  expect(document.getElementById(groupId)?.getAttribute("role")).toBe("group");
  await act(async () => row("a").click());
  expect(row("a").getAttribute("aria-expanded")).toBe("false");
  expect(order()).toEqual(["a", "b", "c"]);
  await act(async () => row("a").click());
  expect(order()).toEqual(["a", "child", "b", "c"]);
  await act(async () => row("child").click());
  expect(row("child").getAttribute("aria-selected")).toBe("true");
  expect(row("child").hasAttribute("aria-expanded")).toBe(false);
  expect(row("a").getAttribute("aria-expanded")).toBe("true");
  expect(changes).toBe(0);
});

test("sortable branches click to toggle but suppress the click following a drag", async () => {
  await mount(<Tree defaultItems={items} sortable />);
  const pointer = setupPointer();
  await pointer("pointerdown", 20);
  await pointer("pointerup", 20);
  await act(async () => row("a").click());
  expect(row("a").getAttribute("aria-expanded")).toBe("false");
  await act(async () => row("a").click());
  await pointer("pointerdown", 20);
  await pointer("pointermove", 100);
  await pointer("pointerup", 100);
  await act(async () => row("a").click());
  expect(row("a").getAttribute("aria-expanded")).toBe("true");
  expect(order()).toEqual(["b", "a", "child", "c"]);
  expect(document.activeElement === row("a")).toBe(true);
});


test("controlled reparenting restores focus when the owner applies the change later", async () => {
  let next = items;
  const render = (data: TreeItem[]) => <Tree items={data} sortable onItemsChange={(value) => { next = value; }} />;
  await mount(render(items));
  await act(async () => row("b").focus());
  await key("b", " ");
  await key("b", "ArrowRight");
  expect(row("b").dataset.depth).toBe("0");
  await act(async () => root.render(render(next)));
  expect(row("b").dataset.depth).toBe("1");
  expect(document.activeElement === row("b")).toBe(true);
  await key("b", "ArrowLeft");
  await act(async () => root.render(render(next)));
  expect(row("b").dataset.depth).toBe("0");
  expect(document.activeElement === row("b")).toBe(true);
});
