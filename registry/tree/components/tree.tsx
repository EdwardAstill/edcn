"use client";

import * as React from "react";
import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { childrenOf, dropNode, flattenTree, reorderNode, reparentNode, wouldCreateCycle, type DropPosition, type TreeNode } from "@/registry/tree/lib/tree";

export type TreeItem = TreeNode;
export type TreeItemProps = React.ComponentPropsWithRef<"button"> & { [key: `data-${string}`]: string | undefined };
export interface TreeProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children" | "onChange"> {
  items?: TreeItem[];
  defaultItems?: TreeItem[];
  onItemsChange?: (items: TreeItem[]) => void;
  sortable?: boolean;
  selectedId?: string | null;
  onSelectedIdChange?: (id: string) => void;
  collapsedIds?: ReadonlySet<string>;
  onCollapsedIdsChange?: (ids: Set<string>) => void;
  renderItem?: (item: TreeItem) => React.ReactNode;
  /** Additional row attributes and handlers. Prevent default to override a key. */
  getItemProps?: (item: TreeItem) => TreeItemProps;
}
type DropTarget = { id: string; position: DropPosition };
type Drag = { id: string; pointerId: number; x: number; y: number; active: boolean; target: DropTarget | null; handle: HTMLButtonElement };

export function Tree({ items: controlledItems, defaultItems = [], onItemsChange, sortable = false, selectedId: controlledSelectedId, onSelectedIdChange, collapsedIds, onCollapsedIdsChange, renderItem, getItemProps, className, "aria-label": label = "Tree", ...props }: TreeProps) {
  const [localItems, setLocalItems] = React.useState(defaultItems);
  const items = controlledItems ?? localItems;
  const [localCollapsed, setLocalCollapsed] = React.useState(() => new Set<string>());
  const collapsed = collapsedIds ?? localCollapsed;
  function setCollapsed(update: (previous: ReadonlySet<string>) => Set<string>) {
    const next = update(collapsed);
    if (collapsedIds === undefined) setLocalCollapsed(next);
    onCollapsedIdsChange?.(next);
  }
  let collapsedDepth = Infinity;
  const visible = flattenTree(items).filter((item) => {
    if (item.depth > collapsedDepth) return false;
    collapsedDepth = collapsed.has(item.id) ? item.depth : Infinity;
    return true;
  });
  const [selected, setSelected] = React.useState<string | null>(null);
  const selection = controlledSelectedId === undefined ? selected : controlledSelectedId;
  const selectedId = visible.some((item) => item.id === selection) ? selection : visible[0]?.id;
  const [grabbed, setGrabbed] = React.useState<string | null>(null);
  const [drop, setDrop] = React.useState<DropTarget | null>(null);
  const [announcement, announce] = React.useState("");
  const rows = React.useRef(new Map<string, HTMLButtonElement>());
  const drag = React.useRef<Drag | null>(null);
  const instructionId = React.useId();
  const pendingFocus = React.useRef<string | null>(null);
  const suppressClick = React.useRef(false);

  // Reparenting a nested row remounts its button; restore keyboard focus after commit.
  React.useLayoutEffect(() => {
    if (pendingFocus.current) {
      rows.current.get(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    }
  }, [items]);

  const cancelDrag = React.useCallback(() => {
    const current = drag.current;
    drag.current = null;
    if (current?.handle.hasPointerCapture(current.pointerId)) current.handle.releasePointerCapture(current.pointerId);
    setGrabbed(null);
    setDrop(null);
  }, []);

  React.useEffect(() => {
    if (!sortable) cancelDrag();
  }, [sortable, cancelDrag]);
  React.useEffect(() => {
    function cancel(event: KeyboardEvent) {
      if (event.key === "Escape") {
        cancelDrag();
        announce("Movement cancelled.");
      }
    }
    function blur() { cancelDrag(); }
    window.addEventListener("keydown", cancel);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", cancel);
      window.removeEventListener("blur", blur);
    };
  }, [cancelDrag]);

  function update(next: TreeItem[], message: string) {
    if (next === items) return;
    if (selectedId && document.activeElement === rows.current.get(selectedId)) {
      pendingFocus.current = selectedId;
    }
    // Keep a moved row visible when it is placed inside a collapsed branch.
    setCollapsed((previous) => {
      const expanded = new Set(previous);
      let parentId = next.find((item) => item.id === selectedId)?.parentId;
      while (parentId != null) {
        expanded.delete(parentId);
        parentId = next.find((item) => item.id === parentId)?.parentId;
      }
      return expanded;
    });
    if (controlledItems === undefined) setLocalItems(next);
    onItemsChange?.(next);
    announce(message);
  }
  function select(id: string) {
    const row = rows.current.get(id);
    if (row && document.activeElement !== row) row.focus();
    else {
      setSelected(id);
      if (selectedId !== id) onSelectedIdChange?.(id);
    }
  }
  function keyDown(event: React.KeyboardEvent, item: TreeItem) {
    if (event.key === " " && sortable) {
      event.preventDefault();
      if (!event.repeat && !drag.current) {
        setGrabbed(item.id);
        announce(`${item.label} grabbed. Hold Space and use arrows to move.`);
      }
      return;
    }
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const siblings = childrenOf(items, item.parentId);
    const siblingIndex = siblings.findIndex((node) => node.id === item.id);
    if (sortable && grabbed === item.id && !drag.current) {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        update(reorderNode(items, item.id, siblingIndex + (event.key === "ArrowUp" ? -1 : 1)), `${item.label} moved ${event.key === "ArrowUp" ? "up" : "down"}.`);
      } else if (event.key === "ArrowRight" && siblings[siblingIndex - 1]) {
        const parent = siblings[siblingIndex - 1];
        update(reparentNode(items, item.id, parent.id), `${item.label} placed inside ${parent.label}.`);
      } else if (event.key === "ArrowLeft" && item.parentId !== null) {
        const parent = items.find((node) => node.id === item.parentId)!;
        const index = childrenOf(items, parent.parentId).findIndex((node) => node.id === parent.id);
        update(reparentNode(items, item.id, parent.parentId, index + 1), `${item.label} moved out of ${parent.label}.`);
      }
      return;
    }
    if ((item.isBranch || childrenOf(items, item.id).length) && (
      (event.key === "ArrowLeft" && !collapsed.has(item.id)) ||
      (event.key === "ArrowRight" && collapsed.has(item.id))
    )) {
      setCollapsed((previous) => {
        const next = new Set(previous);
        if (event.key === "ArrowLeft") next.add(item.id); else next.delete(item.id);
        return next;
      });
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") return;
    const index = visible.findIndex((node) => node.id === item.id);
    const target = event.key === "Home" ? visible[0] : event.key === "End" ? visible.at(-1) : event.key === "ArrowUp" ? visible[index - 1] : visible[index + 1];
    if (target) select(target.id);
  }
  function findTarget(event: React.PointerEvent): DropTarget | null {
    const current = drag.current;
    if (!current || !sortable) return null;
    for (const [id, row] of rows.current) {
      const rect = row.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) continue;
      if (wouldCreateCycle(items, current.id, id)) return null;
      const fraction = (event.clientY - rect.top) / rect.height;
      return { id, position: fraction < 0.25 ? "before" : fraction > 0.75 ? "after" : "inside" };
    }
    return null;
  }
  function pointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId || !sortable) return;
    if (!current.active && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 5) return;
    current.active = true;
    suppressClick.current = true;
    current.target = findTarget(event);
    setGrabbed(current.id);
    setDrop(current.target);
  }
  function pointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const target = current.active && sortable ? findTarget(event) : null;
    cancelDrag();
    if (target) {
      update(dropNode(items, current.id, target.id, target.position), `${items.find((item) => item.id === current.id)?.label} moved ${target.position} ${items.find((item) => item.id === target.id)?.label}.`);
    }
    select(current.id);
  }

  function renderItems(parentId: string | null, depth = 0): React.ReactNode {
    const siblings = childrenOf(items, parentId);
    return siblings.map((item, index) => {
      const hasChildren = item.isBranch || childrenOf(items, item.id).length > 0;
      const open = !collapsed.has(item.id);
      const groupId = `${instructionId}-${encodeURIComponent(item.id)}`;
      const target = sortable && drop?.id === item.id ? drop.position : null;
      const extra = getItemProps?.(item);
      const rowProps: React.ComponentProps<typeof Button> = {
        ...extra,
        ref: (node) => {
          if (node) rows.current.set(item.id, node); else rows.current.delete(item.id);
          if (typeof extra?.ref === "function") return extra.ref(node);
          if (extra?.ref) extra.ref.current = node;
        },
        role: "treeitem",
        "aria-label": item.label,
        "aria-level": depth + 1,
        "aria-setsize": siblings.length,
        "aria-posinset": index + 1,
        "aria-expanded": hasChildren ? open : undefined,
        "aria-owns": hasChildren && open ? groupId : undefined,
        "aria-selected": selectedId === item.id,
        tabIndex: selectedId === item.id ? 0 : -1,
        className: cn(
          "group relative w-full min-w-0 justify-start gap-2 border-0 text-foreground shadow-none transition-none focus-visible:ring-0",
          sortable && "touch-none select-none cursor-grab active:cursor-grabbing",
          sortable && grabbed === item.id
            ? "bg-black text-white hover:bg-black hover:text-white dark:hover:bg-black"
            : selectedId === item.id
              ? "bg-neutral-200 text-black hover:bg-neutral-200 hover:text-black dark:hover:bg-neutral-200"
              : "bg-transparent hover:bg-transparent hover:text-foreground dark:hover:bg-transparent",
          target === "inside" && "[&_span]:underline",
          target === "before" && "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-primary",
          target === "after" && "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary",
          extra?.className,
        ),
        onClick: (event) => {
          extra?.onClick?.(event);
          if (event.defaultPrevented) { event.preventBaseUIHandler(); return; }
          if (suppressClick.current) {
            event.preventDefault();
            event.preventBaseUIHandler();
            return;
          }
          select(item.id);
        },
        onFocus: (event) => {
          extra?.onFocus?.(event);
          setSelected(item.id);
          if (selectedId !== item.id) onSelectedIdChange?.(item.id);
        },
        onBlur: (event) => { extra?.onBlur?.(event); if (!drag.current) setGrabbed(null); },
        onKeyDown: (event) => {
          suppressClick.current = false;
          extra?.onKeyDown?.(event);
          if (!event.defaultPrevented) keyDown(event, item);
        },
        onKeyUp: (event) => {
          extra?.onKeyUp?.(event);
          if (event.defaultPrevented) return;
          if (event.key === " " && sortable && !drag.current) {
            event.preventDefault();
            setGrabbed(null);
            announce(`${item.label} released.`);
          }
        },
        onPointerDown: (event) => {
          extra?.onPointerDown?.(event);
          if (event.defaultPrevented) return;
          suppressClick.current = false;
          if (!sortable || event.button !== 0 || drag.current) return;
          event.preventDefault();
          select(item.id);
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { id: item.id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, active: false, target: null, handle: event.currentTarget };
        },
        onPointerMove: (event) => { extra?.onPointerMove?.(event); if (!event.defaultPrevented) pointerMove(event); },
        onPointerUp: (event) => { extra?.onPointerUp?.(event); pointerUp(event); },
        onPointerCancel: (event) => { extra?.onPointerCancel?.(event); cancelDrag(); },
        onLostPointerCapture: (event) => { extra?.onLostPointerCapture?.(event); cancelDrag(); },
      };
      const button = <Button {...rowProps} variant="ghost" size="sm"
        data-tree-item={item.id} data-depth={depth}
        data-selected={selectedId === item.id ? "" : undefined}
        data-grabbed={sortable && grabbed === item.id ? "" : undefined}
        data-drop-position={target ?? undefined} data-tree-draggable={sortable ? "" : undefined}>
        {renderItem ? renderItem(item) : <>{hasChildren ? <><ChevronRightIcon aria-hidden="true" className="transition-transform group-aria-expanded:rotate-90" /><FolderIcon aria-hidden="true" /></> : <FileIcon aria-hidden="true" />}
        <span className="truncate">{item.label}</span></>}
      </Button>;
      return <Collapsible key={item.id} open={open} onOpenChange={(nextOpen) => {
        if (suppressClick.current) return;
        setCollapsed((previous) => {
          const next = new Set(previous);
          if (nextOpen) next.delete(item.id); else next.add(item.id);
          return next;
        });
      }}>
        {hasChildren ? <CollapsibleTrigger render={button} /> : button}
        {hasChildren && <CollapsibleContent id={groupId} role="group" className="mt-1 ml-5">
          <div className="flex flex-col gap-1">{open && renderItems(item.id, depth + 1)}</div>
        </CollapsibleContent>}
      </Collapsible>;
    });
  }

  return <>
    <div {...props} role="tree" aria-label={label} aria-describedby={[props["aria-describedby"], instructionId].filter(Boolean).join(" ")} className={cn("flex flex-col gap-1", className)}>
      {renderItems(null)}
    </div>
    <p id={instructionId} className="sr-only">Use up and down to navigate visible rows, left to collapse, right to expand, Home or End to jump.{sortable ? " Hold Space and use up or down to reorder, right to group, left to ungroup. Release Space to finish. Drag rows to move items; Escape cancels a pointer drag." : ""}</p>
    <p role="status" className="sr-only" aria-live="polite">{announcement}</p>
  </>;
}
