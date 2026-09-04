/**
 * Floating surfaces layer: renders every floating window over the tiled
 * area. Geometry is owned by workspace state; each window hosts the same
 * placement-agnostic WorkspaceStack used in the tiled tree.
 */

import { FloatingWindow } from "@/registry/ui/floating-window";
import { WorkspaceStack } from "@/registry/ui/workspace-stack";
import {
  useWorkspaceConfig,
  useWorkspaceDispatch,
  useWorkspaceState,
} from "@/registry/hooks/use-workspace";

export function WorkspaceFloating() {
  const state = useWorkspaceState();
  const config = useWorkspaceConfig();
  const dispatch = useWorkspaceDispatch();

  const surfaces = Object.values(state.floating);
  if (surfaces.length === 0) return null;

  return (
    <>
      {surfaces.map((surface) => {
        const stack = state.stacks[surface.stackId];
        const activeView = stack?.activeViewId
          ? state.views[stack.activeViewId]
          : undefined;

        return (
          <FloatingWindow
            key={surface.id}
            position={{ x: surface.x, y: surface.y }}
            size={{ width: surface.width, height: surface.height }}
            onPositionChange={(position) =>
              dispatch({
                type: "floating/move",
                surfaceId: surface.id,
                x: position.x,
                y: position.y,
              })
            }
            onSizeChange={(size) =>
              dispatch({
                type: "floating/resize",
                surfaceId: surface.id,
                width: size.width,
                height: size.height,
              })
            }
            chrome={config.floating.chrome === "frame"}
            dragModifier={config.floating.dragModifier}
            zIndex={surface.zIndex}
            title={activeView?.title ?? "Window"}
            onClose={() =>
              dispatch({ type: "floating/close", surfaceId: surface.id })
            }
            onPointerDown={() =>
              dispatch({ type: "floating/focus", surfaceId: surface.id })
            }
            contentClassName="p-0"
          >
            <WorkspaceStack
              stackId={surface.stackId}
              className="h-full w-full rounded-none border-0"
            />
          </FloatingWindow>
        );
      })}
    </>
  );
}
