import { Problem, Solution } from '../../core/content/catalog.model';
import { fromLevelOrder } from '../../core/tree/tree-builder';
import { TreeNode } from '../../core/tree/tree-node.model';
import { NodeVizState, StackFrame, TraceStep } from '../../core/trace/step.model';

/**
 * Instrumented reference solution for "Path Sum".
 *
 * Top-down accumulator: instead of carrying the running sum up, carry the
 * leftover DOWN — subtract each node's value from the target still needed. At a
 * real leaf the problem collapses to one check. The current path glows as the
 * recursion descends; the winning path turns green as `true` bubbles up, and OR
 * short-circuits so whole subtrees are never touched.
 */
export function buildPathSumTrace(root: TreeNode | null, arg?: number): TraceStep[] {
  const target = arg ?? 0;
  const steps: TraceStep[] = [];
  const states: Record<number, NodeVizState> = {};
  const stack: StackFrame[] = [];
  let id = 0;

  (function init(n: TreeNode | null): void {
    if (!n) return;
    states[n.id] = { status: 'idle' };
    init(n.left);
    init(n.right);
  })(root);

  const push = (line: number, focusNodeId: number | null, note: string, vars: Record<string, number | string> = {}, done = false): void => {
    steps.push({
      id: id++,
      line,
      focusNodeId,
      note,
      vars,
      done,
      nodeStates: JSON.parse(JSON.stringify(states)) as Record<number, NodeVizState>,
      callStack: stack.map((f) => ({ ...f })),
    });
  };

  const go = (node: TreeNode | null, remaining: number): boolean => {
    if (!node) {
      push(1, null, `Reached an empty spot → no path here (false).`, { remaining });
      return false;
    }
    stack.push({ nodeId: node.id, label: `${node.val} · need ${remaining}` });
    states[node.id] = { status: 'active' };
    push(0, node.id, `At ${node.val}, I still need ${remaining} to hit the target.`, { remaining });

    if (!node.left && !node.right) {
      const ok = node.val === remaining;
      states[node.id] = { status: ok ? 'returned' : 'recursing' };
      stack.pop();
      push(2, node.id, `${node.val} is a leaf. Is ${node.val} == ${remaining}? ${ok ? 'YES — this root-to-leaf path sums to the target!' : 'No, this path misses.'}`, { remaining, match: String(ok) });
      return ok;
    }

    const next = remaining - node.val;
    push(3, node.id, `Subtract ${node.val}: a child must now reach ${remaining} − ${node.val} = ${next}.`, { remaining, next });

    push(4, node.id, `Ask the LEFT child for a path summing to ${next}.`, { need: next });
    const l = go(node.left, next);
    if (l) {
      states[node.id] = { status: 'returned' };
      stack.pop();
      push(4, node.id, `Left found a path — OR short-circuits, so I never even check the right side. Return true.`);
      return true;
    }

    push(5, node.id, `Left had no path. Ask the RIGHT child for ${next}.`, { need: next });
    const r = go(node.right, next);
    states[node.id] = { status: r ? 'returned' : 'recursing' };
    stack.pop();
    push(5, node.id, `left = false OR right = ${r} → ${r}.`);
    return r;
  };

  const ans = go(root, target);
  push(5, root ? root.id : null, `A root-to-leaf path summing to ${target} ${ans ? 'EXISTS' : 'does NOT exist'} → ${ans}.`, { answer: String(ans) }, true);
  return steps;
}

const recursiveSolution: Solution = {
  id: 'recursive-dfs',
  name: 'Recursive DFS',
  tagline: "Carry the leftover target down; at a leaf, just ask if its value equals what's left.",
  auxLabel: 'Call stack',
  complexity: {
    time: 'O(n)',
    timeWhy: 'Worst case visits every node once; the OR can short-circuit as soon as one path works.',
    space: 'O(h)',
    spaceWhy: 'Recursion stack depth = tree height — O(log n) balanced, O(n) skewed.',
  },
  approach: [
    'The phrase "root-to-leaf path whose values sum to a target" is the tell: path + leaf + per-node aggregation on a tree ⇒ tree DFS.',
    'Brute force enumerates every root-to-leaf path and sums it — correct, but it materializes whole paths just to add them up.',
    'The insight: don\'t carry the running sum UP and compare at the end — carry the leftover DOWN. Subtract each node\'s value from the target still needed, so every node faces the same question with a smaller target.',
    'At a real leaf the whole problem collapses to one check: is this leaf\'s value exactly the remaining? The subtraction is the bookkeeping, so no path is ever stored.',
  ],
  recipe: {
    contract: 'hasPathSum(node, remaining) → true if a root-to-leaf path from node sums to remaining.',
    baseCase: 'null → false; leaf → node.val == remaining.',
    recurse: 'ask left and right the same question with (remaining − node.val).',
    combine: 'a path exists if LEFT has one OR RIGHT has one.',
  },
  pseudocode: [
    'hasPathSum(node, remaining):',
    '  if node is null → return false',
    '  if node is a leaf → return node.val == remaining',
    '  remaining ← remaining - node.val',
    '  return hasPathSum(node.left, remaining)',
    '         OR hasPathSum(node.right, remaining)',
  ],
  code: {
    javascript: [
      'function hasPathSum(node, remaining) {',
      '  if (node === null) return false;',
      '  if (!node.left && !node.right) return node.val === remaining;',
      '  remaining = remaining - node.val;',
      '  return hasPathSum(node.left, remaining)',
      '      || hasPathSum(node.right, remaining);',
      '}',
    ],
    python: [
      'def hasPathSum(node, remaining):',
      '    if node is None: return False',
      '    if not node.left and not node.right: return node.val == remaining',
      '    remaining = remaining - node.val',
      '    return (hasPathSum(node.left, remaining)',
      '            or hasPathSum(node.right, remaining))',
    ],
    java: [
      'boolean hasPathSum(TreeNode node, int remaining) {',
      '    if (node == null) return false;',
      '    if (node.left == null && node.right == null) return node.val == remaining;',
      '    remaining = remaining - node.val;',
      '    return hasPathSum(node.left, remaining)',
      '        || hasPathSum(node.right, remaining);',
      '}',
    ],
    cpp: [
      'bool hasPathSum(TreeNode* node, int remaining) {',
      '    if (node == nullptr) return false;',
      '    if (!node->left && !node->right) return node->val == remaining;',
      '    remaining = remaining - node->val;',
      '    return hasPathSum(node->left, remaining)',
      '        || hasPathSum(node->right, remaining);',
      '}',
    ],
  },
  buildTrace: buildPathSumTrace,
};

