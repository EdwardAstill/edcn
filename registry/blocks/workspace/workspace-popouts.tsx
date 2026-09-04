/**
 * Popout surfaces layer — hosts stacks in real browser windows.
 *
 * State owns only serializable facts (PopoutSurface); the live Window
 * handles live in this module. A window is opened synchronously inside the
 * user gesture via requestPopout() (popup blockers), then adopted here; the
 * reconcile effect also opens windows for restored/programmatic surfaces
 * and rolls surfaces back if the browser refuses.
 *
 * The child document gets a second React root rendering a WorkspaceProvider
 * bound to the SAME store instance, so a popout is a live viewport onto the
 * one workspace state — closing it (or its last tab) just edits state.
 *
 * Note: HTML5 drag & drop cannot cross browser windows, so dragging tabs
 * between the main window and popouts is out of scope by design.
 */

import * as React from "react";
import { createRoot, type Root } from "react-dom/client";

import { createId } from "@/registry/lib/workspace/ids";
import {
  DEFAULT_POPOUT_HEIGHT,
  DEFAULT_POPOUT_WIDTH,
} from "@/registry/lib/workspace/model/surface";
import type { WorkspaceStore } from "@/registry/lib/workspace/store";
import {
  WorkspaceProvider,
  useWorkspaceContext,
  useWorkspaceDispatch,
  useWorkspaceState,
} from "@/registry/hooks/use-workspace";
import { WorkspaceStack } from "@/registry/ui/workspace-stack";

interface LivePopout {
  win: Window;
  root: Root;
}

/** Windows opened inside the user gesture, awaiting their surface record. */
const pendingWindows = new Map<string, Window>();
/** surfaceId -> live window + React root. */
const livePopouts = new Map<string, LivePopout>();

/**
 * Pop out a view into its own browser window. MUST be called from a user
 * event handler (click) so window.open is not blocked; the window is opened
 * synchronously, then the surface is committed to state.
 */
export function requestPopout(store: WorkspaceStore, viewId: string): void {
  const state = store.getState();
  const view = state.views[viewId];
  if (!view) return;

  const surfaceId = createId("popout");
  const win = window.open(
    "",
    `edcn-popout-${surfaceId}`,
    `popup,width=${DEFAULT_POPOUT_WIDTH},height=${DEFAULT_POPOUT_HEIGHT}`,
  );
  if (!win) return; // popup blocked — nothing is committed to state

  pendingWindows.set(surfaceId, win);
  store.dispatch({
    type: "view/popout",
    surfaceId,
    viewId,
    width: DEFAULT_POPOUT_WIDTH,
    height: DEFAULT_POPOUT_HEIGHT,
  });
}

/** Clone the host document's styles into a popout document. */
function copyStyles(targetDoc: Document): void {
  for (const el of Array.from(
    document.head.querySelectorAll("style, link[rel=stylesheet]"),
  )) {
    targetDoc.head.appendChild(el.cloneNode(true));
  }
}

/**
 * Reconciles state.popouts with live browser windows. Renders nothing in
 * the main window; its effect owns the popout lifecycle.
 */
export function WorkspacePopouts(): null {
  const { store, views, config } = useWorkspaceContext();
  const state = useWorkspaceState();
  const dispatch = useWorkspaceDispatch();
  // Only the set of surface ids should re-run the reconcile effect.
  const surfaceIds = Object.keys(state.popouts).join(",");

  React.useEffect(() => {
    // Close windows whose surface was removed from state (last tab closed,
    // docked, or popout/close).
    for (const [surfaceId, entry] of Array.from(livePopouts)) {
      if (!state.popouts[surfaceId]) {
        entry.root.unmount();
        if (!entry.win.closed) entry.win.close();
        livePopouts.delete(surfaceId);
      }
    }

    // Open windows for surfaces that don't have one yet.
    for (const surface of Object.values(state.popouts)) {
      if (livePopouts.has(surface.id)) continue;

      const win =
        pendingWindows.get(surface.id) ??
        window.open(
          "",
          `edcn-popout-${surface.id}`,
          `popup,width=${surface.width},height=${surface.height}`,
        );
      pendingWindows.delete(surface.id);

      if (!win) {
        // Browser refused (programmatic open outside a gesture) — roll the
        // surface back so state never references a window that can't exist.
        dispatch({ type: "popout/close", surfaceId: surface.id });
        continue;
      }

      const doc = win.document;
      doc.title = "Workspace popout";
      copyStyles(doc);
      const container = doc.createElement("div");
      container.style.cssText = "position:fixed;inset:0;";
      doc.body.appendChild(container);

      const root = createRoot(container);
      root.render(
        React.createElement(
          WorkspaceProvider,
          { store, views, config },
          React.createElement(WorkspaceStack, {
            stackId: surface.stackId,
            className: "h-full w-full rounded-none border-0",
          }),
        ),
      );

      // Closing the OS window closes the surface (and its views).
      win.addEventListener("beforeunload", () => {
        dispatch({ type: "popout/close", surfaceId: surface.id });
      });

      livePopouts.set(surface.id, { win, root });
    }
    // surfaceIds keeps this effect from re-running on unrelated state edits.
  }, [surfaceIds, state.popouts, store, views, config, dispatch]);

  // Close every popout when the host unmounts.
  React.useEffect(() => {
    const entries = Array.from(livePopouts.values());
    return () => {
      for (const entry of entries) {
        entry.root.unmount();
        if (!entry.win.closed) entry.win.close();
      }
      livePopouts.clear();
    };
  }, []);

  return null;
}
