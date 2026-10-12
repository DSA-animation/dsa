import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TreeNode } from '../../../core/tree/tree-node.model';
import { layoutTree, NODE_RADIUS } from '../../../core/tree/tree-layout';

/**
 * Renders a binary tree as an SVG figure.
 *
 * Pure presentation: it takes a `root` and derives its layout with a `computed`.
 * It holds no algorithm state — the trace/animation layer (Phase 2+) will drive
 * highlighting by passing extra inputs, not by this component computing anything.
 */
@Component({
  selector: 'tt-tree-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tree-canvas.html',
  styleUrl: './tree-canvas.scss',
})
export class TreeCanvas {
  /** Root of the tree to draw. `null` renders an empty canvas. */
  readonly root = input<TreeNode | null>(null);

  protected readonly radius = NODE_RADIUS;
  protected readonly layout = computed(() => layoutTree(this.root()));
  protected readonly viewBox = computed(() => {
    const l = this.layout();
    return `0 0 ${l.width} ${l.height}`;
  });
}
