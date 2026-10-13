import { Problem, Solution } from '../../core/content/catalog.model';
import { fromLevelOrder } from '../../core/tree/tree-builder';
import { TreeNode } from '../../core/tree/tree-node.model';
import { NodeVizState, StackFrame, TraceStep } from '../../core/trace/step.model';

/**
 * Instrumented reference solution for "Diameter of Binary Tree".
 *
 * The signature move of this family: the value each call RETURNS (its height)
 * and the value you are ultimately asked for (the best left+right path) are two
 * different quantities. The animation shows the height bubbling up as a node
 * badge, while `best` climbs in the variables panel — and peaks at an internal
 * node, not the root.
 *
 * Trace `line` values index the pseudocode; each language's code highlights via
 * its codeMap, because the global-best idiom doesn't line up 1:1 across languages.
 */
export function buildDiameterTrace(root: TreeNode | null): TraceStep[] {
  const steps: TraceStep[] = [];
  const states: Record<number, NodeVizState> = {};
  const stack: StackFrame[] = [];
  let id = 0;
  let best = 0;

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

  const depth = (node: TreeNode | null): number => {
    if (!node) {
      push(3, null, 'Empty subtree → height 0.');
      return 0;
    }
    stack.push({ nodeId: node.id, label: `depth(${node.val})` });
    states[node.id] = { status: 'active' };
    push(2, node.id, `Call depth(${node.val}).`);

    states[node.id] = { status: 'recursing' };
    push(4, node.id, `Get the LEFT subtree's height.`);
    const L = depth(node.left);

    states[node.id] = { status: 'recursing' };
    push(5, node.id, `Left height = ${L}. Get the RIGHT subtree's height.`, { L });
    const R = depth(node.right);

    const through = L + R;
    best = Math.max(best, through);
    push(6, node.id, `Path bending through ${node.val} = L + R = ${L} + ${R} = ${through} edge(s). best is now ${best}.`, { L, R, through, best });

    const height = 1 + Math.max(L, R);
    states[node.id] = { status: 'returned', returnValue: height };
    stack.pop();
    push(7, node.id, `Return my HEIGHT, 1 + max(${L}, ${R}) = ${height}, to my parent. (best stays ${best}.)`, { height, best });
    return height;
  };

  depth(root);
  push(9, root ? root.id : null, root ? `Done. The diameter is the largest path over all nodes = ${best} edge(s) — note it can bend at an internal node, not the root.` : 'The tree is empty, so the diameter is 0.', { diameter: best }, true);
  return steps;
}

