import { Problem, Solution } from '../../core/content/catalog.model';
import { fromLevelOrder } from '../../core/tree/tree-builder';
import { TreeNode } from '../../core/tree/tree-node.model';
import { NodeVizState, StackFrame, TraceStep } from '../../core/trace/step.model';

/**
 * Instrumented reference solution for "Balanced Binary Tree".
 *
 * The one-pass trick: a height() that returns the real height when the subtree
 * is balanced, or the sentinel -1 the moment anything below is not. The -1 is
 * born at the first unbalanced node (shown red), bubbles straight up, and
 * short-circuits — a node that gets -1 from its left child never even looks
 * right, so whole subtrees stay untouched.
 */
export function buildBalancedTrace(root: TreeNode | null): TraceStep[] {
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

  const height = (node: TreeNode | null): number => {
    if (!node) {
      push(3, null, 'Empty subtree → height 0.');
      return 0;
    }
    stack.push({ nodeId: node.id, label: `height(${node.val})` });
    states[node.id] = { status: 'active' };
    push(2, node.id, `Call height(${node.val}).`);

    states[node.id] = { status: 'recursing' };
    push(4, node.id, `Get the LEFT subtree's height.`);
    const lh = height(node.left);
    if (lh === -1) {
      states[node.id] = { status: 'broken', returnValue: -1 };
      stack.pop();
      push(5, node.id, `Left came back -1 — something below is unbalanced. I bubble -1 up WITHOUT even checking my right side.`, { lh: -1 });
      return -1;
    }

    states[node.id] = { status: 'recursing' };
    push(6, node.id, `Left height = ${lh}. Get the RIGHT subtree's height.`, { lh });
    const rh = height(node.right);
    if (rh === -1) {
      states[node.id] = { status: 'broken', returnValue: -1 };
      stack.pop();
      push(7, node.id, `Right came back -1 → bubble -1 up.`, { lh, rh: -1 });
      return -1;
    }

    const diff = Math.abs(lh - rh);
    if (diff > 1) {
      states[node.id] = { status: 'broken', returnValue: -1 };
      stack.pop();
      push(8, node.id, `|${lh} - ${rh}| = ${diff} > 1 — ${node.val} is UNBALANCED. The -1 sentinel is born here.`, { lh, rh, diff });
      return -1;
    }

    const h = 1 + Math.max(lh, rh);
    states[node.id] = { status: 'returned', returnValue: h };
    stack.pop();
    push(9, node.id, `|${lh} - ${rh}| ≤ 1, all good. Return my height 1 + max(${lh}, ${rh}) = ${h}.`, { lh, rh, height: h });
    return h;
  };

  const answer = height(root);
  const balanced = answer !== -1;
  push(1, root ? root.id : null, root ? `height(root) ${balanced ? 'is not -1' : 'is -1'} → the tree is ${balanced ? 'BALANCED' : 'NOT balanced'}.` : 'An empty tree is balanced.', { balanced: String(balanced) }, true);
  return steps;
}

