/**
 * The computer player: minimax with alpha-beta pruning.
 *
 * Tic-tac-toe is a solved game, so searching the whole tree is cheap and
 * playing the best move every time makes the computer unbeatable. Scores are
 * depth-adjusted so the AI prefers the quickest win and the slowest loss
 * (the latter only matters if it is ever handed a lost position).
 */
import { type Board, type Player, availableMoves, applyMove, nextPlayer, winningLine, isFull, outcome } from './board';

const WIN = 10;

/**
 * Search order: centre, corners, edges. Good moves first makes alpha-beta
 * prune more, and it is also the deterministic tie-break between equally
 * good moves - the original 2020 AI also opened in the middle.
 */
export const PREFERENCE: readonly number[] = [4, 0, 2, 6, 8, 1, 3, 5, 7];

function ordered(board: Board): number[] {
  const open = new Set(availableMoves(board));
  return PREFERENCE.filter((i) => open.has(i));
}

/**
 * Value of `board` from `ai`'s point of view, whoever is about to move.
 * Positive: ai wins. Negative: ai loses. Zero: draw with best play.
 */
function search(board: Board, ai: Player, depth: number, alpha: number, beta: number): number {
  const win = winningLine(board);
  if (win) return win.winner === ai ? WIN - depth : depth - WIN;
  if (isFull(board)) return 0;

  const maximizing = nextPlayer(board) === ai;
  let best = maximizing ? -Infinity : Infinity;
  for (const move of ordered(board)) {
    const value = search(applyMove(board, move), ai, depth + 1, alpha, beta);
    if (maximizing) {
      best = Math.max(best, value);
      alpha = Math.max(alpha, value);
    } else {
      best = Math.min(best, value);
      beta = Math.min(beta, value);
    }
    if (alpha >= beta) break;
  }
  return best;
}

/** Exact minimax value of every legal move for the player to move. */
export function scoreMoves(board: Board, ai: Player): Map<number, number> {
  const scores = new Map<number, number>();
  if (outcome(board).status !== 'playing') return scores;
  for (const move of ordered(board)) {
    // A full window per root move keeps each score exact (not just a bound),
    // which is what lets bestMoves() return every optimal move.
    scores.set(move, search(applyMove(board, move), ai, 1, -Infinity, Infinity));
  }
  return scores;
}

/** All moves tied for the best score, in preference order. */
export function bestMoves(board: Board, ai: Player): number[] {
  const scores = scoreMoves(board, ai);
  if (scores.size === 0) return [];
  const top = Math.max(...scores.values());
  return [...scores].filter(([, s]) => s === top).map(([m]) => m);
}

/**
 * The move the computer plays. Without `random` it is fully deterministic;
 * with one it picks uniformly among the equally best moves so games vary
 * without ever giving anything away.
 */
export function chooseMove(board: Board, ai: Player, random?: () => number): number {
  const moves = bestMoves(board, ai);
  const pick = random ? Math.min(moves.length - 1, Math.floor(random() * moves.length)) : 0;
  const move = moves[pick];
  if (move === undefined) throw new Error('No legal moves');
  return move;
}