const recursiveSolution: Solution = {
  id: 'recursive-dfs',
  name: 'Recursive DFS',
  tagline: 'Return each subtree’s height upward, and track the best left+right path on the side.',
  auxLabel: 'Call stack',
  complexity: {
    time: 'O(n)',
    timeWhy: 'Every node triggers exactly one depth call.',
    space: 'O(h)',
    spaceWhy: 'The recursion stack is as deep as the tree is tall — O(log n) balanced, O(n) skewed.',
  },
  approach: [
    'Depth is the right raw material — the diameter really is built from depths — but the naive "combine max-depth and min-depth" recipe has two bugs.',
    'Bug 1: min-depth is irrelevant. A path bending through a node goes deep on BOTH sides, so it is two max-type arms, never a max paired with a min.',
    'Bug 2: the longest path need not touch the root, so measuring only from the root is wrong. You must evaluate the local path at EVERY node.',
    'The reframe: at any node, the path bending through it (in edges) is leftHeight + rightHeight. The diameter is the max of that over all nodes. So each call returns its height upward, and separately tracks the best left+right it has seen.',
  ],
  recipe: {
    contract: 'depth(node) → the height of the subtree (nodes on its longest downward path); null → 0.',
    baseCase: 'node === null → 0',
    recurse: 'L = depth(left), R = depth(right)',
    combine: 'track best = max(best, L + R) (path through node, in edges); return 1 + max(L, R) (height, to the parent).',
  },
  pseudocode: [
    'diameterOfBinaryTree(root):',
    '  best ← 0',
    '  depth(node):',
    '    if node is null → return 0',
    '    L ← depth(node.left)',
    '    R ← depth(node.right)',
    '    best ← max(best, L + R)     // path through node, in edges',
    '    return 1 + max(L, R)        // height, to my parent',
    '  depth(root)',
    '  return best',
  ],
  code: {
    javascript: [
      'function diameterOfBinaryTree(root) {',
      '  let best = 0;',
      '  const depth = (node) => {',
      '    if (node === null) return 0;',
      '    const L = depth(node.left);',
      '    const R = depth(node.right);',
      '    best = Math.max(best, L + R);',
      '    return 1 + Math.max(L, R);',
      '  };',
      '  depth(root);',
      '  return best;',
      '}',
    ],
    python: [
      'def diameterOfBinaryTree(root):',
      '    best = [0]',
      '    def depth(node):',
      '        if node is None: return 0',
      '        L = depth(node.left)',
      '        R = depth(node.right)',
      '        best[0] = max(best[0], L + R)',
      '        return 1 + max(L, R)',
      '    depth(root)',
      '    return best[0]',
    ],
    java: [
      'int best = 0;',
      'int diameterOfBinaryTree(TreeNode root) {',
      '    depth(root);',
      '    return best;',
      '}',
      'int depth(TreeNode node) {',
      '    if (node == null) return 0;',
      '    int L = depth(node.left);',
      '    int R = depth(node.right);',
      '    best = Math.max(best, L + R);',
      '    return 1 + Math.max(L, R);',
      '}',
    ],
    cpp: [
      'int best = 0;',
      'int depth(TreeNode* node) {',
      '    if (node == nullptr) return 0;',
      '    int L = depth(node->left);',
      '    int R = depth(node->right);',
      '    best = max(best, L + R);',
      '    return 1 + max(L, R);',
      '}',
      'int diameterOfBinaryTree(TreeNode* root) {',
      '    depth(root);',
      '    return best;',
      '}',
    ],
  },
  codeMap: {
    javascript: [0, 1, 2, 3, 4, 5, 6, 7, -1, 8, 9, -1],
    java: [1, 0, 8, 9, -1, 2, 3, 4, 5, 6, 7, -1],
    cpp: [1, 2, 3, 4, 5, 6, 7, -1, 0, 8, 9, -1],
  },
  buildTrace: buildDiameterTrace,
};

