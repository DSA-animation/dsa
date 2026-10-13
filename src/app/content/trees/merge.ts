import { Problem, Solution } from '../../core/content/catalog.model';
import { fromLevelOrder } from '../../core/tree/tree-builder';
import { TreeNode } from '../../core/tree/tree-node.model';
import { NodeVizState, StackFrame, TraceStep } from '../../core/trace/step.model';

/**
 * Builds the merged tree with a disjoint id range (2000+), deterministically,
 * so the player's render and the animation share identical node ids. New nodes
 * are created at every position that exists in either tree; overlapping nodes
 * hold the sum.
 */
function mergeBuild(a: TreeNode | null, b: TreeNode | null, c: { n: number }): TreeNode | null {
  if (!a && !b) return null;
  const node: TreeNode = { id: c.n++, val: (a ? a.val : 0) + (b ? b.val : 0), left: null, right: null };
  node.left = mergeBuild(a?.left ?? null, b?.left ?? null, c);
  node.right = mergeBuild(a?.right ?? null, b?.right ?? null, c);
  return node;
}

/**
 * Instrumented reference solution for "Merge Two Binary Trees".
 *
 * Three canvases: Tree 1, Tree 2, and the Merged result building up. Where both
 * trees have a node, the merged node is their sum; where only one has a node,
 * its whole subtree is brought over. The pair being merged lights up, and the
 * result node lands with the summed value.
 */
export function buildMergeTrace(rootA: TreeNode | null, _arg?: number, rootB?: TreeNode | null): TraceStep[] {
  const b2 = rootB ?? null;
  const steps: TraceStep[] = [];
  const states: Record<number, NodeVizState> = {};
  const stack: StackFrame[] = [];
  let id = 0;

  const result = mergeBuild(rootA, b2, { n: 2000 });

  const init = (n: TreeNode | null): void => {
    if (!n) return;
    states[n.id] = { status: 'idle' };
    init(n.left);
    init(n.right);
  };
  init(rootA);
  init(b2);
  init(result);

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

  const colorPair = (s: TreeNode | null, r: TreeNode | null): void => {
    if (!s || !r) return;
    states[s.id] = { status: 'returned' };
    states[r.id] = { status: 'returned' };
    colorPair(s.left, r.left);
    colorPair(s.right, r.right);
  };

  const go = (a: TreeNode | null, b: TreeNode | null, r: TreeNode | null): void => {
    if (!r) return;
    if (!a) {
      states[r.id] = { status: 'active' };
      if (b) states[b.id] = { status: 'active' };
      push(1, r.id, `Tree 1 is empty here — bring Tree 2's node ${b!.val} (and everything under it) into the merged tree as-is.`);
      colorPair(b, r);
      return;
    }
    if (!b) {
      states[r.id] = { status: 'active' };
      states[a.id] = { status: 'active' };
      push(2, r.id, `Tree 2 is empty here — bring Tree 1's node ${a.val} (and everything under it) into the merged tree as-is.`);
      colorPair(a, r);
      return;
    }
    states[a.id] = { status: 'active' };
    states[b.id] = { status: 'active' };
    states[r.id] = { status: 'active' };
    push(3, r.id, `Both overlap: ${a.val} + ${b.val} = ${r.val}. Place ${r.val} in the merged tree.`);
    states[a.id] = { status: 'returned' };
    states[b.id] = { status: 'returned' };
    states[r.id] = { status: 'returned' };
    go(a.left, b.left, r.left);
    go(a.right, b.right, r.right);
  };

  go(rootA, b2, result);
  push(6, result ? result.id : null, 'The merged tree is complete.', {}, true);
  return steps;
}

const recursiveSolution: Solution = {
  id: 'recursive-dfs',
  name: 'Recursive DFS',
  tagline: 'Overlay the trees: sum where both have a node, copy the subtree where only one does.',
  auxLabel: 'Call stack',
  complexity: {
    time: 'O(min(n, m))',
    timeWhy: 'You only create a new node where the two trees overlap; a non-overlapping subtree is carried over by reference in O(1), not re-walked.',
    space: 'O(h)',
    spaceWhy: 'Just the recursion stack — O(log n) balanced, O(n) skewed. (Merging in place adds no extra nodes.)',
  },
  approach: [
    'Think of it as overlaying Tree 2 on top of Tree 1. At each position: if both have a node, sum their values; if only one has a node, take that whole subtree as-is.',
    'The base cases ARE the copy rule: if a is null, return b (Tree 2’s subtree); if b is null, return a (Tree 1’s subtree). No work needed — just hand the existing subtree over.',
    'If both exist, make a node with a.val + b.val, then recurse into the left pair and the right pair and attach the results.',
    'You can merge in place into one of the trees to save memory, or build a fresh tree — same logic either way.',
  ],
  recipe: {
    contract: 'merge(a, b) → the root of the tree formed by overlaying a and b.',
    baseCase: 'a null → return b; b null → return a.',
    recurse: 'merge a.left with b.left, and a.right with b.right.',
    combine: 'a node with value a.val + b.val, with the two merged children attached.',
  },
  pseudocode: [
    'mergeTrees(a, b):',
    '  if a is null → return b',
    '  if b is null → return a',
    '  node ← new Node(a.val + b.val)',
    '  node.left  ← mergeTrees(a.left, b.left)',
    '  node.right ← mergeTrees(a.right, b.right)',
    '  return node',
  ],
  code: {
    javascript: [
      'function mergeTrees(a, b) {',
      '  if (a === null) return b;',
      '  if (b === null) return a;',
      '  const node = new TreeNode(a.val + b.val);',
      '  node.left = mergeTrees(a.left, b.left);',
      '  node.right = mergeTrees(a.right, b.right);',
      '  return node;',
      '}',
    ],
    python: [
      'def mergeTrees(a, b):',
      '    if a is None: return b',
      '    if b is None: return a',
      '    node = TreeNode(a.val + b.val)',
      '    node.left = mergeTrees(a.left, b.left)',
      '    node.right = mergeTrees(a.right, b.right)',
      '    return node',
    ],
    java: [
      'TreeNode mergeTrees(TreeNode a, TreeNode b) {',
      '    if (a == null) return b;',
      '    if (b == null) return a;',
      '    TreeNode node = new TreeNode(a.val + b.val);',
      '    node.left = mergeTrees(a.left, b.left);',
      '    node.right = mergeTrees(a.right, b.right);',
      '    return node;',
      '}',
    ],
    cpp: [
      'TreeNode* mergeTrees(TreeNode* a, TreeNode* b) {',
      '    if (a == nullptr) return b;',
      '    if (b == nullptr) return a;',
      '    TreeNode* node = new TreeNode(a->val + b->val);',
      '    node->left = mergeTrees(a->left, b->left);',
      '    node->right = mergeTrees(a->right, b->right);',
      '    return node;',
      '}',
    ],
  },
  buildTrace: buildMergeTrace,
  resultTree: (a, b) => mergeBuild(a, b, { n: 2000 }),
};

