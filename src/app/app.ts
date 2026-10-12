import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fromLevelOrder } from './core/tree/tree-builder';
import { TreeCanvas } from './features/visualizer/tree-canvas/tree-canvas';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TreeCanvas],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** Temporary sample tree for Phase 1 — the LeetCode max-depth example `[3,9,20,null,null,15,7]`. */
  protected readonly sampleTree = signal(fromLevelOrder([3, 9, 20, null, null, 15, 7]));
}