export const diameterProblem: Problem = {
  id: 'diameter-of-binary-tree',
  title: 'Diameter of Binary Tree',
  dsId: 'trees',
  patternId: 'dfs-bubble-up',
  difficulty: 'Easy',
  leetcode: 543,
  statement:
    'Given the root of a binary tree, return its diameter: the number of edges on the longest path between any two nodes. The path need not pass through the root.',
  companies: [
    { name: 'Google' },
    { name: 'Amazon' },
    { name: 'Meta' },
    { name: 'Microsoft' },
    { name: 'Apple' },
    { name: 'Bloomberg' },
    { name: 'Adobe' },
    { name: 'ByteDance' },
    { name: 'Atlassian' },
    { name: 'Oracle' },
    { name: 'Intel' },
    { name: 'VMware' },
    { name: 'Baidu' },
    { name: 'Qualtrics' },
  ],
  experienceNote:
    'Easy to state, with real teeth — one of the more widely reported tree questions (Meta, Google, Amazon, Microsoft, Bloomberg, ByteDance and others). The “the answer isn’t what you return” insight is what interviewers are probing, which is why it appears even in senior loops.',
  keyRealization:
    'The longest path bending through a node is leftHeight + rightHeight (in edges), and the winning node is often NOT the root. So the function returns one quantity (height) upward while tracking a different one (the best left+right) at every node.',
  interview: [
    {
      heading: 'Clarifying the problem',
      exchanges: [
        {
          interviewer: "Return the diameter of a binary tree — the length of the longest path between any two nodes. Questions before you start?",
          candidate: "A couple. Is the length counted in EDGES or in nodes? LeetCode counts edges, so I'll go with that. And does the path have to pass through the root? I'll assume no — it can be anywhere in the tree.",
        },
        {
          interviewer: 'Edges, and no — it can be anywhere. Empty and single node?',
          candidate: "Both 0 — a single node is a path of length zero.",
        },
      ],
    },
    {
      heading: 'Approach',
      exchanges: [
        {
          interviewer: "Okay, what's your first idea?",
          candidate: "My instinct is that depth is the raw material — the longest path is made of depths. My first guess might be something like max-depth combined with min-depth, but let me check that against an example before I trust it, because I suspect two things can go wrong.",
        },
        {
          interviewer: 'Which two things?',
          candidate: "One — min-depth is irrelevant. A path that bends at a node goes deep down both sides, so it's two max-type arms, never a max-with-a-min. Two — the longest path doesn't have to touch the root, so I can't just measure from the root; I have to check the path at every node. The clean reframe: at each node, the path bending through it is leftHeight + rightHeight, and the diameter is the maximum of that over all nodes.",
        },
        {
          interviewer: 'So how does one DFS compute that?',
          candidate: "Each call returns its height to its parent, and on the side it updates a global best with left + right. That's the key move — the thing I return (height) and the thing I'm answering (best left+right) are two different quantities. Mixing them up is the classic bug.",
        },
      ],
    },
    {
      heading: 'Complexity',
      exchanges: [
        {
          interviewer: "Complexity?",
          candidate: "O(n) time — one depth call per node. O(h) space for the stack: O(log n) balanced, O(n) skewed. Same shape as plain max depth, just with a global best threaded through.",
        },
      ],
    },
    {
      heading: 'Follow-ups',
      exchanges: [
        {
          interviewer: "Nice. What if I asked for the maximum path SUM instead, where nodes have values and can be negative?",
          candidate: "Same skeleton, two tweaks. The arm a node contributes upward is value + max(leftArm, rightArm, 0) — the 0 lets me drop a negative subtree. And best becomes node.value + max(leftArm,0) + max(rightArm,0). Still 'return one arm, track a global best at every node.'",
        },
        {
          interviewer: 'Good — you clearly see the family.',
          candidate: "Right — diameter, max path sum, longest univalue path are all the same shape: return a clean summary up, track the real answer on the side. I just change what the arm is and what I track.",
        },
      ],
    },
    {
      heading: 'Wrapping up',
      exchanges: [
        {
          interviewer: "What would you test?",
          candidate: "Empty and single node for 0, a balanced tree, and crucially a tree where the longest path skips the root — to prove I'm checking every node and not just measuring from the top. That's the case a naive root-only answer gets wrong.",
        },
      ],
    },
  ],
  testCases: [
    { id: 'balanced', label: 'Balanced', why: 'Longest path runs leaf → up → across the root → down to another leaf = 4 edges.', levelOrder: [1, 2, 3, 4, 5, 6, 7], expected: 4 },
    { id: 'skips-root', label: 'Path skips the root', why: 'The longest path (5-3-2-4-6 = 4 edges) sits entirely inside the subtree at node 2 — the root is not on it. A root-only answer would wrongly say 3.', levelOrder: [1, 2, null, 3, 4, 5, null, null, 6], expected: 4, isEdge: true },
    { id: 'single', label: 'Single node', why: 'Edge case: a lone node is a path of length 0.', levelOrder: [1], expected: 0, isEdge: true },
    { id: 'empty', label: 'Empty tree', why: 'Edge case: no nodes → 0.', levelOrder: [], expected: 0, isEdge: true },
  ],
  solutions: [recursiveSolution],
};
