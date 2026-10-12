import { Problem, Solution } from '../../core/content/catalog.model';
import { fromLevelOrder } from '../../core/tree/tree-builder';
import { TreeNode } from '../../core/tree/tree-node.model';
import { NodeVizState, StackFrame, TraceStep } from '../../core/trace/step.model';

/**
 * Instrumented reference solution for "Minimum Depth of Binary Tree".
 *
 * The twist vs. max depth: a null child is NOT a leaf, so you can only take the
 * min when BOTH children exist — otherwise you're forced down the side that does.
 * The narration makes that guard explicit, which is the whole point of the problem.
 */
export function buildMinDepthTrace(root: TreeNode | null): TraceStep[] {
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

  const depth = (node: TreeNode | null, side: string): number => {
    if (!node) {
      push(1, null, `${side} is empty → 0.`);
      return 0;
    }
    stack.push({ nodeId: node.id, label: `minDepth(${node.val})` });
    states[node.id] = { status: 'active' };
    push(0, node.id, `Call minDepth(${node.val}).`);

    if (node.left === null) {
      states[node.id] = { status: 'recursing' };
      push(2, node.id, `${node.val}'s left child is missing — I can't stop at a non-leaf, so I'm forced down the RIGHT.`);
      const r = depth(node.right, `Right of ${node.val}`);
      const result = 1 + r;
      states[node.id] = { status: 'returned', returnValue: result };
      stack.pop();
      push(2, node.id, `${node.val}: forced right → 1 + ${r} = ${result}.`, { result });
      return result;
    }
    if (node.right === null) {
      states[node.id] = { status: 'recursing' };
      push(3, node.id, `${node.val}'s right child is missing — forced down the LEFT.`);
      const l = depth(node.left, `Left of ${node.val}`);
      const result = 1 + l;
      states[node.id] = { status: 'returned', returnValue: result };
      stack.pop();
      push(3, node.id, `${node.val}: forced left → 1 + ${l} = ${result}.`, { result });
      return result;
    }

    states[node.id] = { status: 'recursing' };
    push(4, node.id, `Both children exist, so I can safely take the MIN. Ask the left child of ${node.val}.`);
    const l = depth(node.left, `Left of ${node.val}`);
    push(4, node.id, `Left = ${l}. Now the right child of ${node.val}.`, { left: l });
    const r = depth(node.right, `Right of ${node.val}`);
    const result = 1 + Math.min(l, r);
    states[node.id] = { status: 'returned', returnValue: result };
    stack.pop();
    push(4, node.id, `${node.val}: 1 + min(${l}, ${r}) = ${result}.`, { left: l, right: r, result });
    return result;
  };

  const answer = depth(root, 'The tree');
  push(4, root ? root.id : null, root ? `Shortest root-to-leaf path = ${answer} node(s) → minimum depth = ${answer}.` : 'The tree is empty, so the minimum depth is 0.', { answer }, true);
  return steps;
}

const recursiveSolution: Solution = {
  id: 'recursive-dfs',
  name: 'Recursive DFS',
  tagline: "A node's min depth is 1 + the shorter side — but only when both sides exist.",
  auxLabel: 'Call stack',
  complexity: {
    time: 'O(n)',
    timeWhy: 'Each node is visited once.',
    space: 'O(h)',
    spaceWhy: 'The recursion stack is as deep as the tree is tall — O(log n) balanced, O(n) skewed.',
  },
  approach: [
    'It looks exactly like maximum depth with min swapped for max — and that is the trap.',
    'For max, a missing child is harmless: max(0, real) ignores the 0. For min, min(0, real) grabs the 0 — which pretends a node with one child is a leaf and returns a path that stops in mid-air.',
    'The fix: only take min when BOTH children exist. If a child is missing, you are forced down the side that does exist (you cannot stop at a non-leaf).',
    'Everything else is the same post-order DFS: base case null → 0, recurse, then combine on the way back up.',
  ],
  recipe: {
    contract: 'minDepth(node) → nodes on the shortest path from node to its nearest leaf.',
    baseCase: 'node === null → 0',
    recurse: 'the child/children that exist (both, or the one that is non-null).',
    combine: 'one child missing → 1 + the other; both present → 1 + min(left, right).',
  },
  pseudocode: [
    'minDepth(node):',
    '  if node is null → return 0',
    '  if left is null  → return 1 + minDepth(right)',
    '  if right is null → return 1 + minDepth(left)',
    '  return 1 + min(minDepth(left), minDepth(right))',
  ],
  code: {
    javascript: [
      'function minDepth(node) {',
      '  if (node === null) return 0;',
      '  if (node.left === null) return 1 + minDepth(node.right);',
      '  if (node.right === null) return 1 + minDepth(node.left);',
      '  return 1 + Math.min(minDepth(node.left), minDepth(node.right));',
      '}',
    ],
    python: [
      'def minDepth(node):',
      '    if node is None: return 0',
      '    if node.left is None: return 1 + minDepth(node.right)',
      '    if node.right is None: return 1 + minDepth(node.left)',
      '    return 1 + min(minDepth(node.left), minDepth(node.right))',
    ],
    java: [
      'int minDepth(TreeNode node) {',
      '    if (node == null) return 0;',
      '    if (node.left == null) return 1 + minDepth(node.right);',
      '    if (node.right == null) return 1 + minDepth(node.left);',
      '    return 1 + Math.min(minDepth(node.left), minDepth(node.right));',
      '}',
    ],
    cpp: [
      'int minDepth(TreeNode* node) {',
      '    if (node == nullptr) return 0;',
      '    if (node->left == nullptr) return 1 + minDepth(node->right);',
      '    if (node->right == nullptr) return 1 + minDepth(node->left);',
      '    return 1 + min(minDepth(node->left), minDepth(node->right));',
      '}',
    ],
  },
  buildTrace: buildMinDepthTrace,
};

