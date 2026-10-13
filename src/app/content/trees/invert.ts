import { Problem, Solution } from '../../core/content/catalog.model';
import { fromLevelOrder } from '../../core/tree/tree-builder';
import { TreeNode } from '../../core/tree/tree-node.model';
import { NodeVizState, StackFrame, TraceStep } from '../../core/trace/step.model';

/** Builds the inverted (mirror) tree with a disjoint id range (2000+), deterministically. */
function invertBuild(a: TreeNode | null, c: { n: number }): TreeNode | null {
  if (!a) return null;
  const node: TreeNode = { id: c.n++, val: a.val, left: null, right: null };
  node.left = invertBuild(a.right, c);
  node.right = invertBuild(a.left, c);
  return node;
}

/**
 * Instrumented reference solution for "Invert Binary Tree".
 *
 * Two canvases: the Original and the Inverted (mirror) result. At each node we
 * swap its two children; the corresponding node fills into the Inverted tree,
 * so you watch the whole thing flip left-to-right, node by node.
 */
export function buildInvertTrace(root: TreeNode | null): TraceStep[] {
  const steps: TraceStep[] = [];
  const states: Record<number, NodeVizState> = {};
  const stack: StackFrame[] = [];
  let id = 0;

  const result = invertBuild(root, { n: 2000 });

  const init = (n: TreeNode | null): void => {
    if (!n) return;
    states[n.id] = { status: 'idle' };
    init(n.left);
    init(n.right);
  };
  init(root);
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

  const go = (orig: TreeNode | null, res: TreeNode | null): void => {
    if (!orig) return;
    states[orig.id] = { status: 'active' };
    if (res) states[res.id] = { status: 'active' };
    const kids = [orig.left, orig.right].filter((k): k is TreeNode => !!k);
    push(2, orig.id, kids.length ? `At ${orig.val}: swap its children (${kids.map((k) => k.val).join(' and ')}).` : `At ${orig.val}: a leaf — nothing to swap.`);
    states[orig.id] = { status: 'returned' };
    if (res) states[res.id] = { status: 'returned' };
    // In the inverted tree, orig.left lands on the right and orig.right on the left.
    go(orig.left, res ? res.right : null);
    go(orig.right, res ? res.left : null);
  };

  go(root, result);
  push(5, root ? root.id : null, root ? "Every node's children are swapped — the tree is fully inverted into its mirror." : 'An empty tree inverts to an empty tree.', {}, true);
  return steps;
}

const recursiveSolution: Solution = {
  id: 'recursive-dfs',
  name: 'Recursive DFS',
  tagline: "At every node, swap its two children and recurse — the whole tree flips into its mirror.",
  auxLabel: 'Call stack',
  complexity: {
    time: 'O(n)',
    timeWhy: 'Each node is visited once to swap its children.',
    space: 'O(h)',
    spaceWhy: 'The recursion stack is as deep as the tree is tall — O(log n) balanced, O(n) skewed.',
  },
  approach: [
    "To invert a tree is to produce its mirror image: at every node, the left and right children swap.",
    'Do it recursively: swap the current node’s two children, then invert each subtree.',
    "The order barely matters — swap-then-recurse or recurse-then-swap both work, as long as every node is swapped exactly once.",
    'Base case: a null node inverts to null.',
  ],
  recipe: {
    contract: 'invert(node) → the same node, with its entire subtree mirrored left-to-right.',
    baseCase: 'node null → null.',
    recurse: 'invert node.left and node.right.',
    combine: 'swap the two children (before or after recursing).',
  },
  pseudocode: [
    'invert(node):',
    '  if node is null → return null',
    '  swap node.left and node.right',
    '  invert(node.left)',
    '  invert(node.right)',
    '  return node',
  ],
  code: {
    javascript: [
      'function invertTree(node) {',
      '  if (node === null) return null;',
      '  [node.left, node.right] = [node.right, node.left];',
      '  invertTree(node.left);',
      '  invertTree(node.right);',
      '  return node;',
      '}',
    ],
    python: [
      'def invertTree(node):',
      '    if node is None: return None',
      '    node.left, node.right = node.right, node.left',
      '    invertTree(node.left)',
      '    invertTree(node.right)',
      '    return node',
    ],
    java: [
      'TreeNode invertTree(TreeNode node) {',
      '    if (node == null) return null;',
      '    TreeNode tmp = node.left; node.left = node.right; node.right = tmp;',
      '    invertTree(node.left);',
      '    invertTree(node.right);',
      '    return node;',
      '}',
    ],
    cpp: [
      'TreeNode* invertTree(TreeNode* node) {',
      '    if (node == nullptr) return nullptr;',
      '    swap(node->left, node->right);',
      '    invertTree(node->left);',
      '    invertTree(node->right);',
      '    return node;',
      '}',
    ],
  },
  buildTrace: buildInvertTrace,
  resultTree: (a) => invertBuild(a, { n: 2000 }),
};

