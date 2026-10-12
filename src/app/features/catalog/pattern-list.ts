import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getDataStructure, patternsFor } from '../../core/content/catalog';

/** Funnel step 2: pick a pattern within a data structure. */
@Component({
  selector: 'am-pattern-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="browse">
      <nav class="crumbs">
        <a routerLink="/">Topics</a><span class="sep">/</span>
        <span>{{ dsData()?.title || ds() }}</span>
      </nav>

      <header class="hero hero--sub">
        <h1>{{ dsData()?.title || ds() }} — patterns</h1>
        <p>Each pattern is a reusable way of thinking. Master the pattern, and its problems collapse into one.</p>
      </header>

      <div class="cards">
        @for (p of patterns(); track p.id) {
          @if (p.problemIds.length) {
            <a class="card" [routerLink]="['/learn', ds(), p.id]">
              <h3>{{ p.title }}</h3>
              <p>{{ p.blurb }}</p>
              <span class="go">{{ p.problemIds.length }} problem{{ p.problemIds.length > 1 ? 's' : '' }} →</span>
            </a>
          } @else {
            <div class="card card--soon" aria-disabled="true">
              <h3>{{ p.title }}</h3>
              <p>{{ p.blurb }}</p>
              <span class="soon">Coming soon</span>
            </div>
          }
        }
      </div>
    </section>
  `,
  styleUrl: './browse.scss',
})
export class PatternList {
  readonly ds = input<string>('');
  protected readonly dsData = computed(() => getDataStructure(this.ds()));
  protected readonly patterns = computed(() => patternsFor(this.ds()));
}
