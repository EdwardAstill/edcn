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
  expect(document.activeElement).toBe(input());
});

test("Miller keeps three fixed panes and recenters keyboard, pointer, and search selections", async () => {
  await mount(<NestedSearch items={items} defaultMode="miller" />);
  function centered(id: string) {
    const panes = container.querySelectorAll('[data-miller-column]');
    expect(panes.length).toBe(3);
    expect(row(id).closest('[data-miller-column]')).toBe(panes[1]);
    expect(row(id).getAttribute("aria-selected")).toBe("true");
    expect(input().getAttribute("aria-controls")).toBe(panes[1].querySelector('[role="listbox"]')!.id);
  }
  centered("research");
  expect(container.querySelector('[data-miller-column="0"]')!.textContent).toContain("At root");
  expect(row("notes").closest('[data-miller-column]')!.getAttribute("data-miller-column")).toBe("2");
  await click(row("notes"));
  centered("notes");
  expect(document.activeElement).toBe(row("notes"));
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
  expect(document.activeElement).toBe(row("research"));
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
  expect(container.querySelectorAll('[data-miller-column]').length).toBe(3);
});

test("keyboard navigates new Miller columns, returns to parent, and opens only leaves", async () => {
  const opened: string[] = [];
  await mount(<NestedSearch items={items} defaultMode="miller" onOpen={(item) => opened.push(item.id)} />);
  await act(async () => row("research").focus());
  await key(row("research"), "ArrowRight");
  expect(document.activeElement).toBe(row("notes"));
  await key(row("notes"), "ArrowRight");
  expect(document.activeElement).toBe(row("bird"));
  expect(preview().textContent).toContain("Three swans");
  await key(row("bird"), "ArrowDown");
  expect(document.activeElement).toBe(row("water"));
  await key(row("water"), "Enter");
  expect(opened).toEqual(["water"]);
  await key(row("water"), "ArrowLeft");
  expect(document.activeElement).toBe(row("notes"));
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
  expect(document.activeElement).toBe(input());
  expect(input().getAttribute("aria-activedescendant")).toBe(row("empty").id);
  await search("bird");
  const event = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true });
  await act(async () => input().dispatchEvent(event));
  expect(event.defaultPrevented).toBe(false);
  await key(input(), "Escape");
  expect(input().value).toBe("");
  expect(document.activeElement).toBe(input());
});

test("file rows expand, collapse, and preview by pointer and keyboard without changing data", async () => {
  const before = structuredClone(items);
  await mount(<NestedSearch items={items} />);
  await click(row("research"));
  expect(row("notes")).not.toBeNull();
  await key(row("research"), "ArrowRight");
  expect(document.activeElement).toBe(row("notes"));
  await key(row("notes"), "ArrowRight");
  expect(row("bird")).not.toBeNull();
  await click(row("bird"));
  expect(preview().textContent).toContain("Three swans");
  await key(row("bird"), "ArrowLeft");
  await key(row("notes"), "ArrowLeft");
  expect(row("bird")).toBeNull();
  expect(document.activeElement).toBe(row("notes"));
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
  expect(document.activeElement).toBe(row("notes"));
  await search("water");
  expect(row("water").getAttribute("aria-selected")).toBe("true");
  expect(container.querySelector("output")!.textContent).toContain('"temperature": 18');
  await key(input(), "Enter");
  expect(opened).toEqual(["water"]);
});
