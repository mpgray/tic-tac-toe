import { describe, expect, it } from 'vitest';
import { isOver, play, start, type Session } from '../../src/game/session';
import {
  GAME_KEY,
  STATS_KEY,
  emptyStats,
  gamesPlayed,
  loadSession,
  loadStats,
  parseStats,
  recordIfFinished,
  recordResult,
  resetStats,
  saveSession,
  saveStats,
  type StorageLike,
} from '../../src/game/stats';

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

/** Behaves like localStorage in a locked-down browser: every call throws. */
const hostile: StorageLike = {
  getItem: () => {
    throw new DOMException('denied', 'SecurityError');
  },
  setItem: () => {
    throw new DOMException('quota', 'QuotaExceededError');
  },
  removeItem: () => {
    throw new DOMException('denied', 'SecurityError');
  },
};

function finishedGame(): Session {
  let s: Session = start('X');
  while (!isOver(s)) s = play(s, s.board.findIndex((c) => c === null));
  return s;
}

describe('stats', () => {
  it('records a result and the mark chosen', () => {
    let s = emptyStats();
    s = recordResult(s, 'lost', 'X');
    s = recordResult(s, 'tied', 'random');
    s = recordResult(s, 'tied', 'O');
    expect(s).toEqual({ won: 0, lost: 1, tied: 2, x: 1, o: 1, random: 1 });
    expect(gamesPlayed(s)).toBe(3);
  });

  it('does not mutate the stats it is given', () => {
    const s = emptyStats();
    recordResult(s, 'won', 'X');
    expect(s).toEqual(emptyStats());
  });

  it('persists and reloads through storage', () => {
    const storage = new MemoryStorage();
    const s = recordResult(emptyStats(), 'lost', 'O');
    expect(saveStats(storage, s)).toBe(true);
    expect(loadStats(storage)).toEqual(s);
  });

  it('reset clears storage', () => {
    const storage = new MemoryStorage();
    saveStats(storage, recordResult(emptyStats(), 'lost', 'O'));
    expect(resetStats(storage)).toEqual(emptyStats());
    expect(storage.data.has(STATS_KEY)).toBe(false);
    expect(loadStats(storage)).toEqual(emptyStats());
  });

  it.each([
    ['nothing stored', null],
    ['invalid JSON', '{nope'],
    ['a number', '42'],
    ['negative and fractional counts', '{"won":-1,"lost":1.5,"tied":"3"}'],
  ])('falls back to zeros for %s', (_name, raw) => {
    expect(parseStats(raw)).toEqual(emptyStats());
  });

  it('keeps valid fields from a partially valid record', () => {
    expect(parseStats('{"lost":4,"tied":"x","o":2}')).toEqual({ ...emptyStats(), lost: 4, o: 2 });
  });
});

describe('recordIfFinished', () => {
  it('counts the move that ends the game exactly once', () => {
    const done = finishedGame();
    const before: Session = { ...done, board: done.board.map(() => null), history: [] };
    const once = recordIfFinished(emptyStats(), before, done);
    expect(gamesPlayed(once)).toBe(1);
    // Re-saving or re-rendering the same finished game must not count again.
    expect(recordIfFinished(once, done, done)).toBe(once);
  });

  it('does not count a game still in progress', () => {
    const s = play(start('X'), 4);
    expect(recordIfFinished(emptyStats(), start('X'), s)).toEqual(emptyStats());
  });
});

describe('saved game', () => {
  it('round-trips and can be cleared', () => {
    const storage = new MemoryStorage();
    const s = play(start('X'), 4);
    saveSession(storage, s);
    expect(loadSession(storage)).toEqual(s);
    saveSession(storage, null);
    expect(storage.data.has(GAME_KEY)).toBe(false);
    expect(loadSession(storage)).toBeNull();
  });

  it('discards a corrupt save instead of crashing', () => {
    const storage = new MemoryStorage();
    storage.setItem(GAME_KEY, '{"board":');
    expect(loadSession(storage)).toBeNull();
  });
});

describe('when storage is unavailable', () => {
  it.each([
    ['null storage', null],
    ['storage that throws on every call', hostile],
  ])('%s: nothing throws and the game still works', (_name, storage) => {
    expect(loadStats(storage)).toEqual(emptyStats());
    expect(saveStats(storage, emptyStats())).toBe(false);
    expect(resetStats(storage)).toEqual(emptyStats());
    expect(loadSession(storage)).toBeNull();
    expect(saveSession(storage, start('X'))).toBe(false);
    expect(saveSession(storage, null)).toBe(false);
  });
});
