import { Component, OnInit } from '@angular/core';
import { Mark } from '../game/tictactoe/tictactoe';

// What is stores locally
export interface IStats {
  won: number,
  lost: number,
  tie: number,
  x: number,
  o: number,
  random: number
}

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})

export class StatsComponent implements OnInit {

  // Empty Data for locally storage
  statistics: IStats = {  won: 0,
                          lost: 0,
                          tie: 0,
                          x: 0,
                          o: 0,
                          random: 0 };

  constructor() {
    // Gets statistics
    this.statistics = this.initStats();
  }

  ngOnInit(): void {
  }

  //Checks if local storage exists for stats. If not, creates one.
  private initStats(): IStats {
    let stats: IStats = this.getStats();
    if( stats == null) {
      stats = this.statistics;
    }
    return stats
  }

  // Adds Mark (X or O) used to the local storage for the player's statistics.
  public start(mark: Mark) {
    switch (mark) {
      case Mark.O:
        this.statistics.o++;
        break;
      case Mark.X:
        this.statistics.x++;
        break;
      case Mark.RANDOM:
        this.statistics.random++;
        break;
    }
    this.setStats(this.statistics);
  }

  public setStats(stats: IStats) {
    localStorage.setItem("statistics", JSON.stringify(stats));
  }

  public getStats(): IStats {
    return JSON.parse(localStorage.getItem("statistics"));
  }

  public setLost() {
    this.statistics.lost++;
    this.setStats(this.statistics);
  }

  public setTie() {
    this.statistics.tie++;
    this.setStats(this.statistics);
  }

  //clears stored data
  public clear() {
    this.statistics = {  won: 0,
                        lost: 0,
                        tie: 0,
                        x: 0,
                        o: 0,
                        random: 0 };
    this.setStats(this.statistics);
  }

}
