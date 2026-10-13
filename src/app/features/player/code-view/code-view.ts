import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A line-numbered code/pseudocode panel that highlights the active line(s).
 * For pseudocode, the active line is simply `activeLine` (identity). For code
 * whose lines don't line up 1:1 with the pseudocode, pass `map` so line i
 * highlights when `map[i] === activeLine` — this keeps every language in sync
 * with the one animation.
 */
@Component({
  selector: 'am-code-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './code-view.html',
  styleUrl: './code-view.scss',
})
export class CodeView {
  readonly lines = input<string[]>([]);
  readonly activeLine = input<number>(-1);
  /** Optional: for code line i, the pseudocode line it highlights on (-1 = never). Null = identity. */
  readonly map = input<number[] | null>(null);

  protected isActive(i: number): boolean {
    const m = this.map();
    return m ? m[i] === this.activeLine() : i === this.activeLine();
  }
}