export const invertProblem: Problem = {
  id: 'invert-binary-tree',
  title: 'Invert Binary Tree',
  dsId: 'trees',
  patternId: 'dfs-bubble-up',
  difficulty: 'Easy',
  leetcode: 226,
  canvasLabels: { primary: 'Original', result: 'Inverted' },
  statement:
    'Given the root of a binary tree, invert it — swap every node’s left and right children — and return the root of the mirrored tree.',
  companies: [
    { name: 'Google' },
    { name: 'Amazon' },
    { name: 'Meta' },
    { name: 'Microsoft' },
    { name: 'Bloomberg' },
    { name: 'Uber' },
    { name: 'Salesforce' },
    { name: 'VMware' },
  ],
  experienceNote:
    'The famous “invert a binary tree” warm-up — reported at Google, Amazon, Meta, Microsoft and Bloomberg. It’s a gimme on correctness; what an interviewer actually watches is whether you state it cleanly, handle null, and give the complexity without fuss.',
  keyRealization:
    "Inverting a tree is just: at every node, swap its two children, and recurse. The swap plus the recursion flips the whole tree into its mirror.",
  interview: [
    {
      heading: 'Clarifying the problem',
      exchanges: [
        {
          interviewer: "Invert a binary tree and return it. What does invert mean to you here?",
          candidate: "Mirror it left-to-right: at every node, the left and right subtrees swap. So the leftmost leaf ends up rightmost. I'll confirm — I can mutate the tree in place and return the same root?",
        },
        {
          interviewer: 'Yes, in place is fine.',
          candidate: "Then I don't need any extra tree — I just swap pointers as I go.",
        },
      ],
    },
    {
      heading: 'Approach',
      exchanges: [
        {
          interviewer: "Go ahead.",
          candidate: "Recursion. At each node I swap its left and right child, then invert each of those subtrees. Base case: a null node just returns null. That swap-and-recurse touches every node once and flips the whole tree.",
        },
        {
          interviewer: 'Does the order — swap before or after recursing — matter?',
          candidate: "Not for correctness: as long as each node is swapped exactly once, you get the mirror. If I recurse first then swap, I just have to swap the ORIGINAL children references, not re-read them after they've moved. Doing the swap first avoids that subtlety.",
        },
      ],
    },
    {
      heading: 'Complexity',
      exchanges: [
        {
          interviewer: "Complexity?",
          candidate: "O(n) time — one swap per node. O(h) space for the recursion stack; iteratively I could use a queue or stack and make it O(w) or O(h) explicitly.",
        },
      ],
    },
    {
      heading: 'Wrapping up',
      exchanges: [
        {
          interviewer: "What would you test?",
          candidate: "A full tree to see the whole mirror, a single node and an empty tree for the base cases, and maybe a lopsided tree to confirm a one-child node swaps correctly (the child moves to the other side).",
        },
      ],
    },
  ],
  testCases: [
    { id: 'classic', label: 'Full tree', why: "Every node's children flip, so the inverted tree is the left-right mirror: [4,7,2,9,6,3,1].", levelOrder: [4, 2, 7, 1, 3, 6, 9], expected: 4 },
    { id: 'two-level', label: 'Two levels', why: 'Just the root’s children swap: [1,2,3] inverts to [1,3,2].', levelOrder: [1, 2, 3], expected: 1 },
    { id: 'single', label: 'Single node', why: 'Edge case: a lone node is its own mirror.', levelOrder: [1], expected: 1, isEdge: true },
    { id: 'empty', label: 'Empty tree', why: 'Edge case: an empty tree inverts to an empty tree.', levelOrder: [], expected: 0, isEdge: true },
  ],
  solutions: [recursiveSolution],
};
