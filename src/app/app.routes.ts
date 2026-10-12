import { Routes } from '@angular/router';
import { DsList } from './features/catalog/ds-list';
import { PatternList } from './features/catalog/pattern-list';
import { ProblemList } from './features/catalog/problem-list';
import { Player } from './features/player/player';

export const routes: Routes = [
  { path: '', component: DsList, title: 'AlgoMotion' },
  { path: 'learn/:ds', component: PatternList, title: 'AlgoMotion — Patterns' },
  { path: 'learn/:ds/:pattern', component: ProblemList, title: 'AlgoMotion — Problems' },
  { path: 'learn/:ds/:pattern/:problem', component: Player, title: 'AlgoMotion — Player' },
  { path: '**', redirectTo: '' },
];
