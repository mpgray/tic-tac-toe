import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  gameBoard: number[] = [1, 0, 0, 0, 0, 0, 0, 0, 0];

  constructor() { }

  ngOnInit(): void {
  }

  makeMove(square: number) {
    this.gameBoard[square] = 1
  }

  squareImg(square: number): string {
    let imgPath = "../../assets/img/blank.png";
    if(this.gameBoard[square] == 1) {
      imgPath = "../../assets/img/x.png";
    } else if(this.gameBoard[square] == 2) {
      imgPath = "../../assets/img/o.png";
    }
    return imgPath;
  }

}
