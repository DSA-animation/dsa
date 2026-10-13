import { Problem, Solution } from '../../core/content/catalog.model';
import { fromLevelOrder } from '../../core/tree/tree-builder';
import { TreeNode } from '../../core/tree/tree-node.model';
import { NodeVizState, StackFrame, TraceStep } from '../../core/trace/step.model';

/**
 * Instrumented reference solution for "Subtree of Another Tree".
 *
 * Composition: walk every node of the big tree (Tree 1) and, at each one, ask
 * "is the pattern (Tree 2) rooted here?" using Same Tree. The current candidate
 * lights up; when a candidate's whole subtree equals the pattern, it and the
 * pattern turn green and the search stops (OR short-circuits, so the rest of
 * Tree 1 is never visited).
 */
export function buildSubtreeTrace(sRoot: TreeNode | null, _arg?: number, tRoot?: TreeNode | null): TraceStep[] {
  const steps: TraceStep[] = [];
  const states: Record<number, NodeVizState> = {};
  const stack: StackFrame[] = [];
  const pattern = tRoot ?? null;
  let id = 0;

  const init = (n: TreeNode | null): void => {
    if (!n) return;
    states[n.id] = { status: 'idle' };
    init(n.left);
    init(n.right);
  };
  init(sRoot);
  init(pattern);

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

  const sameCheck = (a: TreeNode | null, b: TreeNode | null): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.val === b.val && sameCheck(a.left, b.left) && sameCheck(a.right, b.right);
  };
  const colorGreen = (a: TreeNode | null, b: TreeNode | null): void => {
    if (!a || !b) return;
    states[a.id] = { status: 'returned' };
    states[b.id] = { status: 'returned' };
    colorGreen(a.left, b.left);
    colorGreen(a.right, b.right);
  };

  let found = false;
  const isSub = (s: TreeNode | null): boolean => {
    if (found) return true;
    if (!s) return false;
    stack.push({ nodeId: s.id, label: `try @${s.val}` });
    states[s.id] = { status: 'active' };
    if (pattern) states[pattern.id] = { status: 'active' };
    push(0, s.id, `Try matching the pattern (Tree 2) at ${s.val} in Tree 1.`);
    push(2, s.id, `Is the subtree rooted at ${s.val} identical to the pattern?`);

    if (sameCheck(s, pattern)) {
      colorGreen(s, pattern);
      found = true;
      stack.pop();
      push(2, s.id, `Yes — the subtree at ${s.val} equals the pattern. It IS a subtree.`);
      return true;
    }

    states[s.id] = { status: 'recursing' };
    if (pattern) states[pattern.id] = { status: 'idle' };
    push(3, s.id, `No — ${s.val}'s subtree ≠ the pattern. Search its children.`);
    const l = isSub(s.left);
    if (l) {
      stack.pop();
      return true;
    }
    const r = isSub(s.right);
    stack.pop();
    return r;
  };

  const ans = isSub(sRoot);
  push(ans ? 2 : 1, null, ans ? 'The pattern is a subtree of Tree 1 → true.' : 'No node in Tree 1 roots a copy of the pattern → false.', { answer: String(ans) }, true);
  return steps;
}

const recursiveSolution: Solution = {
  id: 'recursive-dfs',
  name: 'Walk + Same Tree',
  tagline: 'Walk every node of the big tree and run the Same-Tree check against the pattern there.',
  auxLabel: 'Call stack',
  complexity: {
    time: 'O(n · m)',
    timeWhy: 'For each of the n nodes in the big tree you may run an O(m) Same-Tree check against the pattern.',
    space: 'O(h)',
    spaceWhy: 'Recursion stack depth = the big tree height (plus O(m) during a Same-Tree check).',
  },
  approach: [
    "A subtree of s is a node of s whose ENTIRE subtree is identical to t — so the primitive is Same Tree, which you already have.",
    'Walk every node of the big tree s. At each node, run isSameTree(node, t).',
    "If any node's subtree equals t, t is a subtree → true. If you run off the tree without a hit, it's false.",
    'The OR short-circuits: the first matching node ends the search, so the rest of the tree is never checked.',
  ],
  recipe: {
    contract: 'isSubtree(s, t) → true if t matches the subtree rooted at some node of s.',
    baseCase: "s null → false (you can't find a non-empty pattern inside nothing).",
    recurse: 'isSameTree(s, t) here; otherwise recurse into s.left and s.right.',
    combine: 'match here OR found in the left OR found in the right.',
  },
  pseudocode: [
    'isSubtree(s, t):',
    '  if s is null → return false',
    '  if isSameTree(s, t) → return true',
    '  return isSubtree(s.left, t) OR isSubtree(s.right, t)',
  ],
  code: {
    javascript: [
      'function isSubtree(s, t) {',
      '  if (s === null) return false;',
      '  if (isSameTree(s, t)) return true;',
      '  return isSubtree(s.left, t) || isSubtree(s.right, t);',
      '}',
      'function isSameTree(a, b) {',
      '  if (!a && !b) return true;',
      '  if (!a || !b) return false;',
      '  return a.val === b.val && isSameTree(a.left, b.left) && isSameTree(a.right, b.right);',
      '}',
    ],
    python: [
      'def isSubtree(s, t):',
      '    if s is None: return False',
      '    if isSameTree(s, t): return True',
      '    return isSubtree(s.left, t) or isSubtree(s.right, t)',
      'def isSameTree(a, b):',
      '    if not a and not b: return True',
      '    if not a or not b: return False',
      '    return a.val == b.val and isSameTree(a.left, b.left) and isSameTree(a.right, b.right)',
    ],
    java: [
      'boolean isSubtree(TreeNode s, TreeNode t) {',
      '    if (s == null) return false;',
      '    if (isSameTree(s, t)) return true;',
      '    return isSubtree(s.left, t) || isSubtree(s.right, t);',
      '}',
      'boolean isSameTree(TreeNode a, TreeNode b) {',
      '    if (a == null && b == null) return true;',
      '    if (a == null || b == null) return false;',
      '    return a.val == b.val && isSameTree(a.left, b.left) && isSameTree(a.right, b.right);',
      '}',
    ],
    cpp: [
      'bool isSameTree(TreeNode* a, TreeNode* b) {',
      '    if (!a && !b) return true;',
      '    if (!a || !b) return false;',
      '    return a->val == b->val && isSameTree(a->left, b->left) && isSameTree(a->right, b->right);',
      '}',
      'bool isSubtree(TreeNode* s, TreeNode* t) {',
      '    if (s == nullptr) return false;',
      '    if (isSameTree(s, t)) return true;',
      '    return isSubtree(s->left, t) || isSubtree(s->right, t);',
      '}',
    ],
  },
  codeMap: {
    cpp: [-1, -1, -1, -1, 0, 1, 2, 3, -1],
  },
  buildTrace: buildSubtreeTrace,
};

