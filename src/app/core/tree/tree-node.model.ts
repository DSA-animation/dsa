/**
 * A node in a binary tree.
 *
 * `id` is a stable identifier assigned at build time. The visualizer and the
 * (future) trace engine reference nodes by `id` so that a node keeps its
 * identity across animation steps and re-layouts — never by object reference
 * or by `val` (values can repeat).
 */
export interface TreeNode {
  readonly id: number;
  readonly val: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

/** A value in a LeetCode-style level-order array: a number, or `null` for an absent child. */
export type LevelOrderValue = number | null;
