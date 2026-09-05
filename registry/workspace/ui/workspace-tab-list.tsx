/**
 * Tab strip for a single stack. Fully placement-agnostic: it reads its stack
 * from workspace state and works the same inside a split, a floating window,
 * or a popout.
 */

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  useWorkspaceDispatch,
  useWorkspaceState,
} from "@/registry/workspace/hooks/use-workspace";
import { useWorkspaceDrag } from "@/registry/workspace/hooks/use-workspace-drag";

export interface WorkspaceTabListProps
  extends React.HTMLAttributes<HTMLDivElement> {
  stackId: string;
}

export function WorkspaceTabList({
  stackId,
  className,
  ...props
}: WorkspaceTabListProps) {
  const state = useWorkspaceState();
  const dispatch = useWorkspaceDispatch();
  const dragContext = useWorkspaceDrag();

  const stack = state.stacks[stackId];
  if (!stack) return null;

  function startDrag(event: React.DragEvent<HTMLDivElement>, viewId: string) {
    if (!dragContext) return;
    dragContext.beginDrag(
      { viewId, sourceStackId: stackId },
      event.dataTransfer,
    );
  }

  return (
    <div
      role="tablist"
      className={cn(
        "flex h-9 items-stretch gap-0.5 overflow-x-auto border-b bg-muted/40 px-1",
        className,
      )}
      {...props}
    >
      {stack.viewIds.map((viewId) => {
        const view = state.views[viewId];
        if (!view) return null;
        const active = stack.activeViewId === viewId;
        return (
          <div
            key={viewId}
            role="tab"
            aria-selected={active}
            tabIndex={0}
            draggable
            onDragStart={(event) => startDrag(event, viewId)}
            onDragEnd={() => dragContext?.endDrag()}
            onClick={() => dispatch({ type: "view/activate", viewId })}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                dispatch({ type: "view/activate", viewId });
              }
            }}
            className={cn(
              "group flex max-w-48 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm outline-none select-none",
              "focus-visible:ring-ring/50 focus-visible:ring-2",
              active
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <span className="truncate">{view.title}</span>
            {view.closable !== false && <button
              type="button"
              aria-label={`Close ${view.title}`}
              onClick={(event) => {
                event.stopPropagation();
                dispatch({ type: "view/close", viewId });
              }}
              className={cn(
                "ml-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground/60",
                "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
                "hover:bg-accent hover:text-foreground",
                active && "opacity-70",
              )}
            >
              ×
            </button>}
          </div>
        );
      })}
    </div>
  );
}
