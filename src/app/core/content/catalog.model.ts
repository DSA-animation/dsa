import { TreeNode } from '../tree/tree-node.model';
import { TraceStep } from '../trace/step.model';

/** Languages we author concrete code for. JavaScript first; others added by authoring one more array. */
export type Language = 'javascript';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

/** A fully-authored, playable problem. */
export interface Problem {
  id: string;
  title: string;
  dsId: string;
  patternId: string;
  difficulty: Difficulty;
  statement: string;
  complexity: { time: string; space: string };

  /** The example input the animation runs on. */
  input: TreeNode | null;

  /** Pseudocode lines; index aligns with each language's code lines and with `TraceStep.line`. */
  pseudocode: string[];
  /** Per-language code lines, index-aligned with `pseudocode`. */
  code: Record<Language, string[]>;

  /** Instrumented reference solution → the trace the player animates. */
  buildTrace: (root: TreeNode | null) => TraceStep[];
}

/** A pattern groups problems that are solved the same way. */
export interface Pattern {
  id: string;
  dsId: string;
  title: string;
  blurb: string;
  problemIds: string[]; // playable
  comingSoon: string[]; // titles shown as locked, to convey the roadmap
}

/** A top-level data structure / topic in the funnel. */
export interface DataStructure {
  id: string;
  title: string;
  blurb: string;
  available: boolean;
  patternIds: string[];
}
