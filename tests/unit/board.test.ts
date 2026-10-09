import { describe, expect, it } from 'vitest';
import {
  WIN_LINES,
  IllegalMoveError,
  applyMove,
  availableMoves,
  emptyBoard,
  isDraw,
  isReachableBoard,
  nextPlayer,
  outcome,
  rowCol,
  winner,
  winningLine,
  type Board,
  type Player,
} from '../../src/game/board';
import { b } from './helpers';

function withLine(line: readonly number[], player: Player): Board {
  const board = emptyBoard().slice();
  for (const i of line) board[i] = player;
  return board;
}

describe('WIN_LINES', () => {
  it('lists exactly the 3 rows, 3 columns and 2 diagonals, each once', () => {
    // If a line were missing, that kind of win would silently never end a game.
    const asKeys = WIN_LINES.map((l) => [...l].sort((x, y) => x - y).join(','));
    expect(new Set(asKeys).size).toBe(8);
    expect(asKeys.sort()).toEqual(
      ['0,1,2', '3,4,5', '6,7,8', '0,3,6', '1,4,7', '2,5,8', '0,4,8', '2,4,6'].sort(),
    );
  });
});

describe('win detection', () => {
  for (const line of WIN_LINES) {
    for (const player of ['X', 'O'] as const) {
      it(`detects ${player} on line ${line.join('-')}`, () => {
        const board = withLine(line, player);
        expect(winner(board)).toBe(player);
        expect(winningLine(board)?.line).toEqual(line);
        expect(outcome(board)).toMatchObject({ status: 'won', winner: player });
      });
    }

    it(`does not count two of a kind on ${line.join('-')} as a win`, () => {
      const board = withLine(line.slice(0, 2), 'X');
      expect(winner(board)).toBeNull();
    });

    it(`does not count a mixed line ${line.join('-')} as a win`, () => {
      const board = withLine(line, 'X').slice();
      board[line[1]!] = 'O';
      expect(winner(board)).toBeNull();
    });
  }

  it('finds no winner on an empty board', () => {
    expect(winner(emptyBoard())).toBeNull();
    expect(outcome(emptyBoard())).toEqual({ status: 'playing', next: 'X' });
  });

  it('reports a win completed on the final square as a win, not a draw', () => {
    const board = b(`X O X
                     O X O
                     O X X`);
    expect(isDraw(board)).toBe(false);
    expect(outcome(board)).toMatchObject({ status: 'won', winner: 'X', line: [0, 4, 8] });
  });
});

describe('draw detection', () => {
  it('is a draw when the board is full with no line', () => {
    const board = b(`X O X
                     X O O
                     O X X`);
    expect(isDraw(board)).toBe(true);
    expect(outcome(board)).toEqual({ status: 'draw' });
  });

  it('is not a draw while any square is empty, even if no win is possible', () => {
    const board = b(`X O X
                     X O O
                     O X .`);
    expect(isDraw(board)).toBe(false);
    expect(outcome(board).status).toBe('playing');
  });
});

describe('turns and moves', () => {
  it('X always goes first and turns alternate', () => {
    let board = emptyBoard();
    const seen: Player[] = [];
    for (const move of [4, 0, 8, 2, 1]) {
      seen.push(nextPlayer(board));
      board = applyMove(board, move);
    }
    expect(seen).toEqual(['X', 'O', 'X', 'O', 'X']);
  });

  it('does not mutate the board it is given', () => {
    const board = emptyBoard();
    applyMove(board, 4);
    expect(board.every((c) => c === null)).toBe(true);
  });

  it('rejects an occupied square, an off-board square and a move after the game ends', () => {
    expect(() => applyMove(b('X........'), 0)).toThrow(IllegalMoveError);
    expect(() => applyMove(emptyBoard(), 9)).toThrow(IllegalMoveError);
    expect(() => applyMove(emptyBoard(), -1)).toThrow(IllegalMoveError);
    expect(() => applyMove(emptyBoard(), 1.5)).toThrow(IllegalMoveError);
    expect(() => applyMove(b('XXXOO....'), 8)).toThrow(/over/);
  });

  it('lists available moves in board order', () => {
    expect(availableMoves(b('X.O.X.O..'))).toEqual([1, 3, 5, 7, 8]);
  });

  it('maps indices to rows and columns', () => {
    expect(rowCol(0)).toEqual({ row: 0, col: 0 });
    expect(rowCol(5)).toEqual({ row: 1, col: 2 });
    expect(rowCol(7)).toEqual({ row: 2, col: 1 });
  });
});

describe('isReachableBoard', () => {
  it.each([
    ['empty board', emptyBoard()],
    ['mid game', b('XO.X.....')],
    ['X just won', b('XXXOO....')],
    ['O just won', b('OOOXX.X..')],
  ])('accepts %s', (_name, board) => {
    expect(isReachableBoard(board)).toBe(true);
  });

  it.each([
    ['not an array', 'XXXOO....'],
    ['wrong length', [null, null]],
    ['unknown mark', ['Z', null, null, null, null, null, null, null, null]],
    ['O moved first', b('O........')],
    ['X moved twice in a row', b('XX.......')],
    ['both players hold a line', b('XXXOOO...')],
    ['O won but X moved after', b('OOOXX.XX.')],
    ['X won but O moved after', b('XXXOO.O..')],
  ])('rejects %s', (_name, value) => {
    expect(isReachableBoard(value)).toBe(false);
  });
});
