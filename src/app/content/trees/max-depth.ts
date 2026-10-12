import { Problem, Solution } from '../../core/content/catalog.model';
import { fromLevelOrder } from '../../core/tree/tree-builder';
import { TreeNode } from '../../core/tree/tree-node.model';
import { NodeVizState, StackFrame, TraceStep } from '../../core/trace/step.model';

/* ------------------------------------------------------------------ */
/* Approach 1 — Recursive DFS (post-order)                             */
/* ------------------------------------------------------------------ */

export function buildRecursiveTrace(root: TreeNode | null): TraceStep[] {
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

  const depth = (node: TreeNode | null, sideNote: string): number => {
    if (!node) {
      push(1, null, `${sideNote} is empty. An empty subtree has depth 0 — this base case stops the recursion and seeds every value that bubbles back up.`);
      return 0;
    }
    stack.push({ nodeId: node.id, label: `maxDepth(${node.val})` });
    states[node.id] = { status: 'active' };
    push(0, node.id, `Call maxDepth(${node.val}). I can't answer yet — a node's depth is built from its children's depths, so I must recurse down before I can combine.`);

    states[node.id] = { status: 'recursing' };
    push(2, node.id, `Ask the LEFT child of ${node.val} for its depth. Leap of faith: I trust the call returns the right number — I never trace into it in my head.`);
    const left = depth(node.left, `Left of ${node.val}`);

    states[node.id] = { status: 'recursing' };
    push(3, node.id, `Left came back as ${left}. Now ask the RIGHT child of ${node.val} for its depth.`, { left });
    const right = depth(node.right, `Right of ${node.val}`);

    const result = 1 + Math.max(left, right);
    states[node.id] = { status: 'returned', returnValue: result };
    stack.pop();
    push(4, node.id, `Both children answered: left=${left}, right=${right}. My depth = 1 + max(${left}, ${right}) = ${result}. I return ${result} up to my parent.`, { left, right, result });
    return result;
  };

  const answer = depth(root, 'The tree');
  push(4, root ? root.id : null, root ? `Back at the root. The longest root-to-leaf path has ${answer} nodes → maximum depth = ${answer}.` : `The tree is empty, so the maximum depth is 0.`, { answer }, true);
  return steps;
}

const recursiveSolution: Solution = {
  id: 'recursive-dfs',
  name: 'Recursive DFS',
  tagline: "The natural tree solution — a node's depth is 1 + its deeper child's depth.",
  auxLabel: 'Call stack',
  complexity: {
    time: 'O(n)',
    timeWhy: 'Every node is visited exactly once; there is no way to avoid looking at all of them.',
    space: 'O(h)',
    spaceWhy:
      "The recursion stack is only ever as deep as the tree is tall (h). That's O(log n) for a balanced tree, but O(n) for a degenerate, linked-list-shaped tree — saying this out loud is the senior answer on space.",
  },
  approach: [
    "Ask what one node can compute if its children already told it their answers. If a magic helper maxDepth(node) returns any subtree's depth, then my depth = 1 + max(maxDepth(left), maxDepth(right)).",
    'That recurrence IS the algorithm — the "magic helper" is just the function calling itself. You don\'t need to know how the children got their numbers; you only trust that they did.',
    'Find the base case where recursion stops. Subtrees shrink every call until you fall off the tree into an empty spot (null). An empty subtree has depth 0.',
    "Decide the order. You can't compute a node until both children are done — so children first, then you. That is post-order, the signature of tree-DFS \"aggregate\" problems.",
  ],
  recipe: {
    contract: 'maxDepth(node) → the depth of the subtree rooted at node.',
    baseCase: 'node === null → 0',
    recurse: 'the left subtree and the right subtree (both strictly smaller).',
    combine: '1 + max(leftDepth, rightDepth)',
  },
  pseudocode: [
    'maxDepth(node):',
    '  if node is null → return 0',
    '  left  ← maxDepth(node.left)',
    '  right ← maxDepth(node.right)',
    '  return 1 + max(left, right)',
  ],
  code: {
    javascript: [
      'function maxDepth(node) {',
      '  if (node === null) return 0;',
      '  const left = maxDepth(node.left);',
      '  const right = maxDepth(node.right);',
      '  return 1 + Math.max(left, right);',
      '}',
    ],
  },
  buildTrace: buildRecursiveTrace,
};

