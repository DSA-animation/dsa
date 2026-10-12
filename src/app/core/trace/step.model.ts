/**
 * The DS-agnostic execution-trace model.
 *
 * An algorithm runs ONCE (instrumented) and emits an ordered list of `TraceStep`s.
 * The player steps through them; every panel (canvas, call stack, variables,
 * pseudocode, code) is a pure function of the current step. No panel re-runs the
 * algorithm — this is the decoupling that lets every data structure reuse one player.
 */

export type NodeStatus = 'idle' | 'active' | 'recursing' | 'returned' | 'broken';

/** The visual state of a single tree node at a given step. */
export interface NodeVizState {
  status: NodeStatus;
  returnValue?: number;
}

/** One frame of the recursion call stack. */
export interface StackFrame {
  nodeId: number;
  label: string; // e.g. "maxDepth(3)"
}

/** A single moment in the algorithm's execution. */
export interface TraceStep {
  id: number;
  /** Index into the problem's pseudocode / code line arrays (they are kept aligned). */
  line: number;
  /** The node this step is about, or null for a base/empty case. */
  focusNodeId: number | null;
  /** Full snapshot of every node's visual state at this step. */
  nodeStates: Record<number, NodeVizState>;
  /** The recursion stack at this step (bottom → top). */
  callStack: StackFrame[];
  /** Watch-panel values revealed so far (left, right, result…). */
  vars: Record<string, number | string>;
  /** Human-readable caption explaining this step. */
  note: string;
  /** True on the final step. */
  done?: boolean;
}
