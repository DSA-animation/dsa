import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TreeNode } from '../../../core/tree/tree-node.model';
import { layoutTree, NODE_RADIUS } from '../../../core/tree/tree-layout';
import { NodeVizState } from '../../../core/trace/step.model';

/**
 * Renders a binary tree as SVG and colors each node by its current step state
 * (idle / active / recursing / returned). A returned node shows its value as a
 * badge — this is the "bubble-up" made visible. Pure presentation: it reads
 * `root` + `nodeStates` and derives everything via `computed`.
 */
@Component({
  selector: 'am-tree-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tree-canvas.html',
  styleUrl: './tree-canvas.scss',
})
export class TreeCanvas {
  /** Root of the tree to draw. */
  readonly root = input<TreeNode | null>(null);
  /** Per-node visual state for the current step (empty = all idle). */
  readonly nodeStates = input<Record<number, NodeVizState>>({});

  protected readonly radius = NODE_RADIUS;
  protected readonly layout = computed(() => layoutTree(this.root()));
  protected readonly edges = computed(() => this.layout().edges);
  protected readonly viewBox = computed(() => {
    const l = this.layout();
    return `0 0 ${l.width} ${l.height}`;
  });

  /** Layout nodes merged with their current status + return value. */
  protected readonly nodes = computed(() => {
    const states = this.nodeStates();
    return this.layout().nodes.map((n) => {
      const s = states[n.id];
      return { ...n, status: s?.status ?? 'idle', returnValue: s?.returnValue };
    });
  });
}
