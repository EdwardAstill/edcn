export interface TreeNode {
  id: string;
  label: string;
  parentId: string | null;
}

export interface FlattenedTreeNode extends TreeNode {
  depth: number;
}

export function childrenOf(nodes: TreeNode[], parentId: string | null) {
  return nodes.filter((node) => node.parentId === parentId);
}

export function flattenTree(
  nodes: TreeNode[],
  parentId: string | null = null,
  depth = 0,
): FlattenedTreeNode[] {
  return childrenOf(nodes, parentId).flatMap((node) => [
    { ...node, depth },
    ...flattenTree(nodes, node.id, depth + 1),
  ]);
}

function inTreeOrder(nodes: TreeNode[]) {
  return flattenTree(nodes).map((node) => {
    const { depth, ...item } = node;
    void depth;
    return item;
  });
}

export function wouldCreateCycle(
  nodes: TreeNode[],
  draggedId: string,
  proposedParentId: string,
) {
  let currentId: string | null = proposedParentId;

  while (currentId !== null) {
    if (currentId === draggedId) return true;

    currentId =
      nodes.find((node) => node.id === currentId)?.parentId ?? null;
  }

  return false;
}

export function reparentNode(
  nodes: TreeNode[],
  draggedId: string,
  newParentId: string | null,
  newOrder?: number,
) {
  const draggedNode = nodes.find((node) => node.id === draggedId);

  if (
    !draggedNode ||
    draggedId === newParentId ||
    (newParentId && !nodes.some((node) => node.id === newParentId)) ||
    (newParentId && wouldCreateCycle(nodes, draggedId, newParentId))
  ) {
    return nodes;
  }

  const remaining = nodes.filter((node) => node.id !== draggedId);
  const destination = childrenOf(remaining, newParentId);
  const insertionIndex = Math.max(
    0,
    Math.min(newOrder ?? destination.length, destination.length),
  );
  const nextSibling = destination[insertionIndex];
  const previousSibling = destination[insertionIndex - 1];
  const parentIndex = newParentId
    ? remaining.findIndex((node) => node.id === newParentId)
    : -1;
  const nextNodeIndex = nextSibling
    ? remaining.findIndex((node) => node.id === nextSibling.id)
    : previousSibling
      ? remaining.findIndex((node) => node.id === previousSibling.id) + 1
      : parentIndex >= 0
        ? parentIndex + 1
        : remaining.length;
  const nextNodes = [...remaining];

  nextNodes.splice(nextNodeIndex, 0, {
    ...draggedNode,
    parentId: newParentId,
  });

  return inTreeOrder(nextNodes);
}

export function reorderNode(
  nodes: TreeNode[],
  draggedId: string,
  nextOrder: number,
) {
  const draggedNode = nodes.find((node) => node.id === draggedId);

  if (!draggedNode) return nodes;

  const siblings = childrenOf(nodes, draggedNode.parentId);
  const currentOrder = siblings.findIndex((node) => node.id === draggedId);
  const boundedOrder = Math.max(0, Math.min(nextOrder, siblings.length - 1));

  if (currentOrder === boundedOrder) return nodes;

  const reordered = [...siblings];
  const [movedNode] = reordered.splice(currentOrder, 1);

  if (!movedNode) return nodes;

  reordered.splice(boundedOrder, 0, movedNode);
  let siblingIndex = 0;
  const nextNodes = nodes.map((node) =>
    node.parentId === draggedNode.parentId
      ? (reordered[siblingIndex++] ?? node)
      : node,
  );

  return inTreeOrder(nextNodes);
}

export type DropPosition = "before" | "inside" | "after";

/** Move a branch relative to a target, retaining every descendant. */
export function dropNode(nodes: TreeNode[], id: string, targetId: string, position: DropPosition) {
  const target = nodes.find((node) => node.id === targetId);
  if (!target || wouldCreateCycle(nodes, id, targetId)) return nodes;
  if (position === "inside") return reparentNode(nodes, id, targetId);
  const siblings = childrenOf(nodes, target.parentId).filter((node) => node.id !== id);
  const index = siblings.findIndex((node) => node.id === targetId);
  return reparentNode(nodes, id, target.parentId, index + (position === "after" ? 1 : 0));
}
