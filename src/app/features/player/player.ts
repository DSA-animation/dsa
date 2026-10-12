import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getDataStructure, getPattern, getProblem } from '../../core/content/catalog';
import { Language } from '../../core/content/catalog.model';
import { TreeCanvas } from '../visualizer/tree-canvas/tree-canvas';
import { CodeView } from './code-view/code-view';

/**
 * The player: runs the trace for a problem and drives every panel (canvas,
 * call stack, variables, pseudocode, code) from a single `currentStep` signal.
 * Route params `ds`/`pattern`/`problem` arrive via `withComponentInputBinding`.
 */
@Component({
  selector: 'am-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TreeCanvas, CodeView],
  templateUrl: './player.html',
  styleUrl: './player.scss',
})
export class Player {
  // Route params.
  readonly ds = input<string>('');
  readonly pattern = input<string>('');
  readonly problem = input<string>('');

  // Content.
  protected readonly problemData = computed(() => getProblem(this.problem()));
  protected readonly patternData = computed(() => getPattern(this.pattern()));
  protected readonly dsData = computed(() => getDataStructure(this.ds()));
  protected readonly steps = computed(() => {
    const p = this.problemData();
    return p ? p.buildTrace(p.input) : [];
  });

  // Playback state.
  protected readonly index = signal(0);
  protected readonly playing = signal(false);
  protected readonly speed = signal(1);
  protected readonly language = signal<Language>('javascript');
  protected readonly revealCode = signal(false);

  // Derived view of the current step.
  protected readonly currentStep = computed(() => this.steps()[this.index()] ?? null);
  protected readonly nodeStates = computed(() => this.currentStep()?.nodeStates ?? {});
  protected readonly callStack = computed(() => this.currentStep()?.callStack ?? []);
  protected readonly note = computed(() => this.currentStep()?.note ?? '');
  protected readonly activeLine = computed(() => this.currentStep()?.line ?? -1);
  protected readonly varsEntries = computed(() => Object.entries(this.currentStep()?.vars ?? {}));
  protected readonly isDone = computed(() => this.currentStep()?.done ?? false);
  protected readonly atStart = computed(() => this.index() === 0);
  protected readonly atEnd = computed(() => this.index() >= this.steps().length - 1);
  protected readonly pct = computed(() => {
    const total = this.steps().length;
    return total > 1 ? (this.index() / (total - 1)) * 100 : 0;
  });

  protected readonly pseudocode = computed(() => this.problemData()?.pseudocode ?? []);
  protected readonly codeLines = computed(() => this.problemData()?.code[this.language()] ?? []);

  constructor() {
    // Auto-advance while playing; re-created when playing/speed change.
    effect((onCleanup) => {
      if (!this.playing()) return;
      const ms = 1100 / this.speed();
      const timer = setInterval(() => {
        if (this.atEnd()) {
          this.playing.set(false);
        } else {
          this.index.update((i) => i + 1);
        }
      }, ms);
      onCleanup(() => clearInterval(timer));
    });
  }

  protected togglePlay(): void {
    if (this.atEnd()) this.index.set(0);
    this.playing.update((p) => !p);
  }
  protected next(): void {
    this.playing.set(false);
    if (!this.atEnd()) this.index.update((i) => i + 1);
  }
  protected prev(): void {
    this.playing.set(false);
    if (!this.atStart()) this.index.update((i) => i - 1);
  }
  protected restart(): void {
    this.playing.set(false);
    this.index.set(0);
  }
  protected onSpeed(e: Event): void {
    this.speed.set(Number((e.target as HTMLSelectElement).value));
  }
  protected pickLanguage(): void {
    this.language.set('javascript');
    this.revealCode.set(true);
  }
}
