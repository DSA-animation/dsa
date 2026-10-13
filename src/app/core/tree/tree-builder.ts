import { LevelOrderValue, TreeNode } from './tree-node.model';

/**
 * Builds a binary tree from a LeetCode-style **level-order** array.
 *
 * Semantics (matching LeetCode): the array is a breadth-first listing where
 * `null` marks a missing child. Children of a `null` are simply omitted from
 * the array — we never enqueue a null, so its slots are not reserved.
 *
 * Example: `[3, 9, 20, null, null, 15, 7]` builds
 * ```
 *        3
 *       / \
 *      9   20
 *          / \
 *         15  7
 * ```
 *
 * Node ids are assigned in BFS order starting at 0 (root = 0).
 */
export function fromLevelOrder(values: readonly LevelOrderValue[], startId = 0): TreeNode | null {
  if (values.length === 0 || values[0] === null || values[0] === undefined) {
    return null;
  }

  let nextId = startId;
  const makeNode = (val: number): TreeNode => ({ id: nextId++, val, left: null, right: null });

  const root = makeNode(values[0]);
  const queue: TreeNode[] = [root];
  let i = 1;

  while (queue.length > 0 && i < values.length) {
    const parent = queue.shift()!;

    // Left child
    const leftVal = values[i++];
    if (leftVal !== null && leftVal !== undefined) {
      parent.left = makeNode(leftVal);
      queue.push(parent.left);
    }

    // Right child
    if (i < values.length) {
      const rightVal = values[i++];
      if (rightVal !== null && rightVal !== undefined) {
        parent.right = makeNode(rightVal);
        queue.push(parent.right);
      }
    }
  }

  return root;
}

/** Total number of nodes in the tree. */
export function countNodes(root: TreeNode | null): number {
  if (!root) return 0;
  return 1 + countNodes(root.left) + countNodes(root.right);
}
