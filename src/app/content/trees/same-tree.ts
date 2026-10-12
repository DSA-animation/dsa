import { Problem, Solution } from '../../core/content/catalog.model';
import { fromLevelOrder } from '../../core/tree/tree-builder';
import { TreeNode } from '../../core/tree/tree-node.model';
import { NodeVizState, StackFrame, TraceStep } from '../../core/trace/step.model';

/**
 * Instrumented reference solution for "Same Tree".
 *
 * Two trees, recursed in lockstep (one pointer into each). The pair being
 * compared lights up in both canvases; a mismatch (null-vs-node or a value
 * diff) turns red, a matched subtree turns green, and AND short-circuits so
 * the rest is never visited. Tree 2's nodes carry a disjoint id range, so a
 * single nodeStates map drives both canvases.
 */
export function buildSameTreeTrace(rootA: TreeNode | null, _arg?: number, rootB?: TreeNode | null): TraceStep[] {
  const steps: TraceStep[] = [];
  const states: Record<number, NodeVizState> = {};
  const stack: StackFrame[] = [];
  let id = 0;

  const init = (n: TreeNode | null): void => {
    if (!n) return;
    states[n.id] = { status: 'idle' };
    init(n.left);
    init(n.right);
  };
  init(rootA);
  init(rootB ?? null);

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

  const same = (a: TreeNode | null, b: TreeNode | null): boolean => {
    if (!a && !b) {
      push(1, null, 'Both spots are empty → they match here.');
      return true;
    }
    if (!a || !b) {
      if (a) states[a.id] = { status: 'broken' };
      if (b) states[b.id] = { status: 'broken' };
      push(2, a ? a.id : b!.id, `${a ? `Tree 1 has ${a.val}` : `Tree 2 has ${b!.val}`} but the other tree is empty here → structures differ → false.`);
      return false;
    }

    stack.push({ nodeId: a.id, label: `(${a.val}, ${b.val})` });
    states[a.id] = { status: 'active' };
    states[b.id] = { status: 'active' };
    push(0, a.id, `Compare ${a.val} (Tree 1) with ${b.val} (Tree 2).`);

    if (a.val !== b.val) {
      states[a.id] = { status: 'broken' };
      states[b.id] = { status: 'broken' };
      stack.pop();
      push(3, a.id, `${a.val} ≠ ${b.val} → values differ → false.`);
      return false;
    }

    states[a.id] = { status: 'recursing' };
    states[b.id] = { status: 'recursing' };
    push(4, a.id, `${a.val} = ${b.val}. Now compare the LEFT children.`);
    const l = same(a.left, b.left);
    if (!l) {
      states[a.id] = { status: 'broken' };
      states[b.id] = { status: 'broken' };
      stack.pop();
      push(4, a.id, `Left subtrees differ → false bubbles up (AND short-circuits, the right side is skipped).`);
      return false;
    }

    states[a.id] = { status: 'recursing' };
    states[b.id] = { status: 'recursing' };
    push(5, a.id, `Left matched. Now compare the RIGHT children.`);
    const r = same(a.right, b.right);
    const ok = l && r;
    states[a.id] = { status: ok ? 'returned' : 'broken' };
    states[b.id] = { status: ok ? 'returned' : 'broken' };
    stack.pop();
    push(5, a.id, `left = ${l} AND right = ${r} → ${ok}.`);
    return ok;
  };

  const ans = same(rootA, rootB ?? null);
  push(5, rootA ? rootA.id : null, `The two trees are ${ans ? 'IDENTICAL' : 'DIFFERENT'} → ${ans}.`, { answer: String(ans) }, true);
  return steps;
}

const recursiveSolution: Solution = {
  id: 'recursive-dfs',
  name: 'Recursive DFS',
  tagline: 'Recurse into both trees in lockstep: match ⇔ same value here AND left matches AND right matches.',
  auxLabel: 'Call stack',
  complexity: {
    time: 'O(min(n, m))',
    timeWhy: 'Each matched pair is visited once, and the first mismatch stops everything — so you never exceed the smaller tree.',
    space: 'O(h)',
    spaceWhy: 'The recursion stack is as deep as the tree is tall — O(log n) balanced, O(n) skewed.',
  },
  approach: [
    'Compare the two trees position by position, recursing into BOTH at once — think one pointer into each tree, moving together.',
    'Handle the base cases first: if both are null, this spot matches. If exactly one is null, the shapes already differ → false.',
    'If both nodes exist, the values must be equal, AND the left subtrees must match, AND the right subtrees must match.',
    'The AND short-circuits — the first mismatch (a null-vs-node, a value difference, or a differing subtree) ends it immediately, so the rest of the trees is never compared.',
  ],
  recipe: {
    contract: 'isSameTree(a, b) → true if the trees at a and b are identical in both shape and values.',
    baseCase: 'both null → true; exactly one null → false.',
    recurse: 'compare a.left with b.left, and a.right with b.right.',
    combine: 'a.val == b.val AND left matches AND right matches.',
  },
  pseudocode: [
    'isSameTree(a, b):',
    '  if a is null and b is null → return true',
    '  if a is null or b is null → return false',
    '  if a.val ≠ b.val → return false',
    '  return isSameTree(a.left, b.left)',
    '         AND isSameTree(a.right, b.right)',
  ],
  code: {
    javascript: [
      'function isSameTree(a, b) {',
      '  if (a === null && b === null) return true;',
      '  if (a === null || b === null) return false;',
      '  if (a.val !== b.val) return false;',
      '  return isSameTree(a.left, b.left)',
      '      && isSameTree(a.right, b.right);',
      '}',
    ],
    python: [
      'def isSameTree(a, b):',
      '    if a is None and b is None: return True',
      '    if a is None or b is None: return False',
      '    if a.val != b.val: return False',
      '    return (isSameTree(a.left, b.left)',
      '            and isSameTree(a.right, b.right))',
    ],
    java: [
      'boolean isSameTree(TreeNode a, TreeNode b) {',
      '    if (a == null && b == null) return true;',
      '    if (a == null || b == null) return false;',
      '    if (a.val != b.val) return false;',
      '    return isSameTree(a.left, b.left)',
      '        && isSameTree(a.right, b.right);',
      '}',
    ],
    cpp: [
      'bool isSameTree(TreeNode* a, TreeNode* b) {',
      '    if (a == nullptr && b == nullptr) return true;',
      '    if (a == nullptr || b == nullptr) return false;',
      '    if (a->val != b->val) return false;',
      '    return isSameTree(a->left, b->left)',
      '        && isSameTree(a->right, b->right);',
      '}',
    ],
  },
  buildTrace: buildSameTreeTrace,
};

