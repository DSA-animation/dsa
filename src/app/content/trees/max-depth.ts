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
    python: [
      'def maxDepth(node):',
      '    if node is None: return 0',
      '    left = maxDepth(node.left)',
      '    right = maxDepth(node.right)',
      '    return 1 + max(left, right)',
    ],
    java: [
      'int maxDepth(TreeNode node) {',
      '    if (node == null) return 0;',
      '    int left = maxDepth(node.left);',
      '    int right = maxDepth(node.right);',
      '    return 1 + Math.max(left, right);',
      '}',
    ],
    cpp: [
      'int maxDepth(TreeNode* node) {',
      '    if (node == nullptr) return 0;',
      '    int left = maxDepth(node->left);',
      '    int right = maxDepth(node->right);',
      '    return 1 + max(left, right);',
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
    python: [
      'def maxDepth(root):',
      '    if root is None: return 0',
      '    level, depth = [root], 0',
      '    while level:',
      '        depth += 1',
      '        nxt = []',
      '        for n in level: nxt += [c for c in (n.left, n.right) if c]',
      '        level = nxt',
      '    return depth',
    ],
    java: [
      'int maxDepth(TreeNode root) {',
      '    if (root == null) return 0;',
      '    List<TreeNode> level = new ArrayList<>(List.of(root)); int depth = 0;',
      '    while (!level.isEmpty()) {',
      '        depth++;',
      '        List<TreeNode> next = new ArrayList<>();',
      '        for (TreeNode n : level) { if (n.left != null) next.add(n.left); if (n.right != null) next.add(n.right); }',
      '        level = next;',
      '    }  return depth;',
      '}',
    ],
    cpp: [
      'int maxDepth(TreeNode* root) {',
      '    if (root == nullptr) return 0;',
      '    vector<TreeNode*> level{root}; int depth = 0;',
      '    while (!level.empty()) {',
      '        depth++;',
      '        vector<TreeNode*> next;',
      '        for (auto n : level) { if (n->left) next.push_back(n->left); if (n->right) next.push_back(n->right); }',
      '        level = next;',
      '    }  return depth;',
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
  companies: [
    { name: 'Amazon', level: '0–5 yrs' },
    { name: 'Microsoft', level: '0–5 yrs' },
    { name: 'Google', level: '0–5 yrs' },
    { name: 'Meta', level: '0–5 yrs' },
    { name: 'Apple', level: '0–5 yrs' },
    { name: 'Bloomberg', level: '0–5 yrs' },
    { name: 'Adobe', level: '0–5 yrs' },
    { name: 'LinkedIn', level: '0–5 yrs' },
  ],
  experienceNote:
    "Difficulty sets the level: this is an Easy problem, so it's a phone-screen warm-up asked broadly from new-grad to mid-level (~0–5 yrs) — and a quick opener even in senior loops, where the real test is the follow-ups.",
  keyRealization:
    'A binary tree is a recursive object: every node is itself the root of a smaller tree. So any question about "the whole tree" can usually be answered by asking the SAME question of its two subtrees and combining the results.',
  interview: [
    {
      heading: 'Clarifying the problem',
      exchanges: [
        {
          interviewer: "Let's do a tree problem. Given the root of a binary tree, return its maximum depth. Go ahead whenever you're ready.",
          candidate: "Okay. Before I start, a couple of quick clarifications. By depth, do you mean the number of nodes on the longest root-to-leaf path, or the number of edges? I've seen it defined both ways.",
        },
        {
          interviewer: 'Number of nodes. So a single node is depth one.',
          candidate: "Got it. And for an empty tree I'll return zero — is that the convention you want?",
        },
        {
          interviewer: 'Yep, zero for empty.',
          candidate: 'Last thing: any constraints on size? Could it be very large, or very unbalanced — like a straight line?',
        },
        {
          interviewer: 'Assume it can be large — up to about 10^5 nodes — and yes, it might be a straight line.',
          candidate: "Okay, that's useful. That tells me to watch the recursion depth, but let me start with the clean recursive version and we can harden it after.",
        },
      ],
    },
    {
      heading: 'Approach',
      exchanges: [
        {
          interviewer: "Sure. What's your approach?",
          candidate: "My first instinct is recursion. A node's depth is one plus the deeper of its two children's depths, and an empty subtree is zero. So I recurse on both children and combine.",
        },
        {
          interviewer: 'Why recursion?',
          candidate: "A tree is naturally recursive — each child is a smaller version of the same problem — so the solution falls right out of the definition. And there's nothing faster to reach for: I have to look at every node either way, so any correct solution is O(n).",
        },
      ],
    },
    {
      heading: 'Coding it',
      exchanges: [
        {
          interviewer: 'Alright, go ahead and code it.',
          candidate: 'If the node is null, return zero. Otherwise left = maxDepth(node.left), right = maxDepth(node.right), and I return one plus the max of the two. Let me trace a leaf quickly — both children are null, so it is one plus max(0, 0), which is one. Good.',
        },
      ],
    },
    {
      heading: 'Complexity',
      exchanges: [
        {
          interviewer: "What's the complexity?",
          candidate: 'Time is O(n) — I touch each node once. Space is O(h), the height of the tree, because of the recursion stack.',
        },
        {
          interviewer: 'Not O(1)?',
          candidate: "No. At the deepest point, every ancestor's call is still on the stack, so the memory is proportional to the height. For a balanced tree that's O(log n), but for a skewed one it's O(n).",
        },
        {
          interviewer: 'You mentioned it could be a straight line, 10^5 nodes. Does that worry you?',
          candidate: "Honestly, yes. In JavaScript the call stack is only around ten thousand frames, so a 100,000-deep recursion would overflow. For that input I'd switch to an iterative version.",
        },
      ],
    },
    {
      heading: 'Follow-up: without recursion',
      exchanges: [
        {
          interviewer: 'Okay — show me the iterative one.',
          candidate: "I'll do BFS and count levels. I start with the root as the current level. Each round I increment a depth counter, build the next level from all the children of the current one, and move to it. When there's nothing left, the counter is the answer.",
        },
        {
          interviewer: 'How are you doing the queue?',
          candidate: "I'd build each level into a fresh array rather than calling shift — shift on an array is O(n) because it reindexes everything, which would make the whole thing O(n²). Level-by-level keeps it O(n) time, and the space is O(w), the width of the widest level.",
        },
        {
          interviewer: 'So which of the two would you actually submit?',
          candidate: "Given you said it might be a tall, skinny tree, I'd submit the iterative one for safety. If I knew it was always balanced I'd prefer the recursion — it's shorter, and its O(h) space is actually smaller than the queue in that case.",
        },
      ],
    },
    {
      heading: 'Follow-up: a twist',
      exchanges: [
        {
          interviewer: 'Let me change it slightly. Minimum depth instead — can you just swap max for min?',
          candidate: "Tempting, but that breaks. If a node has only one child, min of the two sides picks the null side, which is zero, so you'd report a path that doesn't actually reach a leaf. I'd special-case the single-child node and only recurse into the side that exists. Min and max aren't symmetric here.",
        },
        {
          interviewer: 'Good catch. And if I asked for the diameter of the tree?',
          candidate: "That's a nice one — it's the first time what I return and what I'm answering come apart. The helper still returns the height, but I keep a separate running max of left-height plus right-height — the longest path that bends at a node — and return that at the end.",
        },
      ],
    },
    {
      heading: 'Wrapping up',
      exchanges: [
        {
          interviewer: 'Before we wrap — how would you test it?',
          candidate: "Empty tree, single node, a fully skewed chain, and a balanced one. I'd pay special attention to the skewed case, since that's exactly where the recursive version would have overflowed.",
        },
        {
          interviewer: "Great — that's what I was looking for.",
          candidate: "Thanks. If we had more time I'd point out this is the post-order 'combine the children's answers' shape — the same skeleton solves diameter, balanced, path sum, and lowest common ancestor. I'd just change what I return and how I combine.",
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
