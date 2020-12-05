export enum Square {
  TOP_LEFT = 0,
  TOP = 1,
  TOP_RIGHT = 2,
  LEFT = 3,
  MIDDLE = 4,
  RIGHT = 5,
  BOTTOM_LEFT = 6,
  BOTTOM = 7,
  BOTTOM_RIGHT = 8
}
export enum Mark {
  EMPTY = 0,
  X = 1,
  O = 2,
  RANDOM = 3
}

export class TicTacToe {

   private board: Mark[] = [Mark.EMPTY, Mark.EMPTY, Mark.EMPTY,
                                Mark.EMPTY, Mark.EMPTY, Mark.EMPTY,
                                Mark.EMPTY, Mark.EMPTY, Mark.EMPTY];
   private player: Mark = Mark.EMPTY;
   private ai: Mark = Mark.EMPTY;

   isGame: boolean = false;
   turn = 0;

  constructor() {
  }

  private clearBoard() {
     this.board = this.board.map( x => {
        x = Mark.EMPTY;
        return x;
     });
  }

  private clearMarks() {
    this.ai = Mark.EMPTY;
    this.player = Mark.EMPTY;
  }

  public reset() {
    this.clearBoard();
    this.clearMarks();
    this.turn = 0;
  }

  public getTurn(): number {
    return this.turn;
  }

  public getPlayer(): Mark {
    return this.player;
  }

  public getAi(): Mark {
    return this.ai;
  }

  public getBoard(): Mark[] {
    return this.board;
  }

  public getMark(square: Square): Mark {
    return this.board[square];
  }

  public getIsGame(): boolean {
    return this.isGame;
  }

  public free (square: Square): boolean {
    if(this.board[square] == Mark.EMPTY) {
      return true;
    }
    return false;
  }

  public start(mark: Mark) {
    this.reset();
    if(!this.isGame) {
      this.isGame = true;
      if(mark == Mark.RANDOM) {
        mark = Math.floor(Math.random() * (2)) + 1;
      }
      this.player = mark;
      if(this.player == Mark.X)
        this.ai = Mark.O;
      else {
        this.ai = Mark.X;
      }
    }
  }

  public end() {
    this.isGame = false;
  }

  public move(square: Square, mark: Mark = this.player): boolean {
    if(this.isGame && this.board[square] == Mark.EMPTY) {
        this.board[square] = mark;
        this.turn++;
        return true;
    }
    return false;
  }

  public toString(): string {
    let msg = ""
    if(this.turn == 0 || this.turn == 1) {
      msg = "X always goes first!";
    } else {
      msg = "Turn: " + this.getTurn();
    }
    msg += " You are ";

    if(this.player == Mark.O) {
      msg += "O"
    } else if (this.player == Mark.X) {
      msg += "X"
    }
    return msg;
  }
}
