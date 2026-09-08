import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { act, type ReactElement } from "react";
import type { Root } from "react-dom/client";
import { NestedSearch, type SearchItem } from "@/registry/search/components/nested-search";
import { indexItems, projectSearch } from "@/registry/search/lib/search";
import { useNestedSearch } from "@/registry/search/hooks/use-nested-search";
import { SearchInput, SearchPreview, SearchResults } from "@/registry/search/ui/search";
import { installHappyDom } from "../quiz/happy-dom";

const items: SearchItem[] = [
  { id: "research", label: "Research", children: [
    { id: "notes", label: "Notes", children: [
      { id: "bird", label: "Bird.md", content: "Three swans by the reeds." },
      { id: "water", label: "Water.json", content: '{ "temperature": 18 }' },
    ] },
  ] },
  { id: "empty", label: "Empty", children: [] },
  { id: "readme", label: "README", content: "Start here." },
];
const entries = indexItems(items);
const ids = (query: string, expanded = new Set<string>()) => projectSearch(entries, query, expanded).visible.map((entry) => entry.item.id);

test("search preserves ancestor paths, folder subtrees, source order, and manual expansion", () => {
  const expanded = new Set(["research"]);
  expect(ids("", expanded)).toEqual(["research", "notes", "empty", "readme"]);
  expect(ids("BRD")).toEqual(["research", "notes", "bird"]);
  expect(ids("notes")).toEqual(["research", "notes", "bird", "water"]);
  expect(ids("research/notes/wj")).toEqual(["research", "notes", "water"]);
  expect([...projectSearch(entries, "notes", expanded).matches]).toEqual(["notes"]);
  expect(ids("  ", expanded)).toEqual(["research", "notes", "empty", "readme"]);
  expect([...expanded]).toEqual(["research"]);
  expect(ids("missing")).toEqual([]);
  expect(indexItems([])).toEqual([]);
  expect(() => indexItems([{ id: "x", label: "X", children: [{ id: "x", label: "Again" }] }])).toThrow("Duplicate search item ID");
});

let restore: () => void;
let root: Root;
let container: HTMLDivElement;
beforeAll(() => { restore = installHappyDom(); });
afterEach(async () => { if (root) await act(async () => root.unmount()); document.body.replaceChildren(); });
afterAll(() => restore());
async function mount(element: ReactElement) {
  const { createRoot } = await import("react-dom/client");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(element));
}
function row(id: string) { return container.querySelector<HTMLDivElement>(`[data-search-item="${id}"]`)!; }
function input() { return container.querySelector<HTMLInputElement>("input")!; }
function preview() { return container.querySelector('[aria-label="Content preview"]')!; }
function button(label: string) { return [...container.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === label || button.getAttribute("aria-label") === label)!; }
async function click(element: HTMLElement) { await act(async () => element.click()); }
async function key(element: HTMLElement, key: string) { await act(async () => element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))); }
async function search(value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input(), value);
    input().dispatchEvent(new Event("input", { bubbles: true }));
  });
}

test("deep selection and preview survive repeated mode changes, including a query", async () => {
  await mount(<NestedSearch items={items} defaultSelectedId="bird" />);
  expect(preview().textContent).toContain("Three swans");
  await click(button("Miller columns"));
  expect(container.querySelectorAll('[data-miller-column]').length).toBe(3);
  expect(row("bird").getAttribute("aria-selected")).toBe("true");
  await search("water");
  expect(input().value).toBe("water");
  expect(preview().textContent).toContain('"temperature": 18');
  await click(button("Files"));
  expect(input().value).toBe("water");
  expect(row("water").getAttribute("aria-selected")).toBe("true");
  expect(row("bird")).toBeNull();
  await click(button("Miller columns"));
  expect(preview().textContent).toContain('"temperature": 18');
});

test("clearing a search restores collapsed folders even after switching modes", async () => {
  await mount(<NestedSearch items={items} />);
  expect(row("bird")).toBeNull();
  await search("bird");
  expect(row("research").getAttribute("aria-expanded")).toBe("true");
  expect(row("bird").getAttribute("aria-selected")).toBe("true");
  await click(button("Miller columns"));
  await click(button("Files"));
  await click(button("Clear search"));
  expect(row("research").getAttribute("aria-expanded")).toBe("false");
  expect(row("bird")).toBeNull();
  expect(document.activeElement === input()).toBe(true);
});

