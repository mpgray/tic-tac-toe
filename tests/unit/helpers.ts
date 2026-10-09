import type { Board, Cell } from '../../src/game/board';

/** Builds a board from a picture: 'X', 'O' or '.' per square, row-major. */
export function b(picture: string): Board {
  const cells = picture.replace(/\s+/g, '').split('');
  if (cells.length !== 9) throw new Error(`Board picture needs 9 squares, got ${cells.length}`);
  return cells.map((c): Cell => (c === 'X' ? 'X' : c === 'O' ? 'O' : null));
}

export function key(board: Board): string {
  return board.map((c) => c ?? '.').join('');
}
