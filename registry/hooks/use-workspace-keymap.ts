/**
 * Interprets the workspace keymap: one window-level keydown listener that
 * matches combos against WorkspaceCommands and applies them to the store.
 *
 * Mounted once at the <Workspace> root. Per-view key bindings stay inside
 * view components — this layer only owns workspace-level commands.
 */

import * as React from "react";

import { eventMatchesCombo } from "@/registry/lib/workspace/keymap";
import type { WorkspaceCommand } from "@/registry/lib/workspace/keymap";
import { useWorkspaceContext } from "@/registry/hooks/use-workspace";

export function useWorkspaceKeymap(): void {
  const { store, config } = useWorkspaceContext();
  const keymap = config.keymap;

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      for (const entry of Object.entries(keymap)) {
        const command = entry[0] as WorkspaceCommand;
        const combos = Array.isArray(entry[1]) ? entry[1] : [entry[1]];
        for (const combo of combos) {
          if (eventMatchesCombo(combo, event)) {
            event.preventDefault();
            store.applyCommand(command);
            return;
          }
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keymap, store]);
}
