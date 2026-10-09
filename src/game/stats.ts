/**
 * Personal statistics and saved-game persistence.
 *
 * Storage is passed in, never reached for, so tests can hand in a fake and
 * the UI can hand in `null` when the browser refuses localStorage (private
 * windows, blocked site data, sandboxed iframes). Every read and write is
 * wrapped: a storage failure costs persistence, never the game.
 */
import { type Choice, type Session, parseSession, result } from './session';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Stats {
  won: number;
  lost: number;
  tied: number;
  /** Completed games by the mark the person chose. */
  x: number;
  o: number;
  random: number;
}

export const STATS_KEY = 'tictactoe:v2:stats';
export const GAME_KEY = 'tictactoe:v2:game';

export function emptyStats(): Stats {
  return { won: 0, lost: 0, tied: 0, x: 0, o: 0, random: 0 };
}

export function gamesPlayed(stats: Stats): number {
  return stats.won + stats.lost + stats.tied;
}

const FIELDS = Object.keys(emptyStats()) as (keyof Stats)[];

function isCount(n: unknown): n is number {
  return typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
}

export function parseStats(raw: string | null): Stats {
  if (raw === null) return emptyStats();
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return emptyStats();
    const stats = emptyStats();
    for (const field of FIELDS) {
      const n = (value as Record<string, unknown>)[field];
      if (isCount(n)) stats[field] = n;
    }
    return stats;
  } catch {
    return emptyStats();
  }
}

/** Returns new stats with one finished game counted. */
export function recordResult(stats: Stats, outcome: 'won' | 'lost' | 'tied', choice: Choice): Stats {
  const next = { ...stats };
  next[outcome]++;
  next[choice === 'X' ? 'x' : choice === 'O' ? 'o' : 'random']++;
  return next;
}

function safeGet(storage: StorageLike | null, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: StorageLike | null, key: string, value: string): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(storage: StorageLike | null, key: string): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function loadStats(storage: StorageLike | null): Stats {
  return parseStats(safeGet(storage, STATS_KEY));
}

export function saveStats(storage: StorageLike | null, stats: Stats): boolean {
  return safeSet(storage, STATS_KEY, JSON.stringify(stats));
}

export function resetStats(storage: StorageLike | null): Stats {
  safeRemove(storage, STATS_KEY);
  return emptyStats();
}

export function loadSession(storage: StorageLike | null): Session | null {
  const raw = safeGet(storage, GAME_KEY);
  if (raw === null) return null;
  try {
    return parseSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSession(storage: StorageLike | null, session: Session | null): boolean {
  return session ? safeSet(storage, GAME_KEY, JSON.stringify(session)) : safeRemove(storage, GAME_KEY);
}

/**
 * Counts a game exactly once: call after every move with the session before
 * and after. Only the transition from playing to finished is recorded, so a
 * reload of a finished game never double-counts.
 */
export function recordIfFinished(stats: Stats, before: Session | null, after: Session): Stats {
  const done = result(after);
  if (done === null || (before !== null && result(before) !== null)) return stats;
  return recordResult(stats, done, after.choice);
}

/**
 * localStorage if the browser allows it, otherwise null. Merely reading
 * `window.localStorage` throws in some privacy modes, hence the try.
 */
export function browserStorage(): StorageLike | null {
  try {
    const storage = globalThis.localStorage;
    const probe = '__tictactoe_probe__';
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}
