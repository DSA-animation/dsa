import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DATA_STRUCTURES } from '../../core/content/catalog';

/** Funnel step 1: pick a data structure. */
@Component({
  selector: 'am-ds-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="browse">
      <header class="hero">
        <h1>See the pattern. Then the code.</h1>
        <p>Pick a data structure, choose a pattern, and watch a problem solve itself — step by step.</p>
      </header>

      <div class="cards">
        @for (d of structures; track d.id) {
          @if (d.available) {
            <a class="card" [routerLink]="['/learn', d.id]">
              <h3>{{ d.title }}</h3>
              <p>{{ d.blurb }}</p>
              <span class="go">Explore →</span>
            </a>
          } @else {
            <div class="card card--soon" aria-disabled="true">
              <h3>{{ d.title }}</h3>
              <p>{{ d.blurb }}</p>
              <span class="soon">Coming soon</span>
            </div>
          }
        }
      </div>
    </section>
  `,
  styleUrl: './browse.scss',
})
export class DsList {
  protected readonly structures = DATA_STRUCTURES;
}
