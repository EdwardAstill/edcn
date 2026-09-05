/**
 * Workspace persistence — serialize/deserialize WorkspaceState.
 *
 * State is plain serializable data, so persistence is a JSON envelope with a
 * schema version plus structural validation on load: corrupted or foreign
 * payloads deserialize to null (callers keep their current state) instead of
 * injecting garbage into the reducer.
 *
 * What is intentionally NOT persisted: view working state (useViewWorkingState
 * is a session-level map) and live Window handles for popouts (the popouts
 * layer re-opens windows for restored surfaces).
 */

import type { LayoutNode, WorkspaceState } from "./types";

const SCHEMA_VERSION = 1;

interface PersistedEnvelope {
  version: number;
  state: WorkspaceState;
}

export function serializeWorkspaceState(state: WorkspaceState): string {
  const envelope: PersistedEnvelope = { version: SCHEMA_VERSION, state };
  return JSON.stringify(envelope);
}

/** Deserialize a payload produced by serializeWorkspaceState. */
export function deserializeWorkspaceState(json: string): WorkspaceState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const envelope = parsed as Partial<PersistedEnvelope>;
  if (envelope.version !== SCHEMA_VERSION) return null;
  if (!isWorkspaceStateShape(envelope.state)) return null;
  return envelope.state;
}

/** Pragmatic structural check — shape only, no referential validation. */
function isWorkspaceStateShape(value: unknown): value is WorkspaceState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Record<string, unknown>;
  return (
    isRecordOfObjects(state.views) &&
    isRecordOfObjects(state.stacks) &&
    isLayoutNodeShape(state.tiled) &&
    (state.activeStackId === null || typeof state.activeStackId === "string") &&
    isRecordOfObjects(state.floating) &&
    isRecordOfObjects(state.popouts) &&
    typeof state.nextZIndex === "number"
  );
}

function isRecordOfObjects(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).every(
    (entry) => typeof entry === "object" && entry !== null,
  );
}

function isLayoutNodeShape(value: unknown): value is LayoutNode {
  if (typeof value !== "object" || value === null) return false;
  const node = value as Record<string, unknown>;
  if (node.type === "stack") return typeof node.stackId === "string";
  if (node.type === "split") {
    return (
      typeof node.id === "string" &&
      (node.direction === "horizontal" || node.direction === "vertical") &&
      typeof node.ratio === "number" &&
      isLayoutNodeShape(node.first) &&
      isLayoutNodeShape(node.second)
    );
  }
  return false;
}