export const minDepthProblem: Problem = {
  id: 'minimum-depth',
  title: 'Minimum Depth of Binary Tree',
  dsId: 'trees',
  patternId: 'dfs-bubble-up',
  difficulty: 'Easy',
  leetcode: 111,
  statement:
    'Given the root of a binary tree, return its minimum depth — the number of nodes along the shortest path from the root down to the nearest leaf (a node with no children).',
  companies: [
    { name: 'Amazon', level: '0–5 yrs' },
    { name: 'Microsoft', level: '0–5 yrs' },
    { name: 'Meta', level: '0–5 yrs' },
    { name: 'Apple', level: '0–5 yrs' },
    { name: 'Bloomberg', level: '0–5 yrs' },
    { name: 'Oracle', level: '0–5 yrs' },
  ],
  experienceNote:
    "Difficulty sets the level: an Easy warm-up asked broadly from new-grad to mid-level (~0–5 yrs). Interviewers love it because the null-child trap quietly separates careful candidates from those who pattern-match off maximum depth.",
  keyRealization:
    'Minimum depth looks like maximum depth with min for max — but a null child is NOT a leaf. You can only take min when both children exist; otherwise you are forced down the side that does.',
  testCases: [
    { id: 'balanced', label: 'Balanced', why: 'A well-shaped tree — the nearest leaf wins (here, the left child).', levelOrder: [3, 9, 20, null, null, 15, 7], expected: 2 },
    { id: 'empty', label: 'Empty tree', why: 'Edge case: root = null → 0.', levelOrder: [], expected: 0, isEdge: true },
    { id: 'single', label: 'Single node', why: 'Edge case: a lone node is itself a leaf → 1.', levelOrder: [1], expected: 1, isEdge: true },
    { id: 'one-sided', label: 'One-sided root (the trap)', why: 'Root has only a left child. Naive 1 + min(left, right) wrongly returns 1; the guard forces you down to the real leaf → 2.', levelOrder: [1, 2], expected: 2, isEdge: true },
  ],
  interview: [
    {
      heading: 'Clarifying the problem',
      exchanges: [
        {
          interviewer: "Return the minimum depth of a binary tree. Anything you want to nail down first?",
          candidate: "Yes — what exactly counts as the end of the path? I'll assume the path must reach a LEAF, a node with no children, and depth is the number of nodes on it. And empty tree returns 0, single node returns 1 — good?",
        },
        {
          interviewer: 'Correct on all counts. Leaf, node count, 0 for empty.',
          candidate: "Great, because 'nearest leaf' is the whole subtlety here — a node that's just missing one child is not an endpoint.",
        },
      ],
    },
    {
      heading: 'Approach',
      exchanges: [
        {
          interviewer: "Okay, how would you solve it?",
          candidate: "My first instinct is: it's maximum depth with min instead of max — 1 plus the shorter of the two children. But that's a trap, and I want to flag it before I write it.",
        },
        {
          interviewer: 'Go on — why is it a trap?',
          candidate: "For max, a missing child returns 0 and max(0, real) ignores it. For min, min(0, real) grabs the 0 — so a node with one child looks like depth 1, as if it were a leaf. But the path has to end at an actual leaf. So I only take min when BOTH children exist; if one side is null, I'm forced down the other side.",
        },
      ],
    },
    {
      heading: 'Complexity',
      exchanges: [
        {
          interviewer: "And complexity?",
          candidate: "O(n) time — every node once. O(h) space for the recursion stack: O(log n) balanced, O(n) if it's skewed.",
        },
        {
          interviewer: 'Could you do better in practice on a wide, shallow tree?',
          candidate: "Yes — BFS actually wins here. The first leaf you dequeue is at the minimum depth, so you can stop immediately instead of exploring the whole tree. Same O(n) worst case, but it short-circuits, and it avoids the deep recursion stack.",
        },
      ],
    },
    {
      heading: 'Wrapping up',
      exchanges: [
        {
          interviewer: "What would you test?",
          candidate: "Empty and single node, a balanced tree, and the key one — a root with only one child, to prove the guard works and I don't report 1. I'd also run a fully skewed tree.",
        },
        {
          interviewer: "Good. In one line, why did max need no such guard?",
          candidate: "Because max discards the null side's 0 for free, so a one-child node is harmless there. Min can't — it would seize that 0. That asymmetry is the entire problem.",
        },
      ],
    },
  ],
  solutions: [recursiveSolution],
};
