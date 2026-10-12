import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A line-numbered code/pseudocode panel that highlights one active line.
 * Reused for both the pseudocode view and each language's code view — the same
 * `activeLine` (driven by the current trace step) lights up the matching line in
 * all of them, which is what makes picture → words → code feel like one thing.
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
}
