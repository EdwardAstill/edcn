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

import { WorkspaceProvider } from "@/registry/workspace/hooks/use-workspace";
import type { WorkspaceViewsMap } from "@/registry/workspace/hooks/use-workspace";
import { useWorkspaceKeymap } from "@/registry/workspace/hooks/use-workspace-keymap";
import { WorkspaceFloating } from "@/registry/workspace/components/workspace-floating";
import { WorkspacePopouts } from "@/registry/workspace/components/workspace-popouts";
import { WorkspaceTiled } from "@/registry/workspace/components/workspace-tiled";
import type { WorkspaceConfigInput } from "@/registry/workspace/lib/config";
import type { WorkspaceState } from "@/registry/workspace/lib/types";

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
