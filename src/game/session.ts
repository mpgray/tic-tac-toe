/**
 * One game between a person and the computer, as plain data.
 *
 * The UI calls start() and play(); both return a new Session and never touch
 * the DOM or storage, so every rule here is unit-testable.
 */
import { chooseMove } from './ai';
import {
  type Board,
  type Outcome,
  type Player,
  applyMove,
  emptyBoard,
  isReachableBoard,
  nextPlayer,
  opponent,
  outcome,
} from './board';

/** What the person picked on the start buttons. X always moves first. */
export type Choice = 'X' | 'O' | 'random';
export const CHOICES: readonly Choice[] = ['X', 'O', 'random'];

export interface Session {
  readonly board: Board;
  readonly human: Player;
  readonly choice: Choice;
  /** Squares in the order they were played, for announcements and animation. */
  readonly history: readonly number[];
}

export type Random = () => number;

export function computerOf(session: Session): Player {
  return opponent(session.human);
}

export function status(session: Session): Outcome {
  return outcome(session.board);
}

export function isOver(session: Session): boolean {
  return status(session).status !== 'playing';
}

export function isHumanTurn(session: Session): boolean {
  const s = status(session);
  return s.status === 'playing' && s.next === session.human;
}

/** From the person's side: did they win, lose or tie? null while playing. */
export function result(session: Session): 'won' | 'lost' | 'tied' | null {
  const s = status(session);
  if (s.status === 'playing') return null;
  if (s.status === 'draw') return 'tied';
  return s.winner === session.human ? 'won' : 'lost';
}

function computerTurn(session: Session, random?: Random): Session {
  const s = status(session);
  if (s.status !== 'playing' || s.next === session.human) return session;
  const move = chooseMove(session.board, computerOf(session), random);
  return { ...session, board: applyMove(session.board, move), history: [...session.history, move] };
}

/**
 * Starts a game. "random" flips a coin for the person's mark; if the
 * computer ends up as X it moves immediately, because X always goes first.
 */
export function start(choice: Choice, random: Random = Math.random): Session {
  const human: Player = choice === 'random' ? (random() < 0.5 ? 'X' : 'O') : choice;
  const fresh: Session = { board: emptyBoard(), human, choice, history: [] };
  return computerTurn(fresh, random);
}

/**
 * The person plays `index`; the computer replies if the game continues.
 * Returns the same session object when the move is not allowed (occupied
 * square, not their turn, game over), so callers can detect a no-op.
 */
export function play(session: Session, index: number, random?: Random): Session {
  if (!isHumanTurn(session)) return session;
  if (session.board[index] !== null || index < 0 || index >= session.board.length) return session;
  const afterHuman: Session = {
    ...session,
    board: applyMove(session.board, index),
    history: [...session.history, index],
  };
  return computerTurn(afterHuman, random);
}

/**
 * Validates a session read back from storage. Anything malformed,
 * impossible, or out of step with its own history is rejected rather than
 * repaired: losing a saved game is better than resuming a corrupt one.
 */
export function parseSession(value: unknown): Session | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.human !== 'X' && v.human !== 'O') return null;
  if (!CHOICES.includes(v.choice as Choice)) return null;
  if (v.choice !== 'random' && v.choice !== v.human) return null;
  if (!isReachableBoard(v.board)) return null;
  if (!Array.isArray(v.history)) return null;
  const history = v.history as unknown[];
  if (!history.every((m) => Number.isInteger(m))) return null;

  // Replaying the history must reproduce the board exactly.
  let board: Board = emptyBoard();
  try {
    for (const m of history as number[]) board = applyMove(board, m);
  } catch {
    return null;
  }
  if (board.some((c, i) => c !== (v.board as Board)[i])) return null;

  const session: Session = { board, human: v.human, choice: v.choice as Choice, history: history as number[] };
  // A saved game is only ever written on the person's turn or after the end.
  if (!isOver(session) && nextPlayer(board) !== session.human) return null;
  return session;
}
