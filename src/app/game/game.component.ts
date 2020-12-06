import { Component, OnInit } from '@angular/core';
import { Ai } from './ai/ai'
import { TicTacToe, Square, Mark } from './tictactoe/tictactoe'

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})

export class GameComponent implements OnInit {

  game = new TicTacToe;
  ai = new Ai(this.game);

  started: boolean = false;

  constructor() {

  }

  ngOnInit(): void {
    this.restore();
  }

  private restore() {
    let obj = this.getLocalGameState();
    if ( obj !== 'undefined' && obj !== null ) {
      if(obj.game == false) {
        localStorage.clear();
      } else {
        this.game.restore(obj);
      }
    }
  }

  private start(mark: Mark) {
    this.started = true;
    this.game.start(mark);
    if(this.game.getAi() == Mark.X) {
      this.ai.go();
    }
    this.setLocalGameState();
  }

  move(square: Square) {
    if(this.game.move(square)) {
      this.ai.go();
      if(this.game.wins()) {
        this.game.lost();
      } else if (this.game.turn > 8) {
        this.game.tie();
      }
    }
    this.setLocalGameState();
  }

  squareImg(square: number): string {
    let imgPath = "../../assets/img/blank.png";
    if(this.game.getMark(square) == Mark.X) {
      imgPath = "../../assets/img/x.png";
    } else if(this.game.getMark(square) == Mark.O) {
      imgPath = "../../assets/img/o.png";
    }
    return imgPath;
  }

  aiAnimate(square: number): boolean {
    if(square == this.ai.getLast()){
      return true;
    }
    return false;
  }

  setLocalGameState() {
      let localData = {
        "board": this.game.getBoard(),
        "game": this.game.getIsGame(),
        "turn": this.game.getTurn(),
        "player": this.game.getPlayer(),
        "ai": this.game.getAi()
      };
      console.log(localData);
      localStorage.setItem("game", JSON.stringify(localData));
  }

  getLocalGameState() {
    return JSON.parse(localStorage.getItem("game"));
  }

}
