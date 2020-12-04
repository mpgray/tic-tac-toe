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
  gameTurn = 0;

  showAlert = false;
  alertMessage = "Good luck";

  constructor() { }

  ngOnInit(): void {
  }

  clearBoard(){
    this.gameBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.gameTurn = 0;
  }

  startGame(piece: number){
    this.clearBoard();
    this.showAlert = false;
    if(!this.isGame) {
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

  }

  makeMove(square: number) {
    if(this.isGame) {
      if(this.gameBoard[square] == 0) {
        this.gameBoard[square] = this.playerPiece;
        this.gameTurn++;
        this.aiTurn();
      }
    }
    if(this.gameTurn == 9) {
      this.isGame = false;
      console.log("You tie");
      this.tie();
    }
  }

  getGameMessage(): string{
    let gameMessage = "";
    if(this.gameTurn == 0 || this.gameTurn == 1) {
      gameMessage = "X always goes first";
    } else if(this.playerPiece == 1) {
      gameMessage = "You are X";
    } else if(this.playerPiece == 2) {
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
      case 2: {
        if(this.gameBoard[0] == this.playerPiece || this.gameBoard[2] == this.playerPiece)
          this.aiMove(1);
        else if (this.gameBoard[6] == this.playerPiece || this.gameBoard[8] == this.playerPiece)
          this.aiMove(7);
        else
          this.aiMove(0);
        break;
      }
      case 3: {
        let nextMove = this.aiWinScenarios(this.playerPiece);
        if(nextMove !== -1) {
          this.aiMove(nextMove);
          break;
        }
        nextMove = this.aiCheckSides();
        if(nextMove !== -1) {
          this.aiMove(nextMove);
          break;
        }
        nextMove = this.aiGoCorner();
        this.aiMove(nextMove);
        break;
      }
      case 4: case 5: case 6: case 7: case 8: {
        let nextMove = this.aiWinScenarios(this.aiPiece);
        if(nextMove !== -1) {
          this.aiMove(nextMove);
          this.aiWin();
          break;
        }
        nextMove = this.aiWinScenarios(this.playerPiece);
        if(nextMove !== -1) {
          this.aiMove(nextMove);
          break;
        }
        nextMove = this.aiGoCorner();
        if(nextMove !== -1) {
          this.aiMove(nextMove);
          break;
        }
        nextMove = this.aiNextOpen();
        if(nextMove !== -1) {
          this.aiMove(nextMove);
        } else {
          console.error("Error: AI Acted Unexpectedly");
        }
      }
      default: {
         this.isGame = false;
         break;
      }
   }
  }

  aiWin() {
    this.isGame = false;
    this.showAlert = true;
    this.alertMessage = "You Lost. I'm so, so sorry.";
    console.log("You lost")
  }

  tie() {
    this.isGame = false;
    this.showAlert = true;
    this.alertMessage = "You Tie.";
    console.log("You Tie")
  }

  aiNextOpen(): number {
    for(let i = 0; i < 8; i++){
      if(this.gameBoard[i] == 0)
        return i;
    }
    return -1;
  }

  aiGoCorner(): number {
    if(this.gameBoard[0] == 0) {
      return 0;
    }
    if(this.gameBoard[2] == 0) {
      return 2;
    }
    if(this.gameBoard[6] == 0) {
      return 6;
    }
    if(this.gameBoard[8] == 0) {
      return 8;
    }
    return -1
  }

  aiCheckSides(): number {
    if(this.gameBoard[1] == this.playerPiece && this.gameBoard[3] == this.playerPiece && this.gameBoard[0] == 0)
      return 0;
    if(this.gameBoard[1] == this.playerPiece && this.gameBoard[5] == this.playerPiece && this.gameBoard[2] == 0)
      return 2;
    if(this.gameBoard[7] == this.playerPiece && this.gameBoard[3] == this.playerPiece && this.gameBoard[6] == 0)
      return 6;
    if(this.gameBoard[7] == this.playerPiece && this.gameBoard[5] == this.playerPiece && this.gameBoard[8] == 0)
      return 8;
    return -1;
  }

  aiWinScenarios(character: number) {
    if(this.aiCheckWins([0,1,2], character) !== -1)
      return this.aiCheckWins([0,1,2], character);
    if(this.aiCheckWins([3,4,5], character) !== -1)
      return this.aiCheckWins([3,4,5], character);
    if(this.aiCheckWins([6,7,8], character) !== -1)
      return this.aiCheckWins([6,7,8], character);
    if(this.aiCheckWins([0,3,6], character) !== -1)
      return this.aiCheckWins([0,3,6], character);
    if(this.aiCheckWins([1,4,7], character) !== -1)
      return this.aiCheckWins([1,4,7], character);
    if(this.aiCheckWins([2,5,8], character) !== -1)
      return this.aiCheckWins([2,5,8], character);
    if(this.aiCheckWins([0,4,8], character) !== -1)
      return this.aiCheckWins([0,4,8], character);
    if(this.aiCheckWins([2,4,6], character) !== -1)
      return this.aiCheckWins([2,4,6], character);
    return -1;
  }


  aiCheckWins(wins: number[], character: number) {
    let count = 0;
    let isEmpty = false;
    for(let win of wins) {
      if(this.gameBoard[win] == character)
        count++;
      if(this.gameBoard[win] == 0)
        isEmpty = true;
    }
    if(count == 2 && isEmpty == true){
      for(let win of wins) {
        if(this.gameBoard[win] == 0) {
          return win;
        }
      }
    }
    return -1;
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