/* ------------------------------------------------------------------ */
/* Approach 2 — Iterative BFS (level count)                           */
/* ------------------------------------------------------------------ */

export function buildBfsTrace(root: TreeNode | null): TraceStep[] {
  const steps: TraceStep[] = [];
  const states: Record<number, NodeVizState> = {};
  let level: TreeNode[] = [];
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
      callStack: level.map((n) => ({ nodeId: n.id, label: String(n.val) })),
    });
  };

  if (!root) {
    push(1, null, 'The tree is empty → return depth 0.', { depth: 0 }, true);
    return steps;
  }

  level = [root];
  let depth = 0;
  push(2, root.id, "Seed the first level with just the root; depth = 0. We'll count how many levels there are.", { depth });

  while (level.length > 0) {
    push(3, null, `This level holds ${level.length} node(s), all at the same depth.`, { depth, level: level.length });
    depth++;
    push(4, null, `We're counting a whole level at once → depth = ${depth}.`, { depth });
    const next: TreeNode[] = [];
    push(5, null, 'Collect this level’s children into a fresh "next level" array (no array.shift() — that would be O(n) per node).', { depth });
    for (const node of level) {
      states[node.id] = { status: 'active' };
      const kids = [node.left, node.right].filter((k): k is TreeNode => !!k);
      for (const k of kids) next.push(k);
      push(6, node.id, `Visit ${node.val} and add its ${kids.length ? 'children (' + kids.map((k) => k.val).join(', ') + ')' : "children (none — it's a leaf)"} to the next level.`, { depth });
      states[node.id] = { status: 'returned' };
    }
    push(7, null, next.length ? `This level is done — the next level [${next.map((n) => n.val).join(', ')}] becomes current.` : 'This level is done and produced no children, so the next level is empty.', { depth });
    level = next;
  }

  push(8, root.id, `No nodes left — the tree has ${depth} levels, so the maximum depth = ${depth}.`, { depth }, true);
  return steps;
}

const bfsSolution: Solution = {
  id: 'iterative-bfs',
  name: 'Iterative BFS',
  tagline: 'No recursion: process the tree one level at a time and count the levels.',
  auxLabel: 'Level',
  complexity: {
    time: 'O(n)',
    timeWhy: 'Each node is enqueued and dequeued exactly once.',
    space: 'O(w)',
    spaceWhy:
      'The queue holds at most one level at a time (width w). That is O(1) on a skewed tree — the win over recursion — but up to O(n/2) on the bottom level of a full tree.',
  },
  approach: [
    "If you're worried that deep recursion could blow the call stack, avoid recursion entirely: process the tree breadth-first, one level at a time.",
    'Seed a queue with the root. Each outer iteration handles exactly one level: snapshot the current queue size, dequeue that many nodes, and enqueue their children.',
    'Every time you finish a level, increment a depth counter. When the queue empties, that counter is the number of levels — the maximum depth.',
    'This trades the O(h) call stack for an O(width) queue, which is the better worst case on a skewed, linked-list-shaped tree.',
  ],
  pseudocode: [
    'maxDepth(root):',
    '  if root is null → return 0',
    '  level ← [root];  depth ← 0',
    '  while level is not empty:',
    '    depth ← depth + 1',
    '    next ← [ ]',
    '    for each node in level: add its children to next',
    '    level ← next',
    '  return depth',
  ],
  code: {
    javascript: [
      'function maxDepth(root) {',
      '  if (root === null) return 0;',
      '  let level = [root], depth = 0;',
      '  while (level.length > 0) {',
      '    depth++;',
      '    const next = [];',
      '    for (const n of level) { if (n.left) next.push(n.left); if (n.right) next.push(n.right); }',
      '    level = next;',
      '  }  return depth;',
      '}',
    ],
  },
  buildTrace: buildBfsTrace,
};

/* ------------------------------------------------------------------ */
/* The problem                                                         */
/* ------------------------------------------------------------------ */