const recursiveSolution: Solution = {
  id: 'recursive-dfs',
  name: 'Recursive DFS',
  tagline: 'One post-order pass: return the height, but hand back -1 the moment a subtree is unbalanced.',
  auxLabel: 'Call stack',
  complexity: {
    time: 'O(n)',
    timeWhy: 'One height call per node with constant work, and it short-circuits early. (The brute force recomputes heights → O(n²).)',
    space: 'O(h)',
    spaceWhy: 'The recursion stack is as deep as the tree is tall — O(log n) balanced, O(n) skewed.',
  },
  approach: [
    'Balanced means |height(left) − height(right)| ≤ 1 at EVERY node — not just the root. The root can look even while a node deep down is lopsided, so you must check all of them.',
    'The brute force computes a height at every node and re-checks the condition — but height re-walks the subtree on each call, so it is O(n²).',
    "The aha: isBalanced returns a boolean, which can't tell you how TALL a subtree is. When the info you must pass up (a height) differs from the answer you're asked for (a boolean), split into a helper that returns the height and a wrapper that translates it.",
    'One pass with a sentinel: upgrade height to return the real height if balanced, or -1 if anything below is unbalanced. A real height is never negative, so -1 is a safe flag that bubbles up the same channel and lets you short-circuit.',
  ],
  recipe: {
    contract: "height(node) → the subtree's height if balanced, or -1 if any node below is unbalanced.",
    baseCase: 'node === null → 0',
    recurse: 'lh = height(left); if lh is -1, bubble it up. rh = height(right); if rh is -1, bubble it up.',
    combine: '|lh − rh| > 1 → return -1 (unbalanced here); else return 1 + max(lh, rh).',
  },
  pseudocode: [
    'isBalanced(root):',
    '  return height(root) ≠ -1',
    '  height(node):',
    '    if node is null → return 0',
    '    lh ← height(node.left)',
    '    if lh = -1 → return -1',
    '    rh ← height(node.right)',
    '    if rh = -1 → return -1',
    '    if |lh - rh| > 1 → return -1',
    '    return 1 + max(lh, rh)',
  ],
  code: {
    javascript: [
      'function isBalanced(root) {',
      '  const height = (node) => {',
      '    if (node === null) return 0;',
      '    const lh = height(node.left);',
      '    if (lh === -1) return -1;',
      '    const rh = height(node.right);',
      '    if (rh === -1) return -1;',
      '    if (Math.abs(lh - rh) > 1) return -1;',
      '    return 1 + Math.max(lh, rh);',
      '  };',
      '  return height(root) !== -1;',
      '}',
    ],
    python: [
      'def isBalanced(root):',
      '    def height(node):',
      '        if node is None: return 0',
      '        lh = height(node.left)',
      '        if lh == -1: return -1',
      '        rh = height(node.right)',
      '        if rh == -1: return -1',
      '        if abs(lh - rh) > 1: return -1',
      '        return 1 + max(lh, rh)',
      '    return height(root) != -1',
    ],
    java: [
      'boolean isBalanced(TreeNode root) {',
      '    return height(root) != -1;',
      '}',
      'int height(TreeNode node) {',
      '    if (node == null) return 0;',
      '    int lh = height(node.left);',
      '    if (lh == -1) return -1;',
      '    int rh = height(node.right);',
      '    if (rh == -1) return -1;',
      '    if (Math.abs(lh - rh) > 1) return -1;',
      '    return 1 + Math.max(lh, rh);',
      '}',
    ],
    cpp: [
      'int height(TreeNode* node) {',
      '    if (node == nullptr) return 0;',
      '    int lh = height(node->left);',
      '    if (lh == -1) return -1;',
      '    int rh = height(node->right);',
      '    if (rh == -1) return -1;',
      '    if (abs(lh - rh) > 1) return -1;',
      '    return 1 + max(lh, rh);',
      '}',
      'bool isBalanced(TreeNode* root) {',
      '    return height(root) != -1;',
      '}',
    ],
  },
  codeMap: {
    javascript: [0, 2, 3, 4, 5, 6, 7, 8, 9, -1, 1, -1],
    python: [0, 2, 3, 4, 5, 6, 7, 8, 9, 1],
    java: [0, 1, -1, 2, 3, 4, 5, 6, 7, 8, 9, -1],
    cpp: [2, 3, 4, 5, 6, 7, 8, 9, -1, 0, 1, -1],
  },
  buildTrace: buildBalancedTrace,
};

