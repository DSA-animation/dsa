import { Problem } from '../../core/content/catalog.model';
import { fromLevelOrder } from '../../core/tree/tree-builder';
import { TreeNode } from '../../core/tree/tree-node.model';
import { NodeVizState, StackFrame, TraceStep } from '../../core/trace/step.model';

/**
 * Instrumented reference solution for "Maximum Depth of Binary Tree".
 *
 * This IS the algorithm — a postorder DFS — but every meaningful moment pushes a
 * full snapshot of the visualization state plus a teaching narration (`note`),
 * written the way you'd explain it at a whiteboard. The `line` on each step points
 * at the pseudocode/code line that is "executing", so picture + words + code move
 * together.
 */
export function buildMaxDepthTrace(root: TreeNode | null): TraceStep[] {
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

  const push = (
    line: number,
    focusNodeId: number | null,
    note: string,
    vars: Record<string, number | string> = {},
    done = false,
  ): void => {
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

export const maxDepthProblem: Problem = {
  id: 'maximum-depth',
  title: 'Maximum Depth of Binary Tree',
  dsId: 'trees',
  patternId: 'dfs-bubble-up',
  difficulty: 'Easy',
  leetcode: 104,
  statement:
    'Given the root of a binary tree, return its maximum depth — the number of nodes along the longest path from the root down to the farthest leaf.',
  complexity: {
    time: 'O(n)',
    timeWhy: 'Every node is visited exactly once; there is no way to avoid looking at all of them.',
    space: 'O(h)',
    spaceWhy:
      "The recursion stack is only ever as deep as the tree is tall (h). That's O(log n) for a balanced tree, but O(n) for a degenerate, linked-list-shaped tree — saying this out loud is the senior answer on space.",
  },

  keyRealization:
    'A binary tree is a recursive object: every node is itself the root of a smaller tree. So any question about "the whole tree" can usually be answered by asking the SAME question of its two subtrees and combining the results.',
  approach: [
    'Ask what one node can compute if its children already told it their answers. If a magic helper maxDepth(node) returns any subtree\'s depth, then standing at a node, my depth = 1 + max(maxDepth(left), maxDepth(right)).',
    'That recurrence IS the algorithm — the "magic helper" is just the function calling itself. You don\'t need to know how the children got their numbers; you only trust that they did.',
    'Find the base case where recursion stops. Subtrees shrink every call until you fall off the tree into an empty spot (null). An empty subtree has depth 0.',
    'Decide the order. You can\'t compute a node until both children are done — so children first, then you. That is post-order, the signature of tree-DFS "aggregate" problems.',
  ],
  recipe: {
    contract: 'maxDepth(node) → the depth of the subtree rooted at node.',
    baseCase: 'node === null → 0',
    recurse: 'the left subtree and the right subtree (both strictly smaller).',
    combine: '1 + max(leftDepth, rightDepth)',
  },
  followUps: [
    {
      q: 'Do it without recursion.',
      a: 'BFS level-count with a queue (increment a counter per level), or an explicit stack carrying (node, depth). This removes the O(h) call-stack risk on a skewed tree.',
    },
    {
      q: 'What if the tree is extremely deep?',
      a: 'Recursion can blow the call stack. Prefer the iterative version — a real concern in languages without tail-call optimization.',
    },
    {
      q: 'What about minimum depth instead?',
      a: 'Subtle: a null child does NOT count as a path end, so you cannot blindly take min(left, right) — you must guard the single-child case. max and min are not symmetric here.',
    },
    {
      q: 'Why is the space O(h) and not O(1)?',
      a: 'At the deepest point every ancestor call is paused on the stack: [maxDepth(3)] → [maxDepth(20)] → [maxDepth(15)]. The live stack is never deeper than the tree is tall, so memory is O(h).',
    },
  ],
  transferable:
    'Recognition trigger: Tree + "a fact about each subtree built from its children\'s facts" ⇒ DFS, post-order — combine left & right, then add yourself. The same machinery solves Diameter, Path Sum, Balanced Binary Tree, Count Nodes, Invert Tree, and Lowest Common Ancestor. Learn the shape once; vary only the Contract and Combine.',

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

  buildTrace: buildMaxDepthTrace,
};
