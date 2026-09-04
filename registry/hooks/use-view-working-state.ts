/**
 * Per-view persistent state.
 *
 * Moving a view between stacks/surfaces (tab switch, split, float, dock)
 * remounts its component, which wipes plain useState. Views therefore keep
 * their working state HERE, keyed by the view's stable id — so an editor
 * keeps its text when it floats, and a calculator keeps its display when
 * it docks.
 *
 * Usage: const [text, setText] = useViewWorkingState(view.id, () => "");
 *
 * Note: entries live for the page session (module-level map). Good enough
 * for workspace view state; wire cleanup into view/close if it ever matters.
 */

import * as React from "react";

const states = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function subscribe(viewId: string, listener: () => void): () => void {
  let set = listeners.get(viewId);
  if (!set) {
    set = new Set();
    listeners.set(viewId, set);
  }
  set.add(listener);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(viewId);
  };
}

function emit(viewId: string): void {
  for (const listener of listeners.get(viewId) ?? []) listener();
}

export function useViewWorkingState<T>(
  viewId: string,
  initializer: () => T,
): readonly [T, (next: T | ((prev: T) => T)) => void] {
  // Seed on first mount. The initializer is captured so re-renders don't
  // re-run it; the value itself lives in the module-level map.
  const initializerRef = React.useRef(initializer);
  if (!states.has(viewId)) {
    states.set(viewId, initializerRef.current());
  }

  const subscribeFn = React.useCallback(
    (listener: () => void) => subscribe(viewId, listener),
    [viewId],
  );
  const getSnapshot = React.useCallback(
    () => states.get(viewId) as T,
    [viewId],
  );
  const state = React.useSyncExternalStore(
    subscribeFn,
    getSnapshot,
    getSnapshot,
  );

  const setState = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = states.get(viewId) as T;
      const value =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      if (Object.is(value, prev)) return;
      states.set(viewId, value);
      emit(viewId);
    },
    [viewId],
  );

  return [state, setState] as const;
}
