import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})

export class GameComponent implements OnInit {


  // 0 is empty, 1 is X and 2 is O.
  gameBoard: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  playerPiece: number = 0;
  aiPiece: number = 0;
  aiLastMove: number;

  isGame: boolean = false;
  gameTurn = 0

  constructor() { }

  ngOnInit(): void {
  }

  startGame(piece: number){
    this.isGame = true;
    if(piece == 3) {
      piece = Math.floor(Math.random() * (2)) + 1;
    }
    this.playerPiece = piece;
    if(this.playerPiece == 1)
      this.aiPiece = 2;
    else {
      this.aiPiece = 1;
      this.aiTurn();
    }

  }

  makeMove(square: number) {
    if(this.gameBoard[square] == 0) {
      this.gameBoard[square] = this.playerPiece;
    }
    this.gameTurn++;
    this.aiTurn();
  }

  getGameMessage(): string{
    let gameMessage = "";
    if(this.gameTurn == 0) {
      gameMessage = "Game Over";
    }
    if(this.playerPiece == 1){
      gameMessage = "You are X";
    }
    if(this.playerPiece == 2){
      gameMessage = "You are 0";
    }
    return gameMessage;
  }

  isOpen(square: number): boolean {
    if(this.gameBoard[square] == 0) {
      return true;
    }
    return false;
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

  aiTurn(){
    switch(this.gameTurn) {
      case 0: {
        this.aiMove(4);
        break;
      }
      case 1: {
         if(this.gameBoard[4] == 0) {
           this.aiMove(4);
         } else {
           this.aiMove(0);
         }
         break;
      }
      default: {
         //statements;
         break;
      }
   }
  }

  aiMove(square: number) {
      this.gameBoard[square] = this.aiPiece;
      this.aiLastMove = square;
      this.gameTurn++;
  }

  aiAnimate(square: number): boolean {
      if(square == this.aiLastMove){
        return true;
      }
      return false;
  }

}