test("Miller hides the root parent pane and recenters keyboard, pointer, and search selections", async () => {
  await mount(<NestedSearch items={items} defaultMode="miller" />);
  function centered(id: string) {
    const panes = container.querySelectorAll('[data-miller-column]');
    expect(panes.length).toBe(entries.find((entry) => entry.item.id === id)!.ancestors.length ? 3 : 2);
    const current = container.querySelector('[data-miller-column="1"]')!;
    expect(row(id).closest('[data-miller-column]')).toBe(current);
    expect(row(id).getAttribute("aria-selected")).toBe("true");
    expect(input().getAttribute("aria-controls")).toBe(current.querySelector('[role="listbox"]')!.id);
  }
  centered("research");
  expect(container.querySelector('[data-miller-column="0"]')).toBeNull();
  expect(row("notes").closest('[data-miller-column]')!.getAttribute("data-miller-column")).toBe("2");
  await click(row("notes"));
  centered("notes");
  expect(document.activeElement === row("notes")).toBe(true);
  await key(row("notes"), "ArrowRight");
  centered("bird");
  expect(preview().closest('[data-miller-column]')!.getAttribute("data-miller-column")).toBe("2");
  expect(row("research")).toBeNull();
  await key(row("bird"), "ArrowDown");
  centered("water");
  await key(row("water"), "ArrowLeft");
  centered("notes");
  await click(row("research"));
  centered("research");
  expect(document.activeElement === row("research")).toBe(true);
  await key(row("research"), "ArrowRight");
  await key(row("notes"), "ArrowRight");
  await search("water");
  centered("water");
  await search("missing");
  expect(container.querySelectorAll('[data-miller-column]').length).toBe(3);
  await search("");
  await key(row("water"), "ArrowLeft");
  await key(row("notes"), "ArrowLeft");
  await click(row("empty"));
  centered("empty");
  expect(container.querySelector('[data-miller-column="2"]')!.textContent).toContain("This container is empty.");
  await act(async () => root.render(<NestedSearch items={[]} defaultMode="miller" />));
  expect(container.querySelectorAll('[data-miller-column]').length).toBe(2);
});

test("keyboard navigates new Miller columns, returns to parent, and opens only leaves", async () => {
  const opened: string[] = [];
  await mount(<NestedSearch items={items} defaultMode="miller" onOpen={(item) => opened.push(item.id)} />);
  await act(async () => row("research").focus());
  await key(row("research"), "ArrowRight");
  expect(document.activeElement === row("notes")).toBe(true);
  await key(row("notes"), "ArrowRight");
  expect(document.activeElement === row("bird")).toBe(true);
  expect(preview().textContent).toContain("Three swans");
  await key(row("bird"), "ArrowDown");
  expect(document.activeElement === row("water")).toBe(true);
  await key(row("water"), "Enter");
  expect(opened).toEqual(["water"]);
  await key(row("water"), "ArrowLeft");
  expect(document.activeElement === row("notes")).toBe(true);
  await key(row("notes"), "Enter");
  expect(opened).toEqual(["water"]);
  await click(button("Files"));
  expect(row("bird").getAttribute("aria-selected")).toBe("true");
});

test("input arrows keep focus and horizontal arrows preserve text editing", async () => {
  await mount(<NestedSearch items={items} />);
  await act(async () => input().focus());
  await key(input(), "ArrowDown");
  expect(row("empty").getAttribute("aria-selected")).toBe("true");
  expect(document.activeElement === input()).toBe(true);
  expect(input().getAttribute("aria-activedescendant")).toBe(row("empty").id);
  await search("bird");
  const event = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true });
  await act(async () => input().dispatchEvent(event));
  expect(event.defaultPrevented).toBe(false);
  await key(input(), "Escape");
  expect(input().value).toBe("");
  expect(document.activeElement === input()).toBe(true);
});

test("file rows expand, collapse, and preview by pointer and keyboard without changing data", async () => {
  const before = structuredClone(items);
  await mount(<NestedSearch items={items} />);
  await click(row("research"));
  expect(row("notes")).not.toBeNull();
  await key(row("research"), "ArrowRight");
  expect(document.activeElement === row("research")).toBe(true);
  await key(row("research"), "ArrowDown");
  await key(row("notes"), "ArrowRight");
  expect(row("bird")).not.toBeNull();
  await click(row("bird"));
  expect(preview().textContent).toContain("Three swans");
  await key(row("bird"), "ArrowLeft");
  expect(document.activeElement === row("bird")).toBe(true);
  await key(row("bird"), "ArrowUp");
  await key(row("notes"), "ArrowLeft");
  expect(row("bird")).toBeNull();
  expect(document.activeElement === row("notes")).toBe(true);
  expect(items).toEqual(before);
});