export const mergeProblem: Problem = {
  id: 'merge-two-binary-trees',
  title: 'Merge Two Binary Trees',
  dsId: 'trees',
  patternId: 'dual-tree',
  difficulty: 'Easy',
  leetcode: 617,
  statement:
    'Given two binary trees, overlay one on the other: where both have a node, the merged node is the sum of the two values; where only one has a node, that node (and its subtree) is used as-is. Return the merged tree.',
  dual: true,
  canvasLabels: { result: 'Merged' },
  companies: [
    { name: 'Amazon' },
    { name: 'Adobe' },
    { name: 'Oracle' },
    { name: 'Huawei' },
  ],
  experienceNote:
    'An Easy problem with a narrower reported footprint (Amazon, Adobe, Oracle, Huawei) than the FAANG-favourite tree questions. What interviewers check: do you see that the two null cases ARE the copy rule (return the other subtree), rather than writing extra code for “one side missing”.',
  keyRealization:
    'Overlay the two trees. Where both have a node, the merged node is their sum; where only one has a node, that whole subtree is carried over. The two null base cases express the copy rule for free.',
  interview: [
    {
      heading: 'Clarifying the problem',
      exchanges: [
        {
          interviewer: "Merge two binary trees: overlapping nodes sum, non-overlapping nodes are used as-is. Anything to clarify?",
          candidate: "A couple. When only one tree has a node at a position, I take that node AND its whole subtree, right? And can I mutate the input trees, or do I need a brand-new tree? Mutating one of them in place is cheaper if it's allowed.",
        },
        {
          interviewer: 'Take the whole subtree, yes. In place is fine.',
          candidate: "Great — then I can merge into Tree 1 and just attach Tree 2's subtrees where Tree 1 is missing nodes.",
        },
      ],
    },
    {
      heading: 'Approach',
      exchanges: [
        {
          interviewer: "How would you do it?",
          candidate: "Recurse both trees in lockstep. The elegant part is the base cases: if a is null, I just return b — that single line copies Tree 2's entire subtree over. Same if b is null, return a. If both exist, I sum the values into a node and recurse into the two left children and the two right children.",
        },
        {
          interviewer: "Why is 'return b' enough when a is null — don't you need to copy b's subtree?",
          candidate: "No — returning the reference to b's subtree is exactly the overlay. There's nothing on Tree 1's side to add, so b's subtree is already the merged result there. That's why the null cases do all the 'copy' work for free, with no extra code.",
        },
      ],
    },
    {
      heading: 'Complexity',
      exchanges: [
        {
          interviewer: "Complexity?",
          candidate: "O(min(n, m)) time — I only create or touch nodes where the two trees overlap; a non-overlapping subtree is handed over by reference in O(1). O(h) space for the recursion stack, and merging in place adds no new nodes.",
        },
      ],
    },
    {
      heading: 'Wrapping up',
      exchanges: [
        {
          interviewer: "What would you test?",
          candidate: "Two fully overlapping trees (pure sums), two of different shapes so some subtrees are copied from each side, and one tree empty (the result is just the other). The different-shapes case is the one that exercises both null base cases.",
        },
      ],
    },
  ],
  testCases: [
    { id: 'classic', label: 'Overlap + extend', why: 'Overlapping nodes sum (1+2=3, 3+1=4, 2+3=5…), and where only one tree reaches, that subtree is brought over.', levelOrder: [1, 3, 2, 5], levelOrderB: [2, 1, 3, null, 4, null, 7], expected: 3 },
    { id: 'pure-overlap', label: 'Pure overlap', why: 'Same shape, every node overlaps → the merged tree is the element-wise sum: [5, 7, 9].', levelOrder: [1, 2, 3], levelOrderB: [4, 5, 6], expected: 5 },
    { id: 'different-shapes', label: 'Different shapes', why: "Root sums (1+1=2); Tree 1's left 2 is copied where Tree 2 is empty, and Tree 2's right 2 is copied where Tree 1 is empty → [2, 2, 2].", levelOrder: [1, 2], levelOrderB: [1, null, 2], expected: 2, isEdge: true },
    { id: 'one-empty', label: 'One tree empty', why: 'Edge case: merging with an empty tree returns the other tree unchanged.', levelOrder: [1, 2, 3], levelOrderB: [], expected: 1, isEdge: true },
  ],
  solutions: [recursiveSolution],
};