export const balancedProblem: Problem = {
  id: 'balanced-binary-tree',
  title: 'Balanced Binary Tree',
  dsId: 'trees',
  patternId: 'dfs-bubble-up',
  difficulty: 'Easy',
  leetcode: 110,
  statement:
    'Given a binary tree, determine if it is height-balanced: for every node, the heights of its left and right subtrees differ by at most 1.',
  companies: [
    { name: 'Google' },
    { name: 'Amazon' },
    { name: 'Meta' },
    { name: 'Microsoft' },
    { name: 'Bloomberg' },
    { name: 'Adobe' },
    { name: 'Cisco' },
  ],
  experienceNote:
    'An Easy problem commonly reported at Google, Amazon, Meta, Microsoft, Bloomberg and Adobe. Interviewers watch for the −1 short-circuit that turns an O(n²) check into O(n) — that optimisation is the real signal here.',
  keyRealization:
    'When the info you must pass UP the recursion (a height) is a different type than the answer you are asked for (a boolean), split into a helper that returns the height and a wrapper that translates it — and encode the extra condition as a -1 sentinel riding on the height channel.',
  interview: [
    {
      heading: 'Clarifying the problem',
      exchanges: [
        {
          interviewer: "Determine whether a binary tree is height-balanced. What does that mean to you, and anything to clarify?",
          candidate: "Height-balanced means for EVERY node, the left and right subtree heights differ by at most 1 — not just the root. I'll treat an empty tree as balanced, and height as the node count on the longest downward path. Sound right?",
        },
        {
          interviewer: 'Yes. Why stress "every node"?',
          candidate: "Because the root can look perfectly even while a node deep down is lopsided — so a root-only check passes a tree that isn't actually balanced. I have to verify the condition everywhere.",
        },
      ],
    },
    {
      heading: 'Approach',
      exchanges: [
        {
          interviewer: "Okay, how would you do it?",
          candidate: "The literal reading is: at each node compute both subtree heights, check the difference, and recurse. That's correct but O(n²) — computing height re-walks the subtree, and I'd call it at every node. I'd mention that, then improve it.",
        },
        {
          interviewer: 'How do you get to O(n)?',
          candidate: "The key realization is that isBalanced returns a boolean, which can't tell me a subtree's height — so I'm forced into a height helper. And height already visits every node, so while it's down there I can also check balance in the same pass. I upgrade height to return the real height, or -1 if anything below is unbalanced. -1 can never be a real height, so it's a safe sentinel that bubbles straight up and lets me short-circuit.",
        },
      ],
    },
    {
      heading: 'Complexity',
      exchanges: [
        {
          interviewer: "Complexity of the sentinel version?",
          candidate: "O(n) time — one height call per node, constant work each, and it stops early the moment it sees -1. O(h) space for the recursion stack. That's the whole win over the O(n²) brute force: no subtree gets re-walked.",
        },
      ],
    },
    {
      heading: 'Follow-up',
      exchanges: [
        {
          interviewer: "You used a helper returning a height while the answer is a boolean. Where else does that split show up?",
          candidate: "All over the tree-DFS family. Diameter returns a height up but tracks the best left+right path on the side; maximum path sum returns an arm up but tracks a global best. Same move: the helper carries the info you recurse on, the wrapper (or a side variable) produces the actual answer.",
        },
      ],
    },
    {
      heading: 'Wrapping up',
      exchanges: [
        {
          interviewer: "What would you test?",
          candidate: "Empty and single node (both balanced), a genuinely balanced tree, and the important one — a tree whose imbalance is deep, not at the root, to prove the sentinel is born below and bubbles up, and that I short-circuit instead of exploring the rest.",
        },
      ],
    },
  ],
  testCases: [
    { id: 'balanced', label: 'Balanced', why: 'Every node is within 1 of its sibling subtree → balanced.', levelOrder: [3, 9, 20, null, null, 15, 7], expected: true },
    { id: 'deep-imbalance', label: 'Imbalance is deep', why: 'The -1 is born at node 2 (left subtree too tall), bubbles up to the root, and node 9 is never even visited → not balanced.', levelOrder: [1, 2, 9, 3, null, null, null, 4], expected: false, isEdge: true },
    { id: 'single', label: 'Single node', why: 'Edge case: no children → balanced.', levelOrder: [1], expected: true, isEdge: true },
    { id: 'empty', label: 'Empty tree', why: 'Edge case: an empty tree is balanced.', levelOrder: [], expected: true, isEdge: true },
  ],
  solutions: [recursiveSolution],
};