export const pathSumProblem: Problem = {
  id: 'path-sum',
  title: 'Path Sum',
  dsId: 'trees',
  patternId: 'top-down',
  difficulty: 'Easy',
  leetcode: 112,
  statement:
    'Given the root of a binary tree and an integer targetSum, return true if the tree has a root-to-leaf path whose values add up to targetSum. A leaf is a node with no children. (Node values can be negative.)',
  companies: [
    { name: 'Amazon' },
    { name: 'Meta' },
    { name: 'Microsoft' },
    { name: 'Apple' },
    { name: 'Adobe' },
    { name: 'Oracle' },
    { name: 'Yahoo' },
    { name: 'Zillow' },
  ],
  experienceNote:
    'An Easy warm-up reported at Amazon, Meta, Microsoft, Apple, Adobe and Oracle. The value interviewers extract: do you carry the remaining target DOWN each path rather than summing upward, and do you get the leaf condition exactly right.',
  keyRealization:
    "Don't carry the running sum up to compare at the end — carry the leftover DOWN. Subtract each node's value from the target as you descend; at a leaf the whole problem collapses to one check: does this leaf's value equal the remaining?",
  interview: [
    {
      heading: 'Clarifying the problem',
      exchanges: [
        {
          interviewer: "Given a tree and a targetSum, return true if some root-to-leaf path sums to it. Questions first?",
          candidate: "A couple. The path must start at the root and end at a LEAF — not at any node that happens to be missing a child, right? And what about an empty tree — I'll return false even if the target is 0, since there's no path at all.",
        },
        {
          interviewer: 'Correct — real leaf, and empty is false. Anything about the values?',
          candidate: "Yes — are negative values allowed? If so, I can't prune a branch just because the remaining went negative; a later negative node could bring it back. Good to know before I optimize.",
        },
      ],
    },
    {
      heading: 'Approach',
      exchanges: [
        {
          interviewer: "Okay, how would you solve it?",
          candidate: "Tree DFS, carrying the leftover down. Rather than building each path and summing at the end, I subtract the current node's value from the target as I descend. Every node then faces the same question with a smaller target. At a leaf I just check whether its value equals the remaining.",
        },
        {
          interviewer: 'Why not check at a null with remaining == 0?',
          candidate: "That's the classic trap. A node with one child would hit the null side with remaining 0 and falsely 'succeed', reporting a path that doesn't reach a leaf. Only a real leaf — both children null — may close out a path.",
        },
      ],
    },
    {
      heading: 'Complexity',
      exchanges: [
        {
          interviewer: "Complexity?",
          candidate: "O(n) time worst case — every node once — though the OR short-circuits the moment one side finds a path. O(h) space for the recursion stack.",
        },
      ],
    },
    {
      heading: 'Follow-ups',
      exchanges: [
        {
          interviewer: "What if I wanted all the qualifying paths, not just whether one exists?",
          candidate: "That's Path Sum II — same descent, but I append the node on the way down and pop it on the way back (backtracking), and when a leaf matches I record a copy of the current path.",
        },
        {
          interviewer: 'And the maximum path sum, any node to any node?',
          candidate: "Different shape — that one goes back to post-order: each node returns its best downward arm, and I track a global best of left-arm + node + right-arm. Same family as diameter.",
        },
      ],
    },
    {
      heading: 'Wrapping up',
      exchanges: [
        {
          interviewer: "What would you test?",
          candidate: "Empty (false), a single leaf equal to the target, the classic example with a winning deep path, and a one-child node to prove I don't false-positive on the null side. If negatives are in scope, a case where a negative node rescues the sum.",
        },
      ],
    },
  ],
  testCases: [
    { id: 'classic', label: 'Classic · target 22', why: 'The winning path 5 → 4 → 11 → 2 = 22. Once found, OR short-circuits and the entire 8-subtree is never visited.', levelOrder: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1], arg: 22, expected: true },
    { id: 'no-path', label: 'No matching path · target 5', why: 'Root-to-leaf sums are 1+2=3 and 1+3=4 — neither is 5.', levelOrder: [1, 2, 3], arg: 5, expected: false, isEdge: true },
    { id: 'single', label: 'Single leaf · target 7', why: 'Edge case: a lone leaf matches the target.', levelOrder: [7], arg: 7, expected: true, isEdge: true },
    { id: 'empty', label: 'Empty · target 0', why: 'Edge case: no path exists in an empty tree, so false even for target 0.', levelOrder: [], arg: 0, expected: false, isEdge: true },
  ],
  solutions: [recursiveSolution],
};