export const maxDepthProblem: Problem = {
  id: 'maximum-depth',
  title: 'Maximum Depth of Binary Tree',
  dsId: 'trees',
  patternId: 'dfs-bubble-up',
  difficulty: 'Easy',
  leetcode: 104,
  statement:
    'Given the root of a binary tree, return its maximum depth — the number of nodes along the longest path from the root down to the farthest leaf.',
  keyRealization:
    'A binary tree is a recursive object: every node is itself the root of a smaller tree. So any question about "the whole tree" can usually be answered by asking the SAME question of its two subtrees and combining the results.',
  interview: [
    {
      heading: '1. Clarify before you code',
      intro: 'Strong candidates spend the first 1–2 minutes here. Silence on these reads as inexperience.',
      qa: [
        {
          q: 'Is "depth" the number of nodes or the number of edges on the longest path?',
          a: 'Pin this down first. LeetCode 104 counts NODES, so a single node has depth 1. If the interviewer means edges, every answer is one less — a classic off-by-one. Never assume.',
        },
        {
          q: 'What should an empty tree (root = null) return?',
          a: 'By convention 0 — no nodes, no path. Confirming it also hands you your base case.',
        },
        {
          q: 'Is it a plain binary tree or a BST? Any balance guarantee?',
          a: "A plain binary tree — no ordering or balance to exploit. So you can't prune or binary-search; you must visit every node.",
        },
        {
          q: 'How large can the tree be — could it be very deep or skewed?',
          a: 'This question earns senior points. If n can reach ~10^5 or a long skewed chain, recursion depth becomes a real risk, which motivates the iterative approach before anyone forces it.',
        },
        {
          q: 'Do the node values matter?',
          a: 'No — depth depends only on structure. Saying so shows you understand the problem, not just the shape of the input.',
        },
      ],
    },
    {
      heading: '2. Approaches — propose and compare',
      intro: 'There is no meaningful brute force: any correct answer must visit every node, so it is Ω(n). The real axis is recursion vs iteration.',
      qa: [
        {
          q: "What's your first instinct, and why?",
          a: "Recursive DFS, post-order: a node's depth = 1 + max(left depth, right depth). It mirrors the tree's own recursive structure, so it's the shortest to write and the easiest to defend.",
        },
        {
          q: 'Now give me a solution without recursion.',
          a: 'BFS level-count: process the tree one level at a time and increment a counter per level. (Alternative: iterative DFS with an explicit stack of (node, depth).) Both move the bookkeeping off the call stack.',
        },
        {
          q: 'When would you actually pick BFS over recursion?',
          a: 'When the tree can be deep/skewed and the language has a shallow call stack (JS blows up around ~10^4 frames). BFS trades the O(h) call stack for an O(width) queue — the safe choice on a linked-list-shaped tree.',
        },
      ],
    },
    {
      heading: '3. Complexity, grilled',
      qa: [
        {
          q: "Time complexity — and why can't it be faster?",
          a: 'O(n): each node is visited once. It cannot be sub-linear — the deepest leaf could be anywhere, so any correct algorithm must inspect all n nodes. O(n) is optimal.',
        },
        {
          q: 'Space of the recursive version — be precise.',
          a: "O(h), the height, because at the deepest point every ancestor's frame is still on the stack. That's O(log n) for a balanced tree but O(n) for a skewed one. The senior phrasing: “O(h) — O(log n) balanced, O(n) worst case.”",
        },
        {
          q: 'And the BFS space?',
          a: 'O(w), the maximum width — the queue holds at most one level. That is O(1) on a skewed tree (the win over recursion) but up to ~n/2 = O(n) on the bottom level of a full tree. Recursion and BFS have opposite worst cases.',
        },
        {
          q: 'So which one is more space-efficient?',
          a: 'It depends on shape. Recursion (O(h)) wins on wide/balanced trees; BFS (O(w)) wins on deep/skewed trees. There is no universal winner — naming that trade-off is exactly what they want to hear.',
        },
      ],
    },
    {
      heading: "4. Edge cases they'll throw at you",
      qa: [
        { q: 'Empty tree (root = null)', a: '→ 0. The base case must return 0 without dereferencing null.' },
        { q: 'Single node', a: '→ 1, from 1 + max(0, 0). Confirms your +1 and base case line up.' },
        { q: 'A long left- or right-skewed chain of n nodes', a: '→ n. The recursion-stack stress test — be ready to switch to iterative if they say n is large.' },
        { q: 'Perfectly balanced tree', a: 'Depth = ⌊log₂ n⌋ + 1 — the best case for recursion space, O(log n).' },
        { q: 'A ~100,000-node deep tree in JavaScript', a: 'Recursion throws “Maximum call stack size exceeded” (JS stacks are ~10^4 frames). This is precisely why they ask for the iterative version.' },
      ],
    },
    {
      heading: '5. Gotchas that fail candidates',
      qa: [
        { q: 'Nodes vs edges off-by-one', a: 'max(left, right) + 1 vs max(left, right): the +1 counts the current node. Clarifying the definition up front prevents the mistake entirely.' },
        { q: 'Using array.shift() as the BFS queue', a: 'shift() is O(n) — it re-indexes the array — so per node it makes BFS O(n²). Keep it O(n) with a level→next array swap, a head pointer, or a real deque.' },
        { q: 'Forgetting the null base case', a: 'Dropping “if (node == null) return 0” dereferences null and crashes. The base case both stops recursion and seeds the values that bubble up.' },
        { q: 'Assuming balance or BST order', a: "It's a plain binary tree — no pruning, no binary search. You must visit every node." },
      ],
    },
    {
      heading: '6. Variations they pivot to',
      intro: 'An Easy problem is a springboard. Expect the interviewer to morph it into one of these:',
      qa: [
        { q: 'Minimum Depth of Binary Tree', a: "Trap: a null child is NOT a path end, so you can't take min(left, right) blindly — guard the single-child case (recurse the non-null side). max and min are not symmetric here." },
        { q: 'Diameter of Binary Tree', a: 'The first time the return value and the answer diverge: the helper still returns height, but you track the best (left + right) — the path bending at a node — in a side variable.' },
        { q: 'Balanced Binary Tree', a: 'Return height, but short-circuit to -1 the instant any subtree pair differs in height by more than 1 — a height computation carrying an early-exit signal.' },
        { q: 'Maximum Depth of an N-ary Tree', a: 'Same shape, combined over a children array: 1 + max(depth(child) for every child), with 0 for no children.' },
        { q: 'Level-order traversal / deepest leaves', a: 'Your BFS already walks level by level — collect each level for level-order; the final level is the set of deepest leaves.' },
      ],
    },
    {
      heading: '7. The transferable pattern',
      qa: [
        {
          q: 'What is the reusable idea here?',
          a: 'Recognition trigger: Tree + “a fact about each subtree built from its children’s facts” ⇒ DFS, post-order — combine left and right, then add yourself. The same machinery solves Diameter, Path Sum, Balanced, Count Nodes, Invert Tree, and Lowest Common Ancestor. Learn the shape once; vary only the Contract and the Combine.',
        },
      ],
    },
    {
      heading: '8. What the interviewer is actually scoring',
      intro: 'On an Easy problem correctness is assumed — they are scoring how you think.',
      qa: [
        { q: 'Communication', a: 'Did you clarify (nodes vs edges, size) before coding, think out loud, and state complexity unprompted?' },
        { q: 'Depth of understanding', a: 'Did you volunteer the O(h) space and the skewed-tree stack risk, and offer the iterative alternative — without being asked?' },
        { q: 'Pattern transfer', a: 'Did you recognize the post-order “combine the children’s answers” shape and name the family it belongs to?' },
        { q: 'Code quality & testing', a: 'Clean base case, no null dereference, and a dry-run on an edge case (empty, single, skewed) before you say “done.”' },
      ],
    },
  ],

  testCases: [
    {
      id: 'balanced',
      label: 'Balanced',
      why: 'The classic example — a well-shaped tree where the deeper subtree wins.',
      levelOrder: [3, 9, 20, null, null, 15, 7],
      expected: 3,
    },
    {
      id: 'empty',
      label: 'Empty tree',
      why: 'Edge case: root = null. The base case must return 0 immediately.',
      levelOrder: [],
      expected: 0,
      isEdge: true,
    },
    {
      id: 'single',
      label: 'Single node',
      why: 'Edge case: both children are null, so depth = 1 + max(0, 0) = 1.',
      levelOrder: [1],
      expected: 1,
      isEdge: true,
    },
    {
      id: 'skewed',
      label: 'Left-skewed',
      why: 'Worst case for space: the recursion stack grows to O(n) on a linked-list-shaped tree.',
      levelOrder: [1, 2, null, 3, null, 4],
      expected: 4,
      isEdge: true,
    },
  ],

  solutions: [recursiveSolution, bfsSolution],
};
