import { describe, expect, it } from 'vitest';
import { bestMoves, chooseMove, scoreMoves } from '../../src/game/ai';
import {
  applyMove,
  availableMoves,
  emptyBoard,
  nextPlayer,
  opponent,
  outcome,
  winningLine,
  isFull,
  type Board,
  type Player,
} from '../../src/game/board';
import { b, key } from './helpers';

/**
 * Reference oracle: plain minimax with no pruning, memoised by position.
 * Same scoring as the AI (10 - depth for a win), so if alpha-beta ever
 * prunes a branch it should not have, the two disagree.
 */
function oracleScores(board: Board, ai: Player): Map<number, number> {
  const memo = new Map<string, number>();
  const value = (pos: Board, depth: number): number => {
    const k = `${key(pos)}|${depth}`;
    const hit = memo.get(k);
    if (hit !== undefined) return hit;
    const win = winningLine(pos);
    let v: number;
    if (win) v = win.winner === ai ? 10 - depth : depth - 10;
    else if (isFull(pos)) v = 0;
    else {
      const children = availableMoves(pos).map((m) => value(applyMove(pos, m), depth + 1));
      v = nextPlayer(pos) === ai ? Math.max(...children) : Math.min(...children);
    }
    memo.set(k, v);
    return v;
  };
  return new Map(availableMoves(board).map((m) => [m, value(applyMove(board, m), 1)]));
}

/** Every position reachable in legal play where the game is not over. */
function reachablePositions(): Board[] {
  const seen = new Map<string, Board>();
  const walk = (board: Board) => {
    if (seen.has(key(board)) || outcome(board).status !== 'playing') return;
    seen.set(key(board), board);
    for (const m of availableMoves(board)) walk(applyMove(board, m));
  };
  walk(emptyBoard());
  return [...seen.values()];
}

/**
 * Plays out every game the person could possibly play against the AI. At
 * each AI turn it branches over EVERY move the AI considers optimal, not just
 * the one it would pick, so the randomised tie-break used in the browser is
 * covered too. Returns tallies of how those games ended.
 */
function exhaustive(human: Player) {
  const ai = opponent(human);
  const tally = { games: 0, humanWins: 0, aiWins: 0, draws: 0 };
  const losses: string[] = [];
  const walk = (board: Board, moves: number[]) => {
    const o = outcome(board);
    if (o.status !== 'playing') {
      tally.games++;
      if (o.status === 'draw') tally.draws++;
      else if (o.winner === ai) tally.aiWins++;
      else {
        tally.humanWins++;
        losses.push(moves.join(','));
      }
      return;
    }
    const options = o.next === human ? availableMoves(board) : bestMoves(board, ai);
    for (const m of options) walk(applyMove(board, m), [...moves, m]);
  };
  walk(emptyBoard(), []);
  return { tally, losses };
}

describe('the AI is unbeatable', () => {
  for (const human of ['X', 'O'] as const) {
    it(`never loses when the person plays ${human}, across every possible game`, () => {
      const { tally, losses } = exhaustive(human);
      expect(losses).toEqual([]);
      expect(tally.humanWins).toBe(0);
      // Guard against a vacuous pass: the walk must really have played games,
      // and the AI must win some (it punishes mistakes) and draw some.
      expect(tally.games).toBeGreaterThan(human === 'X' ? 400 : 100);
      expect(tally.aiWins).toBeGreaterThan(0);
      expect(tally.draws).toBeGreaterThan(0);
    });
  }
});

describe('alpha-beta search', () => {
  it('scores every move exactly as un-pruned minimax does, in every reachable position', () => {
    const positions = reachablePositions();
    // 5,478 legal positions in tic-tac-toe, minus the 958 + 16 finished ones.
    expect(positions.length).toBe(4520);
    for (const board of positions) {
      const ai = nextPlayer(board);
      expect(Object.fromEntries(scoreMoves(board, ai)), key(board)).toEqual(
        Object.fromEntries(oracleScores(board, ai)),
      );
    }
  });

  it('opens in the centre when it plays first', () => {
    expect(chooseMove(emptyBoard(), 'X')).toBe(4);
  });

  it('takes a winning move rather than blocking', () => {
    // O can win at 5; X threatens at 2. Winning beats blocking.
    const board = b(`X X .
                     O O .
                     X . .`);
    expect(chooseMove(board, 'O')).toBe(5);
  });

  it('blocks an immediate threat', () => {
    const board = b(`X X .
                     . O .
                     . . .`);
    expect(bestMoves(board, 'O')).toEqual([2]);
  });

  it('defends the opposite-corner trap with an edge, not a corner', () => {
    // The classic trap the 2020 AI special-cased in sideBlock().
    const board = b(`X . .
                     . O .
                     . . X`);
    const moves = bestMoves(board, 'O');
    expect(moves.length).toBeGreaterThan(0);
    for (const m of moves) expect([1, 3, 5, 7]).toContain(m);
  });

  it('prefers the quickest win', () => {
    // X can win now at 2, or set up a slower win; it must take the win now.
    const board = b(`X X .
                     O O .
                     . . .`);
    expect(bestMoves(board, 'X')).toEqual([2]);
  });

  it('picks among equally good moves with the supplied random source', () => {
    const board = b(`X . .
                     . . .
                     . . .`);
    const options = bestMoves(board, 'O');
    expect(options).toEqual([4]); // only the centre draws against a corner opening
    const corners = bestMoves(emptyBoard(), 'X');
    expect(corners.length).toBeGreaterThan(1);
    expect(chooseMove(emptyBoard(), 'X', () => 0)).toBe(corners[0]);
    expect(chooseMove(emptyBoard(), 'X', () => 0.999999)).toBe(corners[corners.length - 1]);
  });

  it('has no move to make on a finished board', () => {
    expect(bestMoves(b('XXXOO....'), 'O')).toEqual([]);
    expect(() => chooseMove(b('XXXOO....'), 'O')).toThrow();
  });
});
