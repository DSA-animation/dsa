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
      heading: 'Opening & clarifying',
      exchanges: [
        {
          interviewer: "Here's a warm-up. Given the root of a binary tree, return its maximum depth. Before you write anything — any questions for me?",
          candidate: "A few. When you say depth, do you mean the number of nodes on the longest root-to-leaf path, or the number of edges? I'll assume nodes, so a single node is depth 1 — let me know if you meant edges. And what should an empty tree return? I'll go with 0.",
        },
        {
          interviewer: "Nodes, yes, and empty is 0. It's a plain binary tree — no BST ordering, no balance guarantee.",
          candidate: "Got it. One more: how large can the tree get, and could it be skewed? If it can be very deep, that changes whether I lean recursive or iterative.",
        },
        {
          interviewer: 'Assume up to about 100,000 nodes, and it might be skewed.',
          candidate: "Then I'll write the clean recursive version first, but keep recursion depth in mind and have an iterative version ready.",
        },
      ],
    },
    {
      heading: 'The approach',
      exchanges: [
        {
          interviewer: "Good. What's your approach?",
          candidate: "I'll follow the tree's own structure with recursion. A node's depth is 1 plus the max of its two children's depths, and an empty subtree has depth 0. That's a post-order DFS — I need both children's answers before I can compute mine. There's no meaningful brute force to skip past: any correct solution has to visit every node, so we're at Ω(n) regardless.",
        },
      ],
    },
    {
      heading: 'Writing the code',
      exchanges: [
        {
          interviewer: 'Go ahead and write the recursive version.',
          candidate: "`if (node === null) return 0;` handles the base case, then `return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));`. The +1 counts the current node, and I keep the deeper subtree. I'd dry-run a small tree to confirm the leaves return 1 and the values bubble up to the root.",
        },
      ],
    },
    {
      heading: 'Complexity',
      exchanges: [
        {
          interviewer: 'What are the time and space complexities?',
          candidate: "Time is O(n) — every node once, and that's optimal because any correct algorithm has to inspect them all. Space is O(h), the height, since at the deepest point every ancestor's frame is still on the call stack: O(log n) if it's balanced, but O(n) if it's skewed.",
        },
        {
          interviewer: 'Most candidates just say O(n). So the skewed case bothers you?',
          candidate: "It does. At 100,000 nodes with a possible skew, the recursive version in JavaScript could throw “Maximum call stack size exceeded” — JS stacks are only around 10^4 frames deep. That's exactly when I'd switch to an iterative approach.",
        },
      ],
    },
    {
      heading: 'Follow-up: without recursion',
      exchanges: [
        {
          interviewer: "Let's see the iterative version.",
          candidate: "I'll use BFS and count levels. The current level starts as just the root. While it's non-empty, I increment a depth counter, build the next level from all the children of the current level, and swap. When nothing's left, the counter is the number of levels — the max depth.",
        },
        {
          interviewer: 'Careful with the queue — any performance trap there?',
          candidate: "Yes: if I dequeued with array.shift(), that's O(n) because it re-indexes the array, and the whole thing becomes O(n²). I avoid it by building each level into a fresh array, or using a head pointer. That keeps it O(n) time, and space is O(w), the max width — O(1) on a skewed tree, up to O(n) on a wide one.",
        },
        {
          interviewer: 'So which do you ship — recursion or BFS?',
          candidate: "It depends on shape: recursion's O(h) is better on balanced trees, BFS's O(w) is better on skewed ones. Since you said it could be large and skewed, I'd ship the BFS version for stack safety and mention recursion as the cleaner default.",
        },
      ],
    },
    {
      heading: 'Follow-ups: variations',
      exchanges: [
        {
          interviewer: 'Suppose I asked for the minimum depth instead. Same code with min?',
          candidate: "No — that's the classic trap. A null child isn't a path end, so taking min(left, right) blindly would give a node with one child a wrong answer of 1. I'd guard the single-child case and recurse into the non-null side. max and min aren't symmetric here.",
        },
        {
          interviewer: 'And if I wanted the diameter of the tree?',
          candidate: "That's where the return value and the answer split. The helper still returns height, but I keep a running max of left height + right height — the path that bends at each node — in a side variable, and return that at the end.",
        },
        {
          interviewer: 'You clearly see the pattern.',
          candidate: "Right — it's the post-order “combine the children's answers” shape. The same skeleton solves Balanced, Path Sum, Count Nodes, and Lowest Common Ancestor; I only change what I return and how I combine.",
        },
      ],
    },
    {
      heading: 'Wrap-up',
      exchanges: [
        {
          interviewer: 'Before you call it done — what would you test?',
          candidate: "Empty tree → 0, single node → 1, a fully skewed chain to confirm the depth equals n and that the iterative version doesn't overflow, and a balanced tree. I'd dry-run at least the empty and skewed cases out loud.",
        },
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