export const subtreeProblem: Problem = {
  id: 'subtree-of-another-tree',
  title: 'Subtree of Another Tree',
  dsId: 'trees',
  patternId: 'dual-tree',
  difficulty: 'Easy',
  leetcode: 572,
  statement:
    'Given the roots of two binary trees root and subRoot, return true if there is a subtree of root with the same structure and values as subRoot. A subtree is any node of root together with all of its descendants.',
  dual: true,
  companies: [
    { name: 'Amazon', level: '0–5 yrs' },
    { name: 'Meta', level: '0–5 yrs' },
    { name: 'Microsoft', level: '0–5 yrs' },
    { name: 'Google', level: '0–5 yrs' },
    { name: 'Apple', level: '0–5 yrs' },
  ],
  experienceNote:
    "An Easy warm-up (~0–5 yrs) that's really a composition question: do you recognize it as Same Tree run at every node? The strong follow-up (serialize + string match for O(n+m)) is where it tilts toward mid-level.",
  keyRealization:
    "A subtree match is just Same Tree applied at every node: walk the big tree, and at each node ask 'is the pattern rooted here?'. If any node says yes, the pattern is a subtree.",
  interview: [
    {
      heading: 'Clarifying the problem',
      exchanges: [
        {
          interviewer: "Given a tree root and a smaller tree subRoot, return whether subRoot is a subtree of root. What counts as a subtree?",
          candidate: "A node of root together with ALL its descendants, matching subRoot exactly in structure and values. So it's not just 'contains those values' — it has to be an exact subtree hanging off some node. And the whole tree counts as its own subtree. Right?",
        },
        {
          interviewer: 'Correct — an exact subtree, and the whole tree qualifies.',
          candidate: "Good, so a partial match that would need to keep going past subRoot's leaves doesn't count — it has to match all the way down and stop exactly where subRoot stops.",
        },
      ],
    },
    {
      heading: 'Approach',
      exchanges: [
        {
          interviewer: "How would you solve it?",
          candidate: "I already have the primitive — Same Tree. A subtree is just 'is there a node of root where isSameTree(node, subRoot) is true?' So I walk every node of root, and at each one run the Same-Tree check against subRoot. First hit → true; if I run off the tree, false.",
        },
        {
          interviewer: "Why can't you just check the root once?",
          candidate: "Because subRoot could match deep inside — at any node, not just the top. So I have to try the Same-Tree check at every node as I traverse.",
        },
      ],
    },
    {
      heading: 'Complexity',
      exchanges: [
        {
          interviewer: "Complexity?",
          candidate: "O(n·m) worst case — n nodes in the big tree, and at each I might do an O(m) Same-Tree comparison. O(h) space for the traversal stack.",
        },
        {
          interviewer: 'Can you beat O(n·m)?',
          candidate: "Yes — serialize both trees to strings (with explicit null markers and delimiters so values can't run together) and ask whether subRoot's string is a substring of root's. With KMP that's O(n+m). The null markers and delimiters are the trick — without them, '12' vs '1,2' would collide.",
        },
      ],
    },
    {
      heading: 'Wrapping up',
      exchanges: [
        {
          interviewer: "What would you test?",
          candidate: "A clear subtree match deep in the tree, a near-match that fails because the big tree has an extra node past subRoot's leaf, a single-node pattern, and a pattern that isn't present at all. The near-match is the one that catches a sloppy 'contains' check.",
        },
      ],
    },
  ],
  testCases: [
    { id: 'is-subtree', label: 'Is a subtree', why: 'The subtree rooted at node 4 (4 → 1, 2) is identical to the pattern → true; it turns green and the search stops before visiting node 5.', levelOrder: [3, 4, 5, 1, 2], levelOrderB: [4, 1, 2], expected: true },
    { id: 'not-subtree', label: 'Near-match, not a subtree', why: "Node 4's subtree looks close, but it has an extra node (0) under the 2 that the pattern doesn't → every candidate fails → false.", levelOrder: [3, 4, 5, 1, 2, null, null, null, null, 0], levelOrderB: [4, 1, 2], expected: false, isEdge: true },
    { id: 'single', label: 'Single-node pattern', why: 'The pattern is one node; it matches any leaf (here the 2) with that value → true.', levelOrder: [1, 2, 3], levelOrderB: [2], expected: true, isEdge: true },
    { id: 'absent', label: 'Pattern not present', why: 'No node of Tree 1 roots a copy of the pattern → false.', levelOrder: [1, 2, 3], levelOrderB: [5], expected: false, isEdge: true },
  ],
  solutions: [recursiveSolution],
};
