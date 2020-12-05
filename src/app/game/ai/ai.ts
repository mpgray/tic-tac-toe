import { TicTacToe, Square, Mark  } from '../tictactoe/tictactoe';

export class Ai {

  private lastMove: Square;

  constructor(private game: TicTacToe) { }

  public getLast(): Square {
    return this.lastMove;
  }

  go(){
    switch(this.game.getTurn()) {
      case 0: {
        this.move(Square.MIDDLE);
        break;
      }
      case 1: {
         if(this.game.getMark(Square.MIDDLE) == Mark.EMPTY) {
           this.move(Square.MIDDLE);
         } else {
           this.move(Square.TOP_LEFT);
         }
         break;
      }
      case 2: {
        if(this.game.getMark(Square.TOP_LEFT) == this.game.getPlayer() || this.game.getMark(Square.TOP_RIGHT) == this.game.getPlayer())
          this.move(Square.TOP);
        else if (this.game.getMark(Square.BOTTOM_LEFT) == this.game.getPlayer() || this.game.getMark(Square.BOTTOM_RIGHT) == this.game.getPlayer())
          this.move(Square.BOTTOM);
        else
          this.move(Square.TOP_LEFT);
        break;
      }
      case 3: {
        let nextMove = this.wins(this.game.getPlayer());
        if(nextMove !== -1) {
          this.move(nextMove);
          break;
        }
        nextMove = this.sides();
        if(nextMove !== -1) {
          this.move(nextMove);
          break;
        }
        nextMove = this.corner();
        this.move(nextMove);
        break;
      }
      case 4: {
        let nextMove = this.wins(this.game.getPlayer());
        if(nextMove !== -1) {
          this.move(nextMove);
          break;
        }
        nextMove = this.sides();
        if(nextMove !== -1) {
          this.move(nextMove);
          break;
        }
      }
      case 5: case 6: case 7: case 8: {
        let nextMove = this.wins(this.game.getAi());
        if(nextMove !== -1) {
          this.move(nextMove);
          break;
        }
        nextMove = this.wins(this.game.getPlayer());
        if(nextMove !== -1) {
          this.move(nextMove);
          break;
        }
        nextMove = this.corner();
        if(nextMove !== -1) {
          this.move(nextMove);
          break;
        }
        nextMove = this.available();
        if(nextMove !== -1) {
          this.move(nextMove);
          break;
        } else {
          console.error("Error: AI Acted Unexpectedly");
        }
      }
      default: {
         break;
      }
   }
  }

  private available(): number {
    for(let i = 0; i < 8; i++){
      if(this.game.getMark(i) == Mark.EMPTY)
        return i;
    }
    return -1;
  }

  private corner(): number {
    if(this.game.getMark(Square.TOP_LEFT) == Mark.EMPTY) {
      return Square.TOP_LEFT;
    }
    if(this.game.getMark(Square.TOP_RIGHT) == Mark.EMPTY) {
      return Square.TOP_RIGHT;
    }
    if(this.game.getMark(Square.BOTTOM_LEFT) == Mark.EMPTY) {
      return Square.BOTTOM_LEFT;
    }
    if(this.game.getMark(Square.BOTTOM_RIGHT) == Mark.EMPTY) {
      return Square.BOTTOM_RIGHT;
    }
    return -1
  }

  private sides(): number {
    if(this.game.getMark(Square.TOP) == this.game.getPlayer() && this.game.getMark(Square.LEFT) == this.game.getPlayer() && this.game.getMark(Square.TOP_LEFT) == Mark.EMPTY)
      return Square.TOP_LEFT;
    if(this.game.getMark(Square.TOP) == this.game.getPlayer() && this.game.getMark(Square.RIGHT) == this.game.getPlayer() && this.game.getMark(Square.TOP_RIGHT) == Mark.EMPTY)
      return Square.TOP_RIGHT;
    if(this.game.getMark(Square.BOTTOM) == this.game.getPlayer() && this.game.getMark(Square.LEFT) == this.game.getPlayer() && this.game.getMark(Square.BOTTOM_LEFT) == Mark.EMPTY)
      return Square.BOTTOM_LEFT;
    if(this.game.getMark(Square.BOTTOM) == this.game.getPlayer() && this.game.getMark(Square.RIGHT) == this.game.getPlayer() && this.game.getMark(Square.BOTTOM_RIGHT) == Mark.EMPTY)
      return Square.BOTTOM_RIGHT;
    if(this.game.getMark(Square.TOP) == this.game.getPlayer() && this.game.getMark(Square.BOTTOM_LEFT) == this.game.getPlayer() && this.game.getMark(Square.TOP_LEFT) == Mark.EMPTY)
      return Square.TOP_LEFT;
    if(this.game.getMark(Square.TOP) == this.game.getPlayer() && this.game.getMark(Square.BOTTOM_RIGHT) == this.game.getPlayer() && this.game.getMark(Square.TOP_RIGHT) == Mark.EMPTY)
      return Square.TOP_RIGHT;
    if(this.game.getMark(Square.BOTTOM) == this.game.getPlayer() && this.game.getMark(Square.TOP_LEFT) == this.game.getPlayer() && this.game.getMark(Square.BOTTOM_LEFT) == Mark.EMPTY)
      return Square.BOTTOM_LEFT;
    if(this.game.getMark(Square.BOTTOM) == this.game.getPlayer() && this.game.getMark(Square.TOP_RIGHT) == this.game.getPlayer() && this.game.getMark(Square.BOTTOM_RIGHT) == Mark.EMPTY)
      return Square.BOTTOM_RIGHT;
    return -1;
  }

  private wins(character: number) {
    if(this.willWin([0,1,2], character) !== -1)
      return this.willWin([0,1,2], character);
    if(this.willWin([3,4,5], character) !== -1)
      return this.willWin([3,4,5], character);
    if(this.willWin([6,7,8], character) !== -1)
      return this.willWin([6,7,8], character);
    if(this.willWin([0,3,6], character) !== -1)
      return this.willWin([0,3,6], character);
    if(this.willWin([1,4,7], character) !== -1)
      return this.willWin([1,4,7], character);
    if(this.willWin([2,5,8], character) !== -1)
      return this.willWin([2,5,8], character);
    if(this.willWin([0,4,8], character) !== -1)
      return this.willWin([0,4,8], character);
    if(this.willWin([2,4,6], character) !== -1)
      return this.willWin([2,4,6], character);
    return -1;
  }


  private willWin(wins: number[], mark: Mark) {
    let count = 0;
    let isEmpty = false;
    for(let win of wins) {
      if(this.game.getMark(win) == mark)
        count++;
      if(this.game.getMark(win) == Mark.EMPTY)
        isEmpty = true;
    }
    if(count == 2 && isEmpty == true){
      for(let win of wins) {
        if(this.game.getMark(win) == Mark.EMPTY) {
          return win;
        }
      }
    }
    return -1;
  }

  private move(square: number) {
    this.game.move(square, this.game.getAi());
    this.lastMove = square;
  }
}
