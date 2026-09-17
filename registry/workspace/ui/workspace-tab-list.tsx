/**
 * Tab strip for a single stack. Fully placement-agnostic: it reads its stack
 * from workspace state and works the same inside a split, a floating window,
 * or a popout.
 */

import * as React from "react";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useWorkspaceDispatch,
  useWorkspaceState,
  useWorkspaceStore,
} from "@/registry/workspace/hooks/use-workspace";
import { useWorkspaceDrag } from "@/registry/workspace/hooks/use-workspace-drag";
import { isSurfaceStack } from "@/registry/workspace/lib/model/surface";

export interface WorkspaceTabListProps
  extends React.HTMLAttributes<HTMLDivElement> {
  stackId: string;
}

export function WorkspaceTabList({
  stackId,
  className,
  children,
  ...props
}: WorkspaceTabListProps) {
  const state = useWorkspaceState();
  const dispatch = useWorkspaceDispatch();
  const dragContext = useWorkspaceDrag();
  const store = useWorkspaceStore();

  const stack = state.stacks[stackId];
  if (!stack) return null;

  function startDrag(event: React.DragEvent<HTMLDivElement>, viewId: string) {
    if (event.ctrlKey) {
      event.preventDefault();
      dragContext?.endDrag();
      return;
    }
    if (!dragContext) return;
    dragContext.beginDrag(
      { viewId, sourceStackId: stackId },
      event.dataTransfer,
    );
  }

  function startPointerDrag(event: React.PointerEvent<HTMLDivElement>, viewId: string) {
    if (!event.ctrlKey || event.button !== 0 || !dragContext || state.views[viewId]?.pinned) return;
    if ((event.target as Element).closest("button[aria-label]")) return;
    event.preventDefault();
    event.stopPropagation();
    const document = event.currentTarget.ownerDocument;
    const start = { x: event.clientX, y: event.clientY };
    let surfaceId: string | undefined;
    let offset = { x: 0, y: 0 };
    dragContext.trackPointer(document, event.pointerId, (move) => {
      if (!surfaceId) {
        if (Math.hypot(move.clientX - start.x, move.clientY - start.y) < 4) return;
        flushSync(() => {
          dragContext.endDrag();
          dispatch({ type: "view/float", viewId });
        });
        const current = store.getState();
        const surface = Object.values(current.floating).find((item) =>
          current.stacks[item.stackId]?.viewIds.includes(viewId),
        );
        if (!surface) return;
        const tab = Array.from(document.querySelectorAll<HTMLElement>("[data-workspace-view-id]"))
          .find((element) => element.dataset.workspaceViewId === viewId);
        if (!tab) return;
        const rect = tab.getBoundingClientRect();
        // Measure the rendered tab so frame chrome, container offsets, and
        // tab width all contribute to the cursor's actual center anchor.
        offset = {
          x: rect.left + rect.width / 2 - surface.x,
          y: rect.top + rect.height / 2 - surface.y,
        };
        surfaceId = surface.id;
      }
      dispatch({
        type: "floating/move", surfaceId,
        x: move.clientX - offset.x,
        y: move.clientY - offset.y,
      });
    });
  }

  return (
    <Tabs
      value={stack.activeViewId}
      onValueChange={(viewId) => {
        if (typeof viewId === "string") dispatch({ type: "view/activate", viewId });
      }}
      className="min-h-0 min-w-0 flex-1"
    >
      <TabsList className={className} {...props}>
        {stack.viewIds.map((viewId) => {
          const view = state.views[viewId];
          if (!view) return null;
          const active = stack.activeViewId === viewId;
          return (
            <div
              key={viewId}
              draggable
              onPointerDown={(event) => startPointerDrag(event, viewId)}
              onDragStart={(event) => startDrag(event, viewId)}
              onDragEnd={() => dragContext?.endDrag()}
              className="group relative h-full shrink-0"
            >
              <TabsTrigger
                data-workspace-view-id={viewId}
                value={viewId}
                onDoubleClick={() => dispatch({
                  type: isSurfaceStack(state, stackId) ? "view/dock" : "view/float",
                  viewId,
                })}
                className={cn("h-full max-w-48 px-2.5", view.closable !== false && "pr-7")}
              >
                <span className="truncate">{view.title}</span>
              </TabsTrigger>
              {view.closable !== false && <button
                type="button"
                aria-label={`Close ${view.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  dispatch({ type: "view/close", viewId });
                }}
                className={cn(
                  "absolute top-1/2 right-1.5 -translate-y-1/2 flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground/60",
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
      </TabsList>
      {children}
    </Tabs>
  );
}
