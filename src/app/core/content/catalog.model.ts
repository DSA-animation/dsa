import { LevelOrderValue, TreeNode } from '../tree/tree-node.model';
import { TraceStep } from '../trace/step.model';

/** Languages we author concrete code for. Each is line-aligned with the pseudocode. */
export type Language = 'javascript' | 'python' | 'java' | 'cpp';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

/** A company tag with the typical experience level at which this problem appears there. */
export interface CompanyTag {
  name: string;
  /** Typical years-of-experience band / level (a guide — per-question YOE isn't published). */
  level: string;
}

/** One input the learner can run any approach on — including deliberate edge cases. */
export interface TestCase {
  id: string;
  label: string;
  /** Why this case matters (what it stresses / which edge it covers). */
  why: string;
  levelOrder: LevelOrderValue[];
  expected: number;
  isEdge?: boolean;
}

/** One turn of the mock interview: what the interviewer asks, and the ideal candidate answer. */
export interface InterviewExchange {
  interviewer: string;
  candidate: string;
}

/** A phase of the interview (opening, approach, complexity, follow-ups…). */
export interface InterviewSection {
  heading: string;
  exchanges: InterviewExchange[];
}

/** The reusable Recursion Recipe, filled per recursive approach. */
export interface RecursionRecipe {
  contract: string;
  baseCase: string;
  recurse: string;
  combine: string;
}

/**
 * One way to solve the problem. A problem holds several of these, because in a
 * real interview the candidate explores approaches (brute force, recursion,
 * iterative) rather than jumping straight to the optimal one.
 */
export interface Solution {
  id: string;
  name: string; // "Recursive DFS (post-order)"
  tagline: string; // one-line pitch
  /** Label for the auxiliary-structure panel: "Call stack" for recursion, "Queue" for BFS. */
  auxLabel: string;
  complexity: { time: string; timeWhy: string; space: string; spaceWhy: string };
  /** How you'd reason your way to THIS approach at a whiteboard. */
  approach: string[];
  /** Only for recursive approaches. */
  recipe?: RecursionRecipe;
  /** Pseudocode lines; `TraceStep.line` indexes into this. */
  pseudocode: string[];
  code: Record<Language, string[]>;
  /**
   * Optional per-language map: codeMap[lang][i] = the pseudocode line that code
   * line i highlights on (-1 = never). When absent for a language, code line i
   * highlights on pseudocode line i (identity) — fine when the code lines up 1:1.
   */
  codeMap?: Partial<Record<Language, number[]>>;
  /** Instrumented reference implementation → the trace the player animates. */
  buildTrace: (root: TreeNode | null) => TraceStep[];
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
  /** Companies this problem is commonly reported to be asked at (curated; LeetCode's exact tags are paywalled). */
  companies: CompanyTag[];
  /** Honest note on the experience level this problem targets (per-question YOE isn't published). */
  experienceNote: string;

  // ---- Shared interview-prep content (sourced from the learner's own notes) ----
  /** The one insight that unlocks the problem. */
  keyRealization: string;
  /** A comprehensive, Google-bar interview drill covering every aspect of the problem. */
  interview: InterviewSection[];

  // ---- Inputs (shared across approaches) ----
  testCases: TestCase[];

  // ---- Approaches ----
  solutions: Solution[];
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
