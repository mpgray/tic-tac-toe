/**
 * Board model and rules. Pure functions over immutable arrays: no DOM, no
 * storage, no randomness. Everything else in the app is built on these.
 *
 * Squares are indexed row-major:
 *
 *   0 | 1 | 2
 *   --+---+--
 *   3 | 4 | 5
 *   --+---+--
 *   6 | 7 | 8
 */

export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = readonly Cell[];

export const SIZE = 3;
export const CELLS = SIZE * SIZE;

/** Every way to make three in a row: 3 rows, 3 columns, 2 diagonals. */
export const WIN_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export type Outcome =
  | { readonly status: 'playing'; readonly next: Player }
  | { readonly status: 'won'; readonly winner: Player; readonly line: readonly [number, number, number] }
  | { readonly status: 'draw' };

export function emptyBoard(): Board {
  return Array<Cell>(CELLS).fill(null);
}

export function opponent(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

export function isIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < CELLS;
}

/** X always goes first, so whose turn it is follows from the mark counts. */
export function nextPlayer(board: Board): Player {
  let x = 0;
  let o = 0;
  for (const cell of board) {
    if (cell === 'X') x++;
    else if (cell === 'O') o++;
  }
  return x === o ? 'X' : 'O';
}

export function availableMoves(board: Board): number[] {
  const moves: number[] = [];
  board.forEach((cell, i) => {
    if (cell === null) moves.push(i);
  });
  return moves;
}

export function winningLine(board: Board): { winner: Player; line: readonly [number, number, number] } | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const mark = board[a];
    if (mark && mark === board[b] && mark === board[c]) {
      return { winner: mark, line };
    }
  }
  return null;
}

export function winner(board: Board): Player | null {
  return winningLine(board)?.winner ?? null;
}

export function isFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

/** A draw is a full board with no line. A win on the last square is a win. */
export function isDraw(board: Board): boolean {
  return isFull(board) && winningLine(board) === null;
}

export function outcome(board: Board): Outcome {
  const win = winningLine(board);
  if (win) return { status: 'won', winner: win.winner, line: win.line };
  if (isFull(board)) return { status: 'draw' };
  return { status: 'playing', next: nextPlayer(board) };
}

export class IllegalMoveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IllegalMoveError';
  }
}

/**
 * Returns a new board with the next player's mark on `index`. Throws rather
 * than silently ignoring a bad move, so a UI bug cannot corrupt a game.
 */
export function applyMove(board: Board, index: number): Board {
  if (!isIndex(index)) throw new IllegalMoveError(`Square ${index} is off the board`);
  if (outcome(board).status !== 'playing') throw new IllegalMoveError('The game is already over');
  if (board[index] !== null) throw new IllegalMoveError(`Square ${index} is already taken`);
  const next = board.slice();
  next[index] = nextPlayer(board);
  return next;
}

/**
 * True when `value` is a board that could arise in real play: nine cells of
 * X/O/null, X-count equal to or one more than O-count, and at most one
 * player holding a line. Used to reject tampered or stale saved games.
 */
export function isReachableBoard(value: unknown): value is Board {
  if (!Array.isArray(value) || value.length !== CELLS) return false;
  if (!value.every((c) => c === null || c === 'X' || c === 'O')) return false;
  const board = value as Cell[];
  const x = board.filter((c) => c === 'X').length;
  const o = board.filter((c) => c === 'O').length;
  if (x !== o && x !== o + 1) return false;
  const lineOwners = new Set(
    WIN_LINES.filter(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]).map(
      ([a]) => board[a],
    ),
  );
  if (lineOwners.size > 1) return false;
  // The winner must have made the last move.
  if (lineOwners.has('X') && x !== o + 1) return false;
  if (lineOwners.has('O') && x !== o) return false;
  return true;
}

export function rowCol(index: number): { row: number; col: number } {
  return { row: Math.floor(index / SIZE), col: index % SIZE };
}
