import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getDataStructure, getPattern, getProblem } from '../../core/content/catalog';
import { Language } from '../../core/content/catalog.model';
import { fromLevelOrder } from '../../core/tree/tree-builder';
import { TreeCanvas } from '../visualizer/tree-canvas/tree-canvas';
import { CodeView } from './code-view/code-view';

/**
 * The player: an interview-style workspace. Pick an APPROACH and a TEST CASE,
 * then watch the animation + synced whiteboard explanation + pseudocode on top,
 * the language-specific code below, and the full interview-prep breakdown at the
 * bottom. Every panel is a pure function of one `currentStep` signal.
 */
@Component({
  selector: 'am-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TreeCanvas, CodeView],
  templateUrl: './player.html',
  styleUrl: './player.scss',
})
export class Player {
  readonly ds = input<string>('');
  readonly pattern = input<string>('');
  readonly problem = input<string>('');

  protected readonly problemData = computed(() => getProblem(this.problem()));
  protected readonly patternData = computed(() => getPattern(this.pattern()));
  protected readonly dsData = computed(() => getDataStructure(this.ds()));

  // Approach (solution) selection.
  protected readonly solutions = computed(() => this.problemData()?.solutions ?? []);
  protected readonly selectedSolutionId = signal<string>('');
  protected readonly currentSolution = computed(() => {
    const sols = this.solutions();
    return sols.find((s) => s.id === this.selectedSolutionId()) ?? sols[0];
  });

  // Test-case selection.
  protected readonly testCases = computed(() => this.problemData()?.testCases ?? []);
  protected readonly selectedCaseId = signal<string>('');
  protected readonly currentCase = computed(() => {
    const cases = this.testCases();
    return cases.find((c) => c.id === this.selectedCaseId()) ?? cases[0];
  });
  protected readonly currentTree = computed(() => fromLevelOrder(this.currentCase()?.levelOrder ?? []));
  protected readonly treeB = computed(() => {
    const b = this.currentCase()?.levelOrderB;
    return b ? fromLevelOrder(b, 1000) : null;
  });
  protected readonly isDual = computed(() => this.problemData()?.dual ?? false);
  protected readonly resultTree = computed(() => this.currentSolution()?.resultTree?.(this.currentTree(), this.treeB()) ?? null);
  protected readonly hasResult = computed(() => !!this.resultTree());

  // The trace for the selected approach + case.
  protected readonly steps = computed(() => {
    const sol = this.currentSolution();
    return sol ? sol.buildTrace(this.currentTree(), this.currentCase()?.arg, this.treeB()) : [];
  });

  // Playback state.
  protected readonly index = signal(0);
  protected readonly playing = signal(false);
  protected readonly speed = signal(1);
  protected readonly language = signal<Language>('javascript');
  protected readonly languages: { id: Language; label: string }[] = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'java', label: 'Java' },
    { id: 'cpp', label: 'C++' },
  ];

  // Right-pane tabs.
  protected readonly activeTab = signal<string>('pseudocode');

  // Derived view of the current step (clamped so a shorter new trace can't go out of range).
  protected readonly currentStep = computed(() => {
    const s = this.steps();
    return s[this.index()] ?? s[s.length - 1] ?? null;
  });
  protected readonly nodeStates = computed(() => this.currentStep()?.nodeStates ?? {});
  protected readonly aux = computed(() => this.currentStep()?.callStack ?? []);
  protected readonly auxLabel = computed(() => this.currentSolution()?.auxLabel ?? 'Call stack');
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

  protected readonly pseudocode = computed(() => this.currentSolution()?.pseudocode ?? []);
  protected readonly codeLines = computed(() => this.currentSolution()?.code[this.language()] ?? []);
  protected readonly codeMap = computed(() => this.currentSolution()?.codeMap?.[this.language()] ?? null);

  constructor() {
    effect((onCleanup) => {
      if (!this.playing()) return;
      const ms = 1200 / this.speed();
      const timer = setInterval(() => {
        if (this.atEnd()) this.playing.set(false);
        else this.index.update((i) => i + 1);
      }, ms);
      onCleanup(() => clearInterval(timer));
    });
  }

  private resetPlayback(): void {
    this.playing.set(false);
    this.index.set(0);
  }
  protected selectSolution(id: string): void {
    this.resetPlayback();
    this.selectedSolutionId.set(id);
  }
  protected selectCase(id: string): void {
    this.resetPlayback();
    this.selectedCaseId.set(id);
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
    this.resetPlayback();
  }
  protected onSpeed(e: Event): void {
    this.speed.set(Number((e.target as HTMLSelectElement).value));
  }
  protected setLanguage(l: Language): void {
    this.language.set(l);
  }
  protected setTab(id: string): void {
    this.activeTab.set(id);
  }
}