test("multiple instances have independent selection and accessible result IDs", async () => {
  await mount(<><NestedSearch items={items} /><NestedSearch items={items} /></>);
  const inputs = [...container.querySelectorAll("input")];
  expect(inputs[0].getAttribute("aria-controls")).not.toBe(inputs[1].getAttribute("aria-controls"));
  await key(inputs[0], "ArrowDown");
  const selected = [...container.querySelectorAll('[aria-selected="true"]')];
  expect(selected.map((element) => element.getAttribute("data-search-item"))).toEqual(["empty", "research"]);
  for (const input of inputs) expect(document.getElementById(input.getAttribute("aria-activedescendant")!)).not.toBeNull();
});

test("empty containers, no results, missing content, and data replacement render safely", async () => {
  await mount(<NestedSearch items={items} defaultMode="miller" defaultSelectedId="empty" />);
  expect(container.textContent).toContain("This container is empty.");
  await search("not found");
  expect(container.textContent).toContain("No matching items.");
  expect(input().hasAttribute("aria-activedescendant")).toBe(false);
  await key(input(), "ArrowDown");
  await search("");
  await act(async () => root.render(<NestedSearch items={[{ id: "bare", label: "Bare" }]} />));
  expect(preview().textContent).toContain("No preview available.");
  await act(async () => root.render(<NestedSearch items={[]} />));
  expect(preview().textContent).toContain("Select an item");
});

test("custom previews receive only leaves and text content is never interpreted as HTML", async () => {
  const calls: string[] = [];
  await mount(<NestedSearch items={items} renderPreview={(item) => { calls.push(item.id); return <article>Custom {item.label}</article>; }} />);
  expect(calls).toEqual([]);
  await search("bird");
  expect(calls).toEqual(["bird"]);
  expect(preview().textContent).toContain("Custom Bird.md");
  await act(async () => root.render(<NestedSearch items={[{ id: "html", label: "HTML", content: '<script>alert("hello")</script>' }]} />));
  await search("");
  expect(preview().querySelector("script")).toBeNull();
  expect(preview().textContent).toContain('<script>alert("hello")</script>');
});

test("composed pieces accept custom rows, toolbar actions, and the entire preview", async () => {
  function CustomBrowser() {
    const browser = useNestedSearch({ items, defaultMode: "miller", defaultSelectedId: "bird" });
    return <>
      <SearchInput browser={browser} aria-label="Find a record" placeholder="Custom prompt" onKeyDown={(event) => { if (event.key === "ArrowDown") event.preventDefault(); }} />
      <button onClick={() => browser.setMode("files")}>Hierarchy</button>
      <button onClick={() => { browser.setQuery(""); browser.select("bird"); }}>Bookmark</button>
      <SearchResults browser={browser} renderItem={({ item }, state) => <span>{state.isContainer ? "Group" : "Record"}: {item.label}</span>}
        preview={<SearchPreview><h2>My preview</h2><p>{browser.selected?.item.content}</p></SearchPreview>} />
    </>;
  }
  await mount(<CustomBrowser />);
  expect(input().getAttribute("aria-label")).toBe("Find a record");
  expect(row("bird").textContent).toBe("Record: Bird.md");
  expect(row("bird").querySelector("svg")).toBeNull();
  expect(preview().querySelector("h2")!.textContent).toBe("My preview");
  await key(input(), "ArrowDown");
  expect(row("bird").getAttribute("aria-selected")).toBe("true");
  await key(row("bird"), "ArrowDown");
  expect(preview().textContent).toContain('"temperature": 18');
  await click(button("Hierarchy"));
  await search("readme");
  await click(button("Bookmark"));
  expect(input().value).toBe("");
  expect(row("bird").getAttribute("aria-selected")).toBe("true");
  expect(preview().textContent).toContain("Three swans");
});

test("headless prop getters provide navigation and focus without the styled components", async () => {
  const opened: string[] = [];
  function HeadlessBrowser() {
    const browser = useNestedSearch({ items, onOpen: (item) => opened.push(item.id) });
    return <>
      <input {...browser.getInputProps()} />
      <div {...browser.getListProps()}>
        {browser.visibleEntries.map((entry) => <div key={entry.item.id} {...browser.getItemProps(entry)} data-search-item={entry.item.id}>
          {entry.item.label}
        </div>)}
      </div>
      <output>{browser.selected?.item.content}</output>
    </>;
  }
  await mount(<HeadlessBrowser />);
  expect(container.querySelector("svg")).toBeNull();
  await click(row("research"));
  await key(row("research"), "ArrowRight");
  expect(document.activeElement === row("research")).toBe(true);
  await key(row("research"), "ArrowDown");
  expect(document.activeElement === row("notes")).toBe(true);
  await search("water");
  expect(row("water").getAttribute("aria-selected")).toBe("true");
  expect(container.querySelector("output")!.textContent).toContain('"temperature": 18');
  await key(input(), "Enter");
  expect(opened).toEqual(["water"]);
});


