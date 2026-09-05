/**
 * Reducer invariant fuzzer. Applies random action sequences and checks that
 * workspace state stays coherent after every dispatch.
 *
 * Run directly: bun tests/workspace/reducer-fuzz.ts
 * Via bun test:  bun test tests/workspace/reducer-fuzz.test.ts
 */

import { createWorkspaceStore } from "@/registry/workspace/lib/store";
import { createInitialState } from "@/registry/workspace/lib/factory";
import type { WorkspaceState } from "@/registry/workspace/lib/types";
import type { WorkspaceAction } from "@/registry/workspace/lib/actions";

let failures = 0;

function checkInvariants(state: WorkspaceState, history: string[]) {
  const problems: string[] = [];

  // Every stack referenced by the tree or a floating surface must exist.
  const referencedStacks = new Set<string>();
  function walk(node: WorkspaceState["tiled"]) {
    if (node.type === "stack") referencedStacks.add(node.stackId);
    else {
      walk(node.first);
      walk(node.second);
    }
  }
  walk(state.tiled);
  for (const surface of Object.values(state.floating)) {
    referencedStacks.add(surface.stackId);
  }
  for (const surface of Object.values(state.popouts)) {
    referencedStacks.add(surface.stackId);
  }

  for (const stackId of referencedStacks) {
    if (!state.stacks[stackId]) {
      problems.push(`phantom stack "${stackId}" referenced but has no record`);
    }
  }

  // Every view listed in a stack must exist; activeViewId must be coherent.
  const placedViews = new Set<string>();
  for (const [stackId, stack] of Object.entries(state.stacks)) {
    if (stack.viewIds.length === 0) {
      if (stack.activeViewId !== null) {
        problems.push(`stack "${stackId}" empty but activeViewId set`);
      }
    } else if (
      stack.activeViewId === null ||
      !stack.viewIds.includes(stack.activeViewId)
    ) {
      problems.push(
        `stack "${stackId}" has views [${stack.viewIds.join(", ")}] but activeViewId=${stack.activeViewId}`,
      );
    }
    for (const viewId of stack.viewIds) {
      if (!state.views[viewId]) {
        problems.push(`stack "${stackId}" lists missing view "${viewId}"`);
      }
      if (placedViews.has(viewId)) {
        problems.push(`view "${viewId}" placed in more than one stack`);
      }
      placedViews.add(viewId);
    }
    if (!referencedStacks.has(stackId) && stack.viewIds.length > 0) {
      problems.push(`orphan stack "${stackId}" holds views but is unreachable`);
    }
  }

  // Every view reachable? (view may be gone if closed — that's fine.)
  for (const viewId of Object.keys(state.views)) {
    if (!placedViews.has(viewId)) {
      problems.push(`view "${viewId}" exists but is in no stack`);
    }
  }

  if (state.activeStackId !== null && !state.stacks[state.activeStackId]) {
    problems.push(`activeStackId "${state.activeStackId}" has no record`);
  }

  if (problems.length > 0) {
    failures += 1;
    console.log(`\n--- FAILURE #${failures} ---`);
    for (const line of history) console.log("  " + line);
    for (const problem of problems) console.log("  !! " + problem);
    console.log("STATE:", JSON.stringify(state, null, 1));
  }
}

const EDGES = ["top", "right", "bottom", "left", "center"] as const;
const VIEW_TYPES = ["editor", "files", "clock"];

/** Run the fuzzer. Returns the number of invariant failures. */
export function runFuzzer(
  seeds = 300,
  steps = 40,
  options: { quiet?: boolean } = {},
): number {
  let runFailures = 0;

  for (let seed = 0; seed < seeds; seed += 1) {
    let rng = seed * 2654435761;
    const random = () => {
      rng = (rng * 1103515245 + 12345) % 2147483648;
      return rng / 2147483648;
    };
    const pick = <T>(items: readonly T[]): T =>
      items[Math.floor(random() * items.length)]!;

    const store = createWorkspaceStore(
      createInitialState({
        direction: "horizontal",
        first: { views: [{ type: "editor", title: "Editor" }] },
        second: {
          direction: "vertical",
          first: { views: [{ type: "calculator", title: "Calculator" }] },
          second: { views: [{ type: "files", title: "Files" }] },
        },
      }),
    );

    const history: string[] = [];
    for (let step = 0; step < steps; step += 1) {
      const state = store.getState();
      const viewIds = Object.keys(state.views);
      const stackIds = Object.keys(state.stacks);
      const surfaceIds = Object.keys(state.floating);
      const popoutIds = Object.keys(state.popouts);

      let action: WorkspaceAction;
      const roll = random();
      if (roll < 0.15 || viewIds.length === 0) {
        action = {
          type: "view/open",
          viewType: pick(VIEW_TYPES),
          title: "Gen",
        };
      } else if (roll < 0.3) {
        action = { type: "view/close", viewId: pick(viewIds) };
      } else if (roll < 0.4) {
        action = { type: "view/activate", viewId: pick(viewIds) };
      } else if (roll < 0.5) {
        action = {
          type: "stack/split",
          direction: pick(["horizontal", "vertical"] as const),
          ...(random() < 0.5
            ? { viewType: pick(VIEW_TYPES), title: "Split" }
            : viewIds.length
              ? { viewId: pick(viewIds) }
              : { viewType: "editor" }),
        };
      } else if (roll < 0.55) {
        action = {
          type: "layout/resize",
          splitId: "nope",
          ratio: random(),
        };
      } else if (roll < 0.62) {
        action = { type: "view/float", viewId: pick(viewIds) };
      } else if (roll < 0.67 && surfaceIds.length > 0) {
        action = { type: "floating/close", surfaceId: pick(surfaceIds) };
      } else if (roll < 0.72 && surfaceIds.length > 0) {
        action = { type: "floating/focus", surfaceId: pick(surfaceIds) };
      } else if (roll < 0.78) {
        action = {
          type: "view/popout",
          surfaceId: `pop-${seed}-${step}`,
          viewId: pick(viewIds),
        };
      } else if (roll < 0.82 && popoutIds.length > 0) {
        action = { type: "popout/close", surfaceId: pick(popoutIds) };
      } else {
        action = {
          type: "view/move",
          viewId: pick(viewIds),
          targetStackId: pick(stackIds),
          edge: pick(EDGES),
        };
      }

      history.push(JSON.stringify(action).slice(0, 140));
      store.dispatch(action);
      checkInvariants(store.getState(), history);
      if (failures >= 5) break;
    }
    if (failures >= 5) break;
  }

  runFailures = failures;
  if (!options.quiet) {
    console.log(
      runFailures === 0
        ? `\nALL INVARIANTS HELD (${seeds} seeds × ${steps} steps)`
        : `\n${runFailures} failures`,
    );
  }
  return runFailures;
}

if (import.meta.main) {
  runFuzzer();
}
