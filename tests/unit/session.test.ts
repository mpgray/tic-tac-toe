import { describe, expect, it } from 'vitest';
import { emptyBoard } from '../../src/game/board';
import {
  computerOf,
  isHumanTurn,
  isOver,
  parseSession,
  play,
  result,
  start,
  type Session,
} from '../../src/game/session';

const heads = () => 0.1; // < 0.5: random choice gives the person X
const tails = () => 0.9;

describe('start', () => {
  it('playing X: empty board and the person moves first', () => {
    const s = start('X');
    expect(s.board).toEqual(emptyBoard());
    expect(s.human).toBe('X');
    expect(computerOf(s)).toBe('O');
    expect(isHumanTurn(s)).toBe(true);
  });

  it('playing O: the computer, as X, has already moved', () => {
    const s = start('O');
    expect(s.history).toHaveLength(1);
    expect(s.board.filter((c) => c === 'X')).toHaveLength(1);
    expect(isHumanTurn(s)).toBe(true);
  });

  it('random assigns a mark from the random source and remembers the choice', () => {
    const a = start('random', heads);
    const b = start('random', tails);
    expect([a.human, a.choice]).toEqual(['X', 'random']);
    expect([b.human, b.choice]).toEqual(['O', 'random']);
    expect(b.history).toHaveLength(1);
  });
});

describe('play', () => {
  it('places the mark and the computer replies', () => {
    const s = play(start('X'), 0);
    expect(s.board[0]).toBe('X');
    expect(s.history).toHaveLength(2);
    expect(isHumanTurn(s)).toBe(true);
  });

  it('returns the same object for an occupied square, so the UI can tell nothing happened', () => {
    const s = play(start('X'), 0);
    expect(play(s, 0)).toBe(s);
    expect(play(s, s.history[1]!)).toBe(s);
  });

  it('returns the same object for an off-board square', () => {
    const s = start('X');
    expect(play(s, 9)).toBe(s);
    expect(play(s, -1)).toBe(s);
  });

  it('ignores moves once the game is over', () => {
    let s: Session = start('X');
    // Corners only: the computer wins or draws; either way the game ends.
    for (const m of [0, 2, 6, 8, 1, 3, 5, 7]) s = play(s, m);
    expect(isOver(s)).toBe(true);
    const free = s.board.findIndex((c) => c === null);
    if (free >= 0) expect(play(s, free)).toBe(s);
  });

  it('a person who never blocks loses', () => {
    let s: Session = start('X');
    // Play the lowest free square every time - a terrible strategy.
    while (!isOver(s)) s = play(s, s.board.findIndex((c) => c === null));
    expect(result(s)).toBe('lost');
  });
});

describe('parseSession', () => {
  it('round-trips a real session through JSON', () => {
    const s = play(start('O'), 0);
    expect(parseSession(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it('accepts a finished game', () => {
    let s: Session = start('X');
    while (!isOver(s)) s = play(s, s.board.findIndex((c) => c === null));
    expect(parseSession(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it.each([
    ['null', null],
    ['a string', 'game'],
    ['the 2020 save format', { board: [0, 0, 0, 0, 1, 0, 0, 0, 0], game: true, turn: 1, player: 2, ai: 1 }],
    ['an unknown mark', { board: emptyBoard(), human: 'Z', choice: 'random', history: [] }],
    ['a choice that contradicts the mark', { board: emptyBoard(), human: 'O', choice: 'X', history: [] }],
    ['a history that does not match the board', { board: emptyBoard(), human: 'X', choice: 'X', history: [4] }],
    ['a repeated move in the history', { board: emptyBoard(), human: 'X', choice: 'X', history: [4, 4] }],
    [
      'the computer to move',
      { board: ['X', null, null, null, null, null, null, null, null], human: 'X', choice: 'X', history: [0] },
    ],
  ])('rejects %s', (_name, value) => {
    expect(parseSession(value)).toBeNull();
  });
});
