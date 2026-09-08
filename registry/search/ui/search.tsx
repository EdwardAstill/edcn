"use client";

import * as React from "react";
import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import { Tree } from "@/registry/tree/components/tree";
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
  return <input {...inputProps} placeholder={browser.mode === "miller" ? "Search this column…" : "Search names or paths…"} {...props}
    className={cn("h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring", className)}
    onKeyDown={(event) => { onKeyDown?.(event); if (!event.defaultPrevented) inputProps.onKeyDown?.(event); }}
    onChange={(event) => { onChange?.(event); if (!event.defaultPrevented) inputProps.onChange?.(event); }} />;
}

/** A draggable divider for adjacent panes, with keyboard resizing and reset. */
export function SearchPaneDivider({ ratio, onRatioChange, className, "aria-label": label = "Resize panes" }: {
  ratio: number;
  onRatioChange: (ratio: number) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const drag = React.useRef<{ pointerId: number; x: number; width: number; ratio: number } | null>(null);
  const clamp = (value: number) => Math.min(0.85, Math.max(0.15, value));
  function finish(event: React.PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return <div role="separator" aria-label={label} aria-orientation="vertical"
    aria-valuemin={15} aria-valuemax={85} aria-valuenow={Math.round(ratio * 100)} tabIndex={0}
    className={cn("relative z-10 w-px shrink-0 cursor-col-resize touch-none select-none bg-border outline-none before:absolute before:inset-y-0 before:-inset-x-1 hover:bg-foreground focus-visible:bg-foreground", className)}
    onPointerDown={(event) => {
      if (event.button !== 0 || drag.current) return;
      const before = event.currentTarget.previousElementSibling;
      const after = event.currentTarget.nextElementSibling;
      const width = (before?.getBoundingClientRect().width ?? 0) + (after?.getBoundingClientRect().width ?? 0);
      if (!width) return;
      event.preventDefault();
      event.currentTarget.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { pointerId: event.pointerId, x: event.clientX, width, ratio };
    }}
    onPointerMove={(event) => {
      const current = drag.current;
      if (current?.pointerId === event.pointerId) onRatioChange(clamp(current.ratio + (event.clientX - current.x) / current.width));
    }}
    onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={() => { drag.current = null; }}
    onKeyDown={(event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      onRatioChange(event.key === "Home" ? 0.15 : event.key === "End" ? 0.85 : clamp(ratio + (event.key === "ArrowRight" ? 0.05 : -0.05)));
    }}
    onDoubleClick={() => onRatioChange(0.5)} />;
}

export interface SearchResultsProps<T = unknown> {
  browser: NestedSearchState<T>;
  /** Replaces row contents; the outer row keeps its focus and keyboard behavior. */
  renderItem?: SearchItemRenderer<T>;
  /** Shown beside the tree, or in the right Miller pane when a leaf is selected. */
  preview?: React.ReactNode;
  /** Rendered above the current list in either layout. */
  search?: React.ReactNode;
  /** Show visible Miller column labels; accessible list names remain available. */
  showPaneLabels?: boolean;
  className?: string;
}

export function SearchResults<T>({ browser, renderItem, preview, search, showPaneLabels = true, className }: SearchResultsProps<T>) {
  const { mode, selected, columns, searching } = browser;
  const hasParent = !!selected?.ancestors.length;
  const layout = mode === "files" ? "files" : hasParent ? "miller3" : "miller2";
  const [widths, setWidths] = React.useState({ files: [1, 1], miller2: [1, 1], miller3: [1, 1, 1] });
  const sizes = widths[layout];
  const gridStyle = { "--search-columns": sizes.map((size) => `minmax(0, ${size}fr)`).join(" 1px ") } as React.CSSProperties;
  function divider(index: number, className?: string) {
    const total = sizes[index] + sizes[index + 1];
    return <SearchPaneDivider key={`${layout}-${index}`} ratio={sizes[index] / total} className={className}
      aria-label={`Resize ${mode === "files" ? "results and preview" : index === 0 && hasParent ? "parent and current columns" : "current and child columns"}`}
      onRatioChange={(ratio) => setWidths((previous) => {
        const next = [...previous[layout]];
        const sum = next[index] + next[index + 1];
        next[index] = sum * ratio;
        next[index + 1] = sum * (1 - ratio);
        return { ...previous, [layout]: next };
      })} />;
  }
  const byId = new Map(browser.entries.map((entry) => [entry.item.id, entry]));
  function renderRow(entry: SearchEntry<T>) {
    const { item } = entry;
    const state = browser.getItemState(entry);
    const { isContainer, isSelected, isAncestor, isExpanded, isMatch } = state;
    const Icon = isContainer ? (isExpanded || isAncestor ? FolderOpen : Folder) : FileText;
    return <div key={item.id} {...browser.getItemProps(entry)} data-search-item={item.id} data-match={isMatch ? "" : undefined}
      className={cn("flex min-w-0 cursor-default items-center gap-2 rounded-md px-2 py-2 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", isSelected && "bg-accent text-accent-foreground", !isSelected && isAncestor && "bg-muted/60", isMatch && "font-semibold")}>
      {renderItem ? renderItem(entry, state) : <>
        <Icon aria-hidden="true" className={cn("size-4 shrink-0", isContainer ? "text-primary/70" : "text-muted-foreground")} />
        <span className="min-w-0 flex-1 truncate" title={item.label}>{item.label}</span>
        {isContainer && <ChevronRight aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />}
      </>}
    </div>;
  }
  return mode === "miller" ? <div aria-label="Miller columns" style={gridStyle} className={cn("grid h-[440px] grid-cols-[var(--search-columns)]", className)}>
    {columns.map((column, position) => position === 0 && !hasParent ? null : <React.Fragment key={position}>
    {position > (hasParent ? 0 : 1) && divider(hasParent ? position - 1 : position - 2)}
    <div data-miller-column={position} className="flex min-h-0 min-w-0 flex-col">
      {position === 1 && search}
      {position === 2 && !selected?.item.children ? preview : <>
        {showPaneLabels && <div className="truncate border-b bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground" title={column.label}>{column.label}</div>}
        <div {...browser.getListProps(position)} className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {column.items.map((item) => renderRow(byId.get(item.id)!))}
          {!column.items.length && <p className="p-3 text-sm text-muted-foreground">{position === 0 && !selected?.ancestors.length ? "At root" : searching && position === 1 ? "No matching items." : "This container is empty."}</p>}
        </div>
      </>}
    </div></React.Fragment>)}
  </div> : <div style={preview ? gridStyle : undefined} className={cn("flex flex-col md:h-[440px]", preview && "md:grid md:grid-cols-[var(--search-columns)]", className)}>
    <div className={cn("flex min-h-0 min-w-0 flex-col", preview ? "border-b md:border-b-0" : "flex-1")}>
      {search}
      <Tree {...browser.getListProps()} className="min-h-0 h-64 flex-1 overflow-auto p-2"
        items={browser.visibleEntries.map(({ item, ancestors }) => ({ id: item.id, label: item.label, parentId: ancestors.at(-1)?.id ?? null, isBranch: item.children !== undefined }))}
        selectedId={selected?.item.id ?? null}
        collapsedIds={new Set(browser.entries.filter((entry) => !browser.getItemState(entry).isExpanded).map((entry) => entry.item.id))}
        onCollapsedIdsChange={(ids) => {
          for (const entry of browser.entries) {
            if (entry.item.children && browser.getItemState(entry).isExpanded === ids.has(entry.item.id)) browser.setExpanded(entry.item.id, !ids.has(entry.item.id));
          }
        }}
        getItemProps={(item) => {
          const entry = byId.get(item.id)!;
          const props = browser.getItemProps<HTMLButtonElement>(entry);
          return { ...props, onClick: undefined, "data-search-item": item.id, "data-match": browser.getItemState(entry).isMatch ? "" : undefined, className: browser.getItemState(entry).isMatch ? "font-semibold" : undefined };
        }}
        renderItem={renderItem ? (item) => { const entry = byId.get(item.id)!; return renderItem(entry, browser.getItemState(entry)); } : undefined}
      />
        {!browser.visibleEntries.length && <p className="p-6 text-center text-sm text-muted-foreground">{searching ? "No matching items. Try another name or path." : "No items yet."}</p>}
    </div>
    {preview && divider(0, "hidden md:block")}
    {preview}
  </div>;
}

/** A preview shell with no file assumptions; children own all preview content. */
export function SearchPreview({ className, ...props }: React.ComponentPropsWithoutRef<"aside">) {
  return <aside aria-label="Content preview" {...props} className={cn("flex min-h-64 min-w-0 flex-1 flex-col", className)} />;
}
