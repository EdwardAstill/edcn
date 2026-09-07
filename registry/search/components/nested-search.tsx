"use client";

import * as React from "react";
import { ChevronRight, Columns3, FolderOpen, ListTree, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNestedSearch, type UseNestedSearchOptions } from "@/registry/search/hooks/use-nested-search";
import { SearchInput, SearchResults, SearchPreview, type SearchItemRenderer } from "@/registry/search/ui/search";
import type { SearchItem } from "@/registry/search/lib/search";

export type { SearchItem } from "@/registry/search/lib/search";
export type { SearchMode } from "@/registry/search/hooks/use-nested-search";

export interface NestedSearchProps<T = unknown> extends UseNestedSearchOptions<T> {
  renderItem?: SearchItemRenderer<T>;
  /** Called for leaves only. Use SearchPreview directly to replace the entire preview. */
  renderPreview?: (item: SearchItem<T>) => React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function NestedSearch<T>({ renderItem, renderPreview, className, "aria-label": label = "Search library", ...options }: NestedSearchProps<T>) {
  const browser = useNestedSearch(options);
  const { mode, query, selected, entries, searching } = browser;
  const { onOpen } = options;
  const prefix = React.useId();

  const contentPreview = <SearchPreview>
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">Preview</span>
          {selected && onOpen && !selected.item.children && <Button size="sm" variant="ghost" onClick={() => onOpen(selected.item)}>Open <ChevronRight /></Button>}
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-5" key={selected?.item.id}>
          {selected ? <>
            <p className="mb-2 break-all font-mono text-xs text-muted-foreground">{selected.path}</p>
            <h3 className="mb-2 break-words text-lg font-semibold tracking-tight">{selected.item.label}</h3>
            {selected.item.description && <p className="mb-5 text-sm text-muted-foreground">{selected.item.description}</p>}
            {selected.item.children ? <div className="mt-8 flex flex-col items-center gap-3 text-center text-muted-foreground"><FolderOpen aria-hidden="true" className="size-10 stroke-1" /><p className="text-sm">{selected.item.children.length} items inside</p><p className="max-w-60 text-xs">Select an item to preview its contents.</p></div>
              : renderPreview ? renderPreview(selected.item)
                : selected.item.content !== undefined ? <pre className="mt-5 whitespace-pre-wrap break-words font-mono text-xs leading-6">{selected.item.content}</pre>
                  : <p className="mt-8 text-sm text-muted-foreground">No preview available.</p>}
          </> : <p className="text-sm text-muted-foreground">Select an item to preview its contents.</p>}
        </div>
      </SearchPreview>;

  return <section aria-label={label} className={cn("overflow-hidden rounded-xl border bg-background text-foreground shadow-sm", className)}>
    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium"><Search aria-hidden="true" className="size-4 text-muted-foreground" />{label}</div>
      <div role="group" aria-label="Browse mode" className="flex gap-1 rounded-lg bg-muted p-1">
        <Button size="sm" variant={mode === "files" ? "outline" : "ghost"} aria-pressed={mode === "files"} onClick={() => browser.setMode("files")}><ListTree />Files</Button>
        <Button size="sm" variant={mode === "miller" ? "outline" : "ghost"} aria-pressed={mode === "miller"} onClick={() => browser.setMode("miller")}><Columns3 />Miller columns</Button>
      </div>
    </header>
    <div className="flex items-center gap-2 border-b px-4 py-2">
      <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <SearchInput browser={browser} aria-describedby={`${prefix}-help`} />
      {query && <Button size="icon-sm" variant="ghost" aria-label="Clear search" onClick={() => { browser.setQuery(""); browser.focusSearch(); }}><X /></Button>}
      <span role="status" className="shrink-0 text-xs tabular-nums text-muted-foreground">{searching ? `${browser.matchCount} matches` : `${entries.length} items`}</span>
    </div>
    <SearchResults browser={browser} renderItem={renderItem} preview={contentPreview} />
    <footer id={`${prefix}-help`} className="flex flex-wrap gap-x-5 gap-y-1 border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
      <span>↑ ↓ Navigate</span><span>← → Browse from a row</span><span>Enter {onOpen ? "Open" : "Browse"}</span><span>Esc Clear search</span>
    </footer>
  </section>;
}
