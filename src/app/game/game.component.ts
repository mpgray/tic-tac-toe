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

  showAlert = false;
  alertMessage = "Good luck";

  constructor() {}

  ngOnInit(): void {
  }

  private start(mark: Mark) {
    this.game.start(mark);
    if(this.game.getAi() == Mark.X) {
      this.ai.go();
    }
  }

  move(square: Square) {
    if(this.game.move(square)) {
      this.ai.go();
    }
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

  lost() {
    this.game.end();
    this.showAlert = true;
    this.alertMessage = "You Lost. I'm so, so sorry.";
    console.log("You lost")
  }

  tie() {
    this.game.end();
    this.showAlert = true;
    this.alertMessage = "You Tie.";
    console.log("You Tie")
  }

  aiAnimate(square: number): boolean {
    if(square == this.ai.getLast()){
      return true;
    }
    return false;
}


}
