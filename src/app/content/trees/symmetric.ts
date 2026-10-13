import { Problem, Solution } from '../../core/content/catalog.model';
import { fromLevelOrder } from '../../core/tree/tree-builder';
import { TreeNode } from '../../core/tree/tree-node.model';
import { NodeVizState, StackFrame, TraceStep } from '../../core/trace/step.model';

/**
 * Instrumented reference solution for "Symmetric Tree".
 *
 * One tree, two pointers walking it in mirror: the left pointer's LEFT child is
 * paired with the right pointer's RIGHT child (the outer pair), and the left's
 * RIGHT with the right's LEFT (the inner pair). It's Same Tree with the two
 * recursive calls crossed. Both pointers highlight on the same canvas.
 */
export function buildSymmetricTrace(root: TreeNode | null): TraceStep[] {
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

  const mirror = (a: TreeNode | null, b: TreeNode | null): boolean => {
    if (!a && !b) {
      push(2, null, 'Both spots are empty → mirror here.');
      return true;
    }
    if (!a || !b) {
      if (a) states[a.id] = { status: 'broken' };
      if (b) states[b.id] = { status: 'broken' };
      push(3, a ? a.id : b!.id, `One side has a node (${a ? a.val : b!.val}) and the mirror side is empty → not symmetric → false.`);
      return false;
    }

    stack.push({ nodeId: a.id, label: `${a.val} ↔ ${b.val}` });
    states[a.id] = { status: 'active' };
    states[b.id] = { status: 'active' };
    push(1, a.id, `Mirror-compare ${a.val} with ${b.val}.`);

    if (a.val !== b.val) {
      states[a.id] = { status: 'broken' };
      states[b.id] = { status: 'broken' };
      stack.pop();
      push(4, a.id, `${a.val} ≠ ${b.val} → false.`);
      return false;
    }

    states[a.id] = { status: 'recursing' };
    states[b.id] = { status: 'recursing' };
    push(5, a.id, `${a.val} = ${b.val}. Compare the OUTER pair: ${a.val}'s LEFT child with ${b.val}'s RIGHT child.`);
    const outer = mirror(a.left, b.right);
    if (!outer) {
      states[a.id] = { status: 'broken' };
      states[b.id] = { status: 'broken' };
      stack.pop();
      push(5, a.id, `Outer pair isn't a mirror → false bubbles up (inner pair skipped).`);
      return false;
    }

    states[a.id] = { status: 'recursing' };
    states[b.id] = { status: 'recursing' };
    push(6, a.id, `Outer matched. Compare the INNER pair: ${a.val}'s RIGHT child with ${b.val}'s LEFT child.`);
    const inner = mirror(a.right, b.left);
    const ok = outer && inner;
    states[a.id] = { status: ok ? 'returned' : 'broken' };
    states[b.id] = { status: ok ? 'returned' : 'broken' };
    stack.pop();
    push(6, a.id, `outer = ${outer} AND inner = ${inner} → ${ok}.`);
    return ok;
  };

  if (!root) {
    push(7, null, 'An empty tree is symmetric → true.', { answer: 'true' }, true);
    return steps;
  }

  states[root.id] = { status: 'active' };
  push(7, root.id, `${root.val} is the axis. Check that its left and right subtrees are mirror images.`);
  states[root.id] = { status: 'recursing' };
  const ans = mirror(root.left, root.right);
  states[root.id] = { status: ans ? 'returned' : 'broken' };
  push(7, root.id, `The tree ${ans ? 'IS' : 'is NOT'} symmetric → ${ans}.`, { answer: String(ans) }, true);
  return steps;
}

