import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getDataStructure, getPattern, getProblem } from '../../core/content/catalog';
import { Problem } from '../../core/content/catalog.model';

/** Funnel step 3: pick a problem within a pattern. */
@Component({
  selector: 'am-problem-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="browse">
      <nav class="crumbs">
        <a routerLink="/">Topics</a><span class="sep">/</span>
        <a [routerLink]="['/learn', ds()]">{{ dsData()?.title || ds() }}</a><span class="sep">/</span>
        <span>{{ patternData()?.title || pattern() }}</span>
      </nav>

      <header class="hero hero--sub">
        <h1>{{ patternData()?.title || pattern() }}</h1>
        <p>{{ patternData()?.blurb }}</p>
      </header>

      <div class="cards">
        @for (pr of problems(); track pr.id) {
          <a class="card" [routerLink]="['/learn', ds(), pattern(), pr.id]">
            <span class="diff diff--{{ pr.difficulty }}">{{ pr.difficulty }}</span>
            <h3>{{ pr.title }}</h3>
            <span class="go">Watch it solve →</span>
          </a>
        }
        @for (title of comingSoon(); track title) {
          <div class="card card--soon" aria-disabled="true">
            <h3>{{ title }}</h3>
            <span class="soon">Coming soon</span>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './browse.scss',
})
export class ProblemList {
  readonly ds = input<string>('');
  readonly pattern = input<string>('');
  protected readonly dsData = computed(() => getDataStructure(this.ds()));
  protected readonly patternData = computed(() => getPattern(this.pattern()));
  protected readonly problems = computed(() =>
    (this.patternData()?.problemIds ?? []).map(getProblem).filter((p): p is Problem => !!p),
  );
  protected readonly comingSoon = computed(() => this.patternData()?.comingSoon ?? []);
}
