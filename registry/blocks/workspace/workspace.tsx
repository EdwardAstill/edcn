/**
 * <Workspace> — the full workspace system block.
 *
 * Owns the store (via WorkspaceProvider), resolves the consumer's views map
 * and config, mounts the keymap listener, and renders the surfaces: the
 * tiled tree, floating windows, and popout browser windows.
 *
 * ```tsx
 * <Workspace
 *   views={{ editor: EditorView, calculator: CalculatorView }}
 *   initialState={createInitialState({ ... })}
 *   config={{ floating: { chrome: "frameless", dragModifier: "ctrl" } }}
 * />
 * ```
 */

import { WorkspaceProvider } from "@/registry/hooks/use-workspace";
import type { WorkspaceViewsMap } from "@/registry/hooks/use-workspace";
import { useWorkspaceKeymap } from "@/registry/hooks/use-workspace-keymap";
import { WorkspaceFloating } from "@/registry/blocks/workspace/workspace-floating";
import { WorkspacePopouts } from "@/registry/blocks/workspace/workspace-popouts";
import { WorkspaceTiled } from "@/registry/blocks/workspace/workspace-tiled";
import type { WorkspaceConfigInput } from "@/registry/lib/workspace/config";
import type { WorkspaceState } from "@/registry/lib/workspace/types";

export interface WorkspaceProps {
   views: WorkspaceViewsMap;
   initialState: WorkspaceState;
   config?: WorkspaceConfigInput;
   className?: string;
}

export function Workspace({
   views,
   initialState,
   config,
   className,
}: WorkspaceProps) {
   return (
      <div className={className ?? "absolute inset-0"}>
         <WorkspaceProvider
            views={views}
            initialState={initialState}
            config={config}
         >
            <WorkspaceKeymapListener />
            <WorkspaceTiled />
            <WorkspaceFloating />
            <WorkspacePopouts />
         </WorkspaceProvider>
      </div>
   );
}

/** Hook host: useWorkspaceKeymap registers a window-level listener. */
function WorkspaceKeymapListener() {
   useWorkspaceKeymap();
   return null;
}