const recursiveSolution: Solution = {
  id: 'recursive-dfs',
  name: 'Recursive DFS',
  tagline: "It's Same Tree, mirrored: a node's left pairs with its mirror's right, and its right with its mirror's left.",
  auxLabel: 'Call stack',
  complexity: {
    time: 'O(n)',
    timeWhy: 'Each node is visited once as part of a mirror pair.',
    space: 'O(h)',
    spaceWhy: 'The recursion stack is as deep as the tree is tall — O(log n) balanced, O(n) skewed.',
  },
  approach: [
    'Symmetric means the tree is a mirror image of itself across the root. The root is the axis; its left and right subtrees must be reflections of each other.',
    'Walk two pointers outward in mirror: the left pointer’s LEFT child pairs with the right pointer’s RIGHT child (the outer pair), and the left’s RIGHT pairs with the right’s LEFT (the inner pair).',
    "It's almost exactly Same Tree — same null guards, same value check — but the two recursive calls are crossed.",
    'The AND short-circuits on the first mismatch, so an asymmetry anywhere ends it immediately.',
  ],
  recipe: {
    contract: 'mirror(a, b) → true if the subtrees at a and b are mirror images of each other.',
    baseCase: 'both null → true; exactly one null → false.',
    recurse: 'pair a.left with b.right (outer), and a.right with b.left (inner).',
    combine: 'a.val == b.val AND the outer pair mirrors AND the inner pair mirrors.',
  },
  pseudocode: [
    'isSymmetric(root):',
    '  mirror(a, b):',
    '    if a is null and b is null → return true',
    '    if a is null or b is null → return false',
    '    if a.val ≠ b.val → return false',
    '    return mirror(a.left, b.right)',
    '           AND mirror(a.right, b.left)',
    '  return mirror(root.left, root.right)',
  ],
  code: {
    javascript: [
      'function isSymmetric(root) {',
      '  const mirror = (a, b) => {',
      '    if (a === null && b === null) return true;',
      '    if (a === null || b === null) return false;',
      '    if (a.val !== b.val) return false;',
      '    return mirror(a.left, b.right)',
      '        && mirror(a.right, b.left);',
      '  };  return !root || mirror(root.left, root.right);',
      '}',
    ],
    python: [
      'def isSymmetric(root):',
      '    def mirror(a, b):',
      '        if a is None and b is None: return True',
      '        if a is None or b is None: return False',
      '        if a.val != b.val: return False',
      '        return (mirror(a.left, b.right)',
      '                and mirror(a.right, b.left))',
      '    return not root or mirror(root.left, root.right)',
    ],
    java: [
      'boolean isSymmetric(TreeNode root) {',
      '    return root == null || mirror(root.left, root.right);',
      '}',
      'boolean mirror(TreeNode a, TreeNode b) {',
      '    if (a == null && b == null) return true;',
      '    if (a == null || b == null) return false;',
      '    if (a.val != b.val) return false;',
      '    return mirror(a.left, b.right)',
      '        && mirror(a.right, b.left);',
      '}',
    ],
    cpp: [
      'bool mirror(TreeNode* a, TreeNode* b) {',
      '    if (a == nullptr && b == nullptr) return true;',
      '    if (a == nullptr || b == nullptr) return false;',
      '    if (a->val != b->val) return false;',
      '    return mirror(a->left, b->right)',
      '        && mirror(a->right, b->left);',
      '}',
      'bool isSymmetric(TreeNode* root) {',
      '    return root == nullptr || mirror(root->left, root->right);',
      '}',
    ],
  },
  codeMap: {
    java: [0, 7, -1, 1, 2, 3, 4, 5, 6, -1],
    cpp: [1, 2, 3, 4, 5, 6, -1, 0, 7, -1],
  },
  buildTrace: buildSymmetricTrace,
};