export const sameTreeProblem: Problem = {
  id: 'same-tree',
  title: 'Same Tree',
  dsId: 'trees',
  patternId: 'dual-tree',
  difficulty: 'Easy',
  leetcode: 100,
  statement:
    'Given the roots of two binary trees p and q, return true if they are the same tree — identical in structure and in every node value.',
  dual: true,
  companies: [
    { name: 'Amazon', level: '0–5 yrs' },
    { name: 'Microsoft', level: '0–5 yrs' },
    { name: 'Google', level: '0–5 yrs' },
    { name: 'Meta', level: '0–5 yrs' },
    { name: 'Apple', level: '0–5 yrs' },
    { name: 'Bloomberg', level: '0–5 yrs' },
  ],
  experienceNote:
    "An Easy warm-up (~0–5 yrs), but a load-bearing one: the 'recurse two trees in lockstep' move is the engine for Symmetric Tree and Subtree of Another Tree, so interviewers use it to check your base-case discipline.",
  keyRealization:
    'To compare two trees, recurse into BOTH in lockstep. They match iff both are null here, OR both are non-null with equal values AND matching left subtrees AND matching right subtrees.',
  interview: [
    {
      heading: 'Clarifying the problem',
      exchanges: [
        {
          interviewer: "Given two binary trees, decide whether they're the same. What does 'same' mean to you?",
          candidate: "Identical in both structure and values — same shape, and every corresponding node has the same value. Two empty trees count as the same. I'll confirm: it's not just the same set of values, it's the same arrangement?",
        },
        {
          interviewer: 'Right — same arrangement, position for position.',
          candidate: "Good, so a tree with 2 on the left is different from the same tree with 2 on the right, even though the values match.",
        },
      ],
    },
    {
      heading: 'Approach',
      exchanges: [
        {
          interviewer: "How would you check that?",
          candidate: "Recurse into both trees at the same time — one pointer in each. At each step: if both nodes are null, they match here. If exactly one is null, the shapes differ, so false. If both exist, their values must match, and then recursively the left pair must match and the right pair must match.",
        },
        {
          interviewer: 'Why handle the null cases before comparing values?',
          candidate: "Because if I touch a.val while a is null, I crash. The both-null and one-null checks guard that and also encode the structural comparison — one-null is exactly how a shape difference shows up.",
        },
      ],
    },
    {
      heading: 'Complexity',
      exchanges: [
        {
          interviewer: "Complexity?",
          candidate: "O(min(n, m)) time — I stop at the first mismatch and never go past the smaller tree; worst case O(n) when they're identical. O(h) space for the recursion stack.",
        },
      ],
    },
    {
      heading: 'Follow-ups',
      exchanges: [
        {
          interviewer: "Suppose I asked whether a tree is a mirror image of itself — symmetric.",
          candidate: "Same lockstep idea, but I compare a tree against itself with the recursion mirrored: left.left pairs with right.right, and left.right pairs with right.left. Everything else — the null cases and the value check — is identical.",
        },
        {
          interviewer: 'And whether one tree is a subtree of another?',
          candidate: "I reuse this exact function: walk the big tree, and at each node ask 'isSameTree(thisNode, t)'. If any of them returns true, t is a subtree. So Same Tree is the primitive the other two are built on.",
        },
      ],
    },
    {
      heading: 'Wrapping up',
      exchanges: [
        {
          interviewer: "What would you test?",
          candidate: "Two identical trees, a value difference deep in the tree, a structural difference where one side has a child the other doesn't, and two empty trees. The structural case is the one that catches a missing null guard.",
        },
      ],
    },
  ],
  testCases: [
    { id: 'identical', label: 'Identical', why: 'Same shape and values everywhere → true. Each pair matches, so both trees end green.', levelOrder: [1, 2, 3], levelOrderB: [1, 2, 3], expected: true },
    { id: 'value-diff', label: 'A value differs', why: 'Same shape, but 3 ≠ 4 at the right child → the pair turns red, false.', levelOrder: [1, 2, 3], levelOrderB: [1, 2, 4], expected: false, isEdge: true },
    { id: 'structure-diff', label: 'Structure differs', why: 'Tree 1 has 2 on the left; Tree 2 has 2 on the right. One side is null where the other has a node → false.', levelOrder: [1, 2], levelOrderB: [1, null, 2], expected: false, isEdge: true },
    { id: 'both-empty', label: 'Both empty', why: 'Edge case: two empty trees are the same → true.', levelOrder: [], levelOrderB: [], expected: true, isEdge: true },
  ],
  solutions: [recursiveSolution],
};
