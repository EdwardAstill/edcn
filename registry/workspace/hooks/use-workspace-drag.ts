/**
 * Workspace drag & drop context — interaction state for docking views by
 * dragging tabs. Deliberately NOT part of the reducer: an in-flight drag is
 * UI state, not workspace content (no persistence, no history entry).
 *
 * Behavior ported from tiling-tabs: native HTML5 drag from tabs, live drop
 * preview via dropTarget {stackId, edge}, dispatch on drop.
 */

import * as React from "react";

import { computeDropEdge } from "@/registry/workspace/lib/drop-edge";
import type { DropEdge } from "@/registry/workspace/lib/drop-edge";

export interface WorkspaceDragInfo {
  viewId: string;
  sourceStackId: string;
}

export interface WorkspaceDropTarget {
  stackId: string;
  edge: DropEdge;
}

interface WorkspaceDragContextValue {
  drag: WorkspaceDragInfo | null;
  dropTarget: WorkspaceDropTarget | null;
  beginDrag(info: WorkspaceDragInfo, dataTransfer?: DataTransfer | null): void;
  updateDropTarget(
    stackId: string,
    point: { x: number; y: number },
    element: Element,
  ): void;
  clearDropTarget(): void;
  endDrag(): void;
  trackPointer(document: Document, pointerId: number, onMove: (event: PointerEvent) => void): void;
}

const WorkspaceDragContext =
  React.createContext<WorkspaceDragContextValue | null>(null);

export function WorkspaceDragProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drag, setDrag] = React.useState<WorkspaceDragInfo | null>(null);
  const stopPointer = React.useRef<(() => void) | null>(null);
  React.useEffect(() => () => stopPointer.current?.(), []);
  const [dropTarget, setDropTarget] =
    React.useState<WorkspaceDropTarget | null>(null);

  const value = React.useMemo<WorkspaceDragContextValue>(
    () => ({
      drag,
      dropTarget,
      beginDrag(info, dataTransfer) {
        if (dataTransfer) {
          dataTransfer.effectAllowed = "move";
          dataTransfer.setData("text/plain", info.viewId);
        }
        setDrag(info);
      },
      updateDropTarget(stackId, point, element) {
        setDropTarget({
          stackId,
          edge: computeDropEdge(point, element.getBoundingClientRect()),
        });
      },
      clearDropTarget() {
        setDropTarget(null);
      },
      endDrag() {
        setDrag(null);
        setDropTarget(null);
      },
      trackPointer(document, pointerId, onMove) {
        stopPointer.current?.();
        const move = (event: PointerEvent) => {
          if (event.pointerId === pointerId) onMove(event);
        };
        const end = (event: PointerEvent) => {
          if (event.pointerId === pointerId) stop();
        };
        const stop = () => {
          document.removeEventListener("pointermove", move);
          document.removeEventListener("pointerup", end);
          document.removeEventListener("pointercancel", end);
          document.defaultView?.removeEventListener("blur", stop);
          stopPointer.current = null;
        };
        stopPointer.current = stop;
        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", end);
        document.addEventListener("pointercancel", end);
        document.defaultView?.addEventListener("blur", stop);
      },
    }),
    [drag, dropTarget],
  );

  // createElement keeps this a .ts file (no JSX) while providing context.
  return React.createElement(
    WorkspaceDragContext.Provider,
    { value },
    children,
  );
}

/** Null when no provider is mounted — drag sources/targets then no-op. */
export function useWorkspaceDrag(): WorkspaceDragContextValue | null {
  return React.useContext(WorkspaceDragContext);
}