test.each(["files", "miller"] as const)("%s keeps search in the current pane and supports typing and Tab cycling", async (mode) => {
  await mount(<NestedSearch items={items} defaultMode={mode} defaultSelectedId="bird" showModeSwitch={false} />);
  expect(container.querySelector('[aria-label="Browse mode"]')).toBeNull();
  if (mode === "miller") expect(input().closest('[data-miller-column]')?.getAttribute("data-miller-column")).toBe("1");
  else expect(input().parentElement?.parentElement?.contains(container.querySelector('[role="tree"]'))).toBe(true);
  await act(async () => input().focus());
  await key(input(), "Tab");
  expect(document.activeElement === row("bird")).toBe(true);
  await key(row("bird"), "Tab");
  expect(document.activeElement === row("water")).toBe(true);
  await act(async () => row("water").dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true })));
  expect(document.activeElement === row("bird")).toBe(true);
  await key(row("bird"), "w");
  expect(input().value).toBe("w");
  expect(document.activeElement === input()).toBe(true);
  expect(row("water").getAttribute("aria-selected")).toBe("true");
  await key(input(), "Escape");
  const exit = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
  await act(async () => input().dispatchEvent(exit));
  expect(exit.defaultPrevented).toBe(false);
});

test.each(["files", "miller"] as const)("%s dividers resize adjacent panes and stop on pointer cancellation", async (mode) => {
  await mount(<NestedSearch items={items} defaultMode={mode} defaultSelectedId="bird" />);
  const handles = [...container.querySelectorAll<HTMLDivElement>('[role="separator"]')];
  expect(handles.length).toBe(mode === "miller" ? 2 : 1);
  const handle = handles.at(-1)!;
  const layout = handle.parentElement!;
  const initial = layout.style.getPropertyValue("--search-columns");
  for (const pane of [handle.previousElementSibling!, handle.nextElementSibling!]) {
    pane.getBoundingClientRect = () => ({ width: 300 } as DOMRect);
  }
  let captured = false;
  handle.setPointerCapture = () => { captured = true; };
  handle.hasPointerCapture = () => captured;
  handle.releasePointerCapture = () => { captured = false; };
  async function pointer(type: string, x: number, pointerId = 1) {
    const event = new MouseEvent(type, { bubbles: true, button: 0, clientX: x });
    Object.defineProperty(event, "pointerId", { value: pointerId });
    await act(async () => handle.dispatchEvent(event));
  }
  await pointer("pointerdown", 300);
  await pointer("pointermove", 360, 2);
  expect(layout.style.getPropertyValue("--search-columns")).toBe(initial);
  await pointer("pointermove", 360);
  expect(handle.getAttribute("aria-valuenow")).toBe("60");
  expect(layout.style.getPropertyValue("--search-columns")).not.toBe(initial);
  if (mode === "miller") expect(layout.style.getPropertyValue("--search-columns").startsWith("minmax(0, 1fr)")).toBe(true);
  await pointer("pointermove", 3000);
  expect(handle.getAttribute("aria-valuenow")).toBe("85");
  await pointer("pointercancel", 3000);
  expect(captured).toBe(false);
  await pointer("pointermove", 0);
  expect(handle.getAttribute("aria-valuenow")).toBe("85");
  await key(handle, "ArrowLeft");
  expect(handle.getAttribute("aria-valuenow")).toBe("80");
  await key(handle, "Home");
  expect(handle.getAttribute("aria-valuenow")).toBe("15");
  await act(async () => handle.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
  expect(layout.style.getPropertyValue("--search-columns")).toBe(initial);
  expect(preview().textContent).toContain("Three swans");
});

test("Miller retains resized widths when entering and leaving the root layout", async () => {
  await mount(<NestedSearch items={items} defaultMode="miller" defaultSelectedId="bird" />);
  const handle = container.querySelector<HTMLElement>('[role="separator"]')!;
  await key(handle, "ArrowRight");
  const initial = handle.parentElement!.style.getPropertyValue("--search-columns");
  await key(row("bird"), "ArrowLeft");
  await key(row("notes"), "ArrowLeft");
  expect(container.querySelectorAll('[role="separator"]').length).toBe(1);
  await key(row("research"), "ArrowRight");
  expect(container.querySelectorAll('[role="separator"]').length).toBe(2);
  expect(container.querySelector<HTMLElement>('[role="separator"]')!.parentElement!.style.getPropertyValue("--search-columns")).toBe(initial);
});


test("Miller search filters only current names and preserves unfiltered parent and child context", async () => {
  const data: SearchItem[] = [
    { id: "root", label: "Root", children: [
      { id: "group", label: "Group", children: [
        { id: "one", label: "One", content: "First" },
        { id: "two", label: "Two", content: "Second" },
      ] },
      { id: "other", label: "Other", children: [] },
    ] },
    { id: "outside", label: "Outside", content: "Outside" },
  ];
  const opened: string[] = [];
  await mount(<NestedSearch items={data} defaultMode="miller" defaultSelectedId="group" onOpen={(item) => opened.push(item.id)} />);
  const paneIds = (position: number) => [...container.querySelectorAll(`[data-miller-column="${position}"] [data-search-item]`)].map((node) => node.getAttribute("data-search-item"));
  const parents = paneIds(0);
  const children = paneIds(2);
  expect(input().getAttribute("aria-label")).toBe("Search current column");
  for (const query of ["group", "root", "two", "missing"]) {
    await search(query);
    expect(paneIds(1)).toEqual(query === "group" ? ["group"] : []);
    expect(paneIds(0)).toEqual(parents);
    expect(paneIds(2)).toEqual(children);
  }
  expect(input().hasAttribute("aria-activedescendant")).toBe(false);
  await key(input(), "Enter");
  expect(opened).toEqual([]);
  await search("group");
  await key(input(), "Tab");
  await key(row("group"), "ArrowRight");
  expect(input().value).toBe("");
  expect(paneIds(1)).toEqual(["one", "two"]);
  await search("two");
  expect(paneIds(1)).toEqual(["two"]);
  expect(preview().textContent).toContain("Second");
  await key(input(), "Tab");
  await key(row("two"), "ArrowLeft");
  expect(input().value).toBe("");
  expect(paneIds(1)).toEqual(["group", "other"]);
});

test("nested Tab cycles matches while arrows visit all visible context rows", async () => {
  const data: SearchItem[] = [
    { id: "a", label: "First folder", children: [{ id: "one", label: "Match one" }] },
    { id: "b", label: "Second folder", children: [{ id: "two", label: "Match two" }] },
  ];
  await mount(<NestedSearch items={data} />);
  await search("match");
  await key(input(), "Tab");
  expect(document.activeElement === row("one")).toBe(true);
  await key(row("one"), "Tab");
  expect(document.activeElement === row("two")).toBe(true);
  await key(row("two"), "Tab");
  expect(document.activeElement === row("one")).toBe(true);
  await act(async () => row("one").dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true })));
  expect(document.activeElement === row("two")).toBe(true);
  await key(row("two"), "ArrowUp");
  expect(document.activeElement === row("b")).toBe(true);
  await key(row("b"), "Tab");
  expect(document.activeElement === row("two")).toBe(true);
  await key(row("two"), "ArrowUp");
  await act(async () => row("b").dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true })));
  expect(document.activeElement === row("one")).toBe(true);
  await key(row("one"), "ArrowDown");
  expect(document.activeElement === row("b")).toBe(true);
  await key(row("b"), "ArrowDown");
  expect(document.activeElement === row("two")).toBe(true);
  await search("missing");
  const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
  await act(async () => input().dispatchEvent(tab));
  expect(tab.defaultPrevented).toBe(false);
});

test("nested results use Explorer buttons and retain empty folders and custom rows", async () => {
  await mount(<NestedSearch items={items} defaultSelectedId="bird" renderItem={({ item }) => <span>Custom {item.label}</span>} />);
  expect(row("bird").tagName).toBe("BUTTON");
  expect(row("bird").getAttribute("data-tree-item")).toBe("bird");
  expect(row("bird").textContent).toBe("Custom Bird.md");
  expect(row("empty").hasAttribute("aria-expanded")).toBe(true);
  await click(row("notes"));
  expect(row("bird")).toBeNull();
  expect(row("notes").getAttribute("aria-expanded")).toBe("false");
  await key(row("notes"), "ArrowRight");
  expect(row("bird").tagName).toBe("BUTTON");
  expect(document.activeElement === row("notes")).toBe(true);
  await search("bird");
  expect(input().getAttribute("aria-activedescendant")).toBe(row("bird").id);
  expect(row("bird").hasAttribute("data-selected")).toBe(true);
});
