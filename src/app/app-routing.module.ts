import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { GameComponent } from './game/game.component';
import { StatsComponent } from './stats/stats.component';

const routes: Routes = [
  { path: 'play', component: GameComponent },
  { path: 'stats', component: StatsComponent },
  { path: 'about', component: AboutComponent },
  { path: '',   redirectTo: '/play', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
