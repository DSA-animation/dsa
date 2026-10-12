import { Problem } from '../../core/content/catalog.model';
import { fromLevelOrder } from '../../core/tree/tree-builder';
import { TreeNode } from '../../core/tree/tree-node.model';
import { NodeVizState, StackFrame, TraceStep } from '../../core/trace/step.model';

/**
 * Instrumented reference solution for "Maximum Depth of Binary Tree".
 *
 * This IS the algorithm — a postorder DFS — but every meaningful moment pushes a
 * full snapshot of the visualization state. The `line` on each step points at the
 * pseudocode/code line that is "executing", so the animation and both code views
 * highlight in lockstep.
 */
export function buildMaxDepthTrace(root: TreeNode | null): TraceStep[] {
  const steps: TraceStep[] = [];
  const states: Record<number, NodeVizState> = {};
  const stack: StackFrame[] = [];
  let id = 0;

  // Start every node idle.
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
      push(1, null, `${sideNote} is null → return 0`);
      return 0;
    }

    stack.push({ nodeId: node.id, label: `maxDepth(${node.val})` });
    states[node.id] = { status: 'active' };
    push(0, node.id, `Call maxDepth(${node.val})`);

    states[node.id] = { status: 'recursing' };
    push(2, node.id, `Recurse into left child of ${node.val}`);
    const left = depth(node.left, `Left of ${node.val}`);

    states[node.id] = { status: 'recursing' };
    push(3, node.id, `Recurse into right child of ${node.val}`, { left });
    const right = depth(node.right, `Right of ${node.val}`);

    const result = 1 + Math.max(left, right);
    states[node.id] = { status: 'returned', returnValue: result };
    stack.pop();
    push(4, node.id, `${node.val}: 1 + max(${left}, ${right}) = ${result}`, { left, right, result });
    return result;
  };

  const answer = depth(root, 'Root');
  push(4, root ? root.id : null, `Done — the maximum depth is ${answer}`, { result: answer }, true);
  return steps;
}

export const maxDepthProblem: Problem = {
  id: 'maximum-depth',
  title: 'Maximum Depth of Binary Tree',
  dsId: 'trees',
  patternId: 'dfs-bubble-up',
  difficulty: 'Easy',
  statement:
    'Given the root of a binary tree, return its maximum depth — the number of nodes along the longest path from the root down to the farthest leaf.',
  complexity: { time: 'O(n)', space: 'O(h)' },
  input: fromLevelOrder([3, 9, 20, null, null, 15, 7]),
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
  buildTrace: buildMaxDepthTrace,
};
