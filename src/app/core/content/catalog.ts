import { balancedProblem } from '../../content/trees/balanced';
import { diameterProblem } from '../../content/trees/diameter';
import { invertProblem } from '../../content/trees/invert';
import { maxDepthProblem } from '../../content/trees/max-depth';
import { mergeProblem } from '../../content/trees/merge';
import { minDepthProblem } from '../../content/trees/min-depth';
import { pathSumProblem } from '../../content/trees/path-sum';
import { sameTreeProblem } from '../../content/trees/same-tree';
import { subtreeProblem } from '../../content/trees/subtree';
import { symmetricProblem } from '../../content/trees/symmetric';
import { DataStructure, Pattern, Problem } from './catalog.model';

/**
 * The content index that drives the funnel. For the demo only Trees →
 * "DFS bubble-up" → "Maximum Depth" is playable; everything else is shown as
 * "coming soon" to convey the full roadmap.
 */

export const DATA_STRUCTURES: DataStructure[] = [
  {
    id: 'trees',
    title: 'Trees & BST',
    blurb: 'Recursive DFS, BFS levels, and BST order.',
    available: true,
    patternIds: ['dfs-bubble-up', 'dual-tree', 'top-down'],
  },
  { id: 'arrays', title: 'Arrays & Strings', blurb: 'Two pointers, sliding window, prefix sums.', available: false, patternIds: [] },
  { id: 'linked-list', title: 'Linked Lists', blurb: 'Fast/slow pointers, reversal, merging.', available: false, patternIds: [] },
  { id: 'stacks', title: 'Stacks & Queues', blurb: 'Monotonic stack, BFS, parsing.', available: false, patternIds: [] },
  { id: 'graphs', title: 'Graphs', blurb: 'DFS/BFS, topological sort, union-find.', available: false, patternIds: [] },
  { id: 'dp', title: 'Dynamic Programming', blurb: 'Memoization and bottom-up tables.', available: false, patternIds: [] },
];

export const PATTERNS: Record<string, Pattern> = {
  'dfs-bubble-up': {
    id: 'dfs-bubble-up',
    dsId: 'trees',
    title: 'DFS — Bubble-up (postorder)',
    blurb: "Solve a node from its children's answers. The single most common tree pattern.",
    problemIds: ['maximum-depth', 'minimum-depth', 'diameter-of-binary-tree', 'balanced-binary-tree', 'invert-binary-tree'],
    comingSoon: [],
  },
  'dual-tree': {
    id: 'dual-tree',
    dsId: 'trees',
    title: 'Dual-tree recursion',
    blurb: 'Recurse two trees in lockstep.',
    problemIds: ['same-tree', 'symmetric-tree', 'subtree-of-another-tree', 'merge-two-binary-trees'],
    comingSoon: [],
  },
  'top-down': {
    id: 'top-down',
    dsId: 'trees',
    title: 'Top-down (accumulator)',
    blurb: 'Carry a running value down each path.',
    problemIds: ['path-sum'],
    comingSoon: [],
  },
};

export const PROBLEMS: Record<string, Problem> = {
  'maximum-depth': maxDepthProblem,
  'minimum-depth': minDepthProblem,
  'diameter-of-binary-tree': diameterProblem,
  'balanced-binary-tree': balancedProblem,
  'path-sum': pathSumProblem,
  'same-tree': sameTreeProblem,
  'symmetric-tree': symmetricProblem,
  'subtree-of-another-tree': subtreeProblem,
  'merge-two-binary-trees': mergeProblem,
  'invert-binary-tree': invertProblem,
};

export const getDataStructure = (id: string): DataStructure | undefined =>
  DATA_STRUCTURES.find((d) => d.id === id);

export const getPattern = (id: string): Pattern | undefined => PATTERNS[id];

export const getProblem = (id: string): Problem | undefined => PROBLEMS[id];

export const patternsFor = (dsId: string): Pattern[] =>
  (getDataStructure(dsId)?.patternIds ?? []).map((pid) => PATTERNS[pid]).filter((p): p is Pattern => !!p);
