"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NestedSearchState } from "@/registry/search/hooks/use-nested-search";
import type { SearchEntry } from "@/registry/search/lib/search";

export interface SearchItemRenderState {
  isContainer: boolean;
  isSelected: boolean;
  isAncestor: boolean;
  isExpanded: boolean;
  isMatch: boolean;
}
export type SearchItemRenderer<T = unknown> = (entry: SearchEntry<T>, state: SearchItemRenderState) => React.ReactNode;

export function SearchInput<T>({ browser, className, onKeyDown, onChange, ...props }: Omit<React.ComponentPropsWithoutRef<"input">, "value" | "defaultValue"> & { browser: NestedSearchState<T> }) {
  const inputProps = browser.getInputProps();
  return <input {...inputProps} placeholder="Search names or paths…" {...props}
    className={cn("h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring", className)}
    onKeyDown={(event) => { onKeyDown?.(event); if (!event.defaultPrevented) inputProps.onKeyDown?.(event); }}
    onChange={(event) => { onChange?.(event); if (!event.defaultPrevented) inputProps.onChange?.(event); }} />;
}

export interface SearchResultsProps<T = unknown> {
  browser: NestedSearchState<T>;
  /** Replaces row contents; the outer row keeps its focus and keyboard behavior. */
  renderItem?: SearchItemRenderer<T>;
  /** Shown beside the tree, or in the right Miller pane when a leaf is selected. */
  preview?: React.ReactNode;
  className?: string;
}

export function SearchResults<T>({ browser, renderItem, preview, className }: SearchResultsProps<T>) {
  const { mode, selected, columns, searching } = browser;
  const byId = new Map(browser.entries.map((entry) => [entry.item.id, entry]));
  function renderRow(entry: SearchEntry<T>) {
    const { item } = entry;
    const state = browser.getItemState(entry);
    const { isContainer, isSelected, isAncestor, isExpanded, isMatch } = state;
    const tree = mode === "files";
    const Icon = isContainer ? (isExpanded || isAncestor ? FolderOpen : Folder) : FileText;
    return <div key={item.id} {...browser.getItemProps(entry)} data-search-item={item.id} data-match={isMatch ? "" : undefined}
      className={cn("flex min-w-0 cursor-default items-center gap-2 rounded-md px-2 py-2 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", isSelected && "bg-accent text-accent-foreground", !isSelected && isAncestor && "bg-muted/60", isMatch && "font-semibold")}
      style={tree ? { paddingLeft: 8 + entry.depth * 18 } : undefined}>
      {renderItem ? renderItem(entry, state) : <>
        {tree && (isContainer ? (isExpanded ? <ChevronDown aria-hidden="true" className="size-3 shrink-0" /> : <ChevronRight aria-hidden="true" className="size-3 shrink-0" />) : <span className="w-3 shrink-0" />)}
        <Icon aria-hidden="true" className={cn("size-4 shrink-0", isContainer ? "text-primary/70" : "text-muted-foreground")} />
        <span className="min-w-0 flex-1 truncate" title={item.label}>{item.label}</span>
        {isContainer && (tree ? <span className="text-xs font-normal text-muted-foreground">{item.children!.length}</span> : <ChevronRight aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />)}
      </>}
    </div>;
  }
  return mode === "miller" ? <div aria-label="Miller columns" className={cn("grid h-[440px] grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)]", className)}>
    {columns.map((column, position) => <div key={position} data-miller-column={position} className="flex min-h-0 min-w-0 flex-col border-r last:border-r-0">
      {position === 2 && !selected?.item.children ? preview : <>
        <div className="truncate border-b bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground" title={column.label}>{column.label}</div>
        <div {...browser.getListProps(position)} className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {column.items.map((item) => renderRow(byId.get(item.id)!))}
          {!column.items.length && <p className="p-3 text-sm text-muted-foreground">{position === 0 && !selected?.ancestors.length ? "At root" : searching ? "No matching items." : "This container is empty."}</p>}
        </div>
      </>}
    </div>)}
  </div> : <div className={cn("flex flex-col md:h-[440px] md:flex-row", className)}>
    <div className={cn("min-w-0", preview ? "border-b md:w-2/5 md:border-r md:border-b-0" : "flex-1")}>
      <div {...browser.getListProps()} className="h-64 overflow-auto p-2 md:h-full">
        {browser.visibleEntries.map(renderRow)}
        {!browser.visibleEntries.length && <p className="p-6 text-center text-sm text-muted-foreground">{searching ? "No matching items. Try another name or path." : "No items yet."}</p>}
      </div>
    </div>
    {preview}
  </div>;
}

/** A preview shell with no file assumptions; children own all preview content. */
export function SearchPreview({ className, ...props }: React.ComponentPropsWithoutRef<"aside">) {
  return <aside aria-label="Content preview" {...props} className={cn("flex min-h-64 min-w-0 flex-1 flex-col", className)} />;
}