export const symmetricProblem: Problem = {
  id: 'symmetric-tree',
  title: 'Symmetric Tree',
  dsId: 'trees',
  patternId: 'dual-tree',
  difficulty: 'Easy',
  leetcode: 101,
  statement:
    'Given the root of a binary tree, return true if it is a mirror of itself — i.e. symmetric around its center.',
  companies: [
    { name: 'Google' },
    { name: 'Amazon' },
    { name: 'Meta' },
    { name: 'Microsoft' },
    { name: 'Apple' },
    { name: 'Bloomberg' },
    { name: 'Adobe' },
    { name: 'LinkedIn' },
    { name: 'Uber' },
    { name: 'Oracle' },
    { name: 'Salesforce' },
    { name: 'Atlassian' },
    { name: 'Twitter' },
    { name: 'Visa' },
    { name: 'SAP' },
    { name: 'TripAdvisor' },
    { name: 'Yahoo' },
    { name: 'Yandex' },
  ],
  experienceNote:
    'One of the most broadly reported Easy tree questions — tagged at close to twenty companies (Google, Amazon, Meta, Microsoft, Apple, Bloomberg, LinkedIn and many more). The test is whether you mirror correctly: compare left.left with right.right, not a node with itself.',
  keyRealization:
    "A tree is symmetric if it is a mirror of itself. Compare the tree against itself with the recursion mirrored: a node's LEFT child pairs with its mirror's RIGHT child, and its RIGHT with its mirror's LEFT.",
  interview: [
    {
      heading: 'Clarifying the problem',
      exchanges: [
        {
          interviewer: "Return whether a binary tree is symmetric — a mirror of itself. What exactly does that mean?",
          candidate: "The left and right subtrees of the root must be mirror reflections: same values, but with the structure flipped left-to-right. An empty tree is symmetric. I'll confirm — it's about both shape and values being mirrored, not just the multiset of values?",
        },
        {
          interviewer: 'Right, mirrored shape and values.',
          candidate: "So a node's left child has to match the opposite node's right child — the comparison goes outside-in.",
        },
      ],
    },
    {
      heading: 'Approach',
      exchanges: [
        {
          interviewer: "How would you check it?",
          candidate: "This is Same Tree with a twist. I compare the root's left subtree against its right subtree with two pointers — but mirrored. At each step: both null is fine, exactly one null is a mismatch, values must be equal, and then I cross the recursion — the left pointer's LEFT child pairs with the right pointer's RIGHT child, and the left's RIGHT with the right's LEFT.",
        },
        {
          interviewer: 'What would go wrong if you just called isSameTree(root.left, root.right)?',
          candidate: "That checks whether the two subtrees are IDENTICAL, not mirrored — it pairs left-with-left. A symmetric tree is reflected, so the crossing (left-with-right) is exactly what makes it a mirror check instead of an equality check.",
        },
      ],
    },
    {
      heading: 'Complexity',
      exchanges: [
        {
          interviewer: "Complexity?",
          candidate: "O(n) time — every node is visited once as half of a mirror pair. O(h) space for the recursion stack.",
        },
      ],
    },
    {
      heading: 'Follow-up',
      exchanges: [
        {
          interviewer: "Could you do it iteratively?",
          candidate: "Yes — a queue (or stack) of pairs. Seed it with (root.left, root.right); each round dequeue a pair, apply the same null/value checks, then enqueue the two crossed pairs: (a.left, b.right) and (a.right, b.left). Same logic, no recursion stack.",
        },
      ],
    },
    {
      heading: 'Wrapping up',
      exchanges: [
        {
          interviewer: "What would you test?",
          candidate: "A clean symmetric tree, one that's asymmetric because a mirror pair has one side present and the other missing, a single node and an empty tree. The asymmetric-structure case is the one that proves my crossing and null guards are right.",
        },
      ],
    },
  ],
  testCases: [
    { id: 'symmetric', label: 'Symmetric', why: 'Left and right subtrees are perfect mirrors → true; every pair matches, so the tree ends green.', levelOrder: [1, 2, 2, 3, 4, 4, 3], expected: true },
    { id: 'asymmetric', label: 'Not symmetric', why: "The left 2's missing left child is paired with the right 2's present right child (value 3) → a mirror mismatch, so false.", levelOrder: [1, 2, 2, null, 3, null, 3], expected: false, isEdge: true },
    { id: 'single', label: 'Single node', why: 'Edge case: a lone node mirrors itself → true.', levelOrder: [1], expected: true, isEdge: true },
    { id: 'empty', label: 'Empty tree', why: 'Edge case: an empty tree is symmetric → true.', levelOrder: [], expected: true, isEdge: true },
  ],
  solutions: [recursiveSolution],
};
