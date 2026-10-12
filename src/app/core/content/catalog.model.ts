import { LevelOrderValue, TreeNode } from '../tree/tree-node.model';
import { TraceStep } from '../trace/step.model';

/** Languages we author concrete code for. JavaScript first; others added by authoring one more array. */
export type Language = 'javascript';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

/** One input the learner can run the animation on — including deliberate edge cases. */
export interface TestCase {
  id: string;
  label: string;
  /** Why this case matters (what it stresses / which edge it covers). */
  why: string;
  levelOrder: LevelOrderValue[];
  expected: number;
  isEdge?: boolean;
}

/** An interviewer follow-up and how to answer it. */
export interface FollowUp {
  q: string;
  a: string;
}

/** The reusable Recursion Recipe, filled per problem. */
export interface RecursionRecipe {
  contract: string;
  baseCase: string;
  recurse: string;
  combine: string;
}

/** A fully-authored, playable problem with its interview-prep content. */
export interface Problem {
  id: string;
  title: string;
  dsId: string;
  patternId: string;
  difficulty: Difficulty;
  leetcode?: number;
  statement: string;
  complexity: { time: string; timeWhy: string; space: string; spaceWhy: string };

  // ---- Interview-prep content (sourced from the learner's own notes) ----
  /** The one insight that unlocks the problem. */
  keyRealization: string;
  /** The whiteboard reasoning that arrives at the solution cold. */
  approach: string[];
  /** Contract / base / recurse / combine. */
  recipe: RecursionRecipe;
  /** How top-company interviewers grill you on this problem. */
  followUps: FollowUp[];
  /** The transferable pattern this problem teaches. */
  transferable: string;

  // ---- Code ----
  /** Pseudocode lines; index aligns with each language's code lines and with `TraceStep.line`. */
  pseudocode: string[];
  code: Record<Language, string[]>;

  // ---- Inputs ----
  testCases: TestCase[];

  /** Instrumented reference solution → the trace the player animates for a given input. */
  buildTrace: (root: TreeNode | null) => TraceStep[];
}

/** A pattern groups problems that are solved the same way. */
export interface Pattern {
  id: string;
  dsId: string;
  title: string;
  blurb: string;
  problemIds: string[];
  comingSoon: string[];
}

/** A top-level data structure / topic in the funnel. */
export interface DataStructure {
  id: string;
  title: string;
  blurb: string;
  available: boolean;
  patternIds: string[];
}
