import { Component, OnInit } from '@angular/core';
import { Ai } from './ai/ai'
import { StatsComponent, IStats } from '../stats/stats.component'
import { TicTacToe, Square, Mark } from './tictactoe/tictactoe'

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})

export class GameComponent implements OnInit {

  // inititate our needed objects
  game = new TicTacToe;
  ai = new Ai(this.game);
  stats = new StatsComponent();

  started: boolean = false;

  constructor() {

  }

  ngOnInit(): void {
    this.restore();
  }

  //finds if there was a previous game stored locally restores it
  private restore() {
    let obj = this.getLocalGameState();
    if ( obj !== 'undefined' && obj !== null ) {
      if(obj.game == false) {
        //localStorage.clear(); // I do not believe this is nessary but not 100%. Was bugging out stats
      } else {
        this.game.restore(obj);
      }
    }
  }

  //starts the game by flagging it as begun
  private start(mark: Mark) {
    this.started = true;
    this.stats.start(mark);
    this.game.start(mark);
    if(this.game.getAi() == Mark.X) {
      this.ai.go();
    }
    this.setLocalGameState();
  }

  // checks if the move was legal, if the game is over and has the AI go after
  move(square: Square) {
    if(this.game.move(square)) {
      this.ai.go();
      if(this.game.wins()) {
        this.game.lost();
        this.stats.setLost();
      } else if (this.game.turn > 8) {
        this.game.tie();
        this.stats.setTie();
      }
      this.setLocalGameState();
    }
  }

  // Shows the correct mark in the square
  squareImg(square: number): string {
    let imgPath = "../../assets/img/blank.png";
    if(this.game.getMark(square) == Mark.X) {
      imgPath = "../../assets/img/x.png";
    } else if(this.game.getMark(square) == Mark.O) {
      imgPath = "../../assets/img/o.png";
    }
    return imgPath;
  }

  // Starts the CSS animation
  aiAnimate(square: number): boolean {
    if(square == this.ai.getLast()){
      return true;
    }
    return false;
  }


  // Saves the game state to localstorage
  setLocalGameState() {
      let localData = {
        "board": this.game.getBoard(),
        "game": this.game.getIsGame(),
        "turn": this.game.getTurn(),
        "player": this.game.getPlayer(),
        "ai": this.game.getAi()
      };
      localStorage.setItem("game", JSON.stringify(localData));
  }

  // gets the game state from local storage
  getLocalGameState() {
    return JSON.parse(localStorage.getItem("game"));
  }

}
