/**
 * The browser side: wires the pure game modules in src/game to the page.
 * Nothing here decides a rule; it renders state, forwards input and saves.
 */
import './style.css';
import oUrl from './assets/o.png';
import xUrl from './assets/x.png';
import { rowCol, type Player } from './game/board';
import {
  type Choice,
  type Session,
  computerOf,
  isHumanTurn,
  isOver,
  play,
  result,
  start,
  status,
} from './game/session';
import {
  type Stats,
  browserStorage,
  gamesPlayed,
  loadSession,
  loadStats,
  recordIfFinished,
  resetStats,
  saveSession,
  saveStats,
} from './game/stats';

const ROUTES = ['play', 'stats', 'about'] as const;
type Route = (typeof ROUTES)[number];
const TITLES: Record<Route, string> = { play: 'Play', stats: 'Statistics', about: 'About' };

const MARK_IMG: Record<Player, string> = { X: xUrl, O: oUrl };

function $<T extends Element = HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

const storage = browserStorage();
let stats: Stats = loadStats(storage);
let session: Session | null = loadSession(storage);
let focusIndex = 4;
let route: Route = 'play';

const boardEl = $('#board');
const messageEl = $('#game-message');
const startEl = $('#start-controls');
const announcer = $('#announcer');

// ---- announcements --------------------------------------------------------

let announceTimer: number | undefined;
/**
 * Writes to the polite live region. Clearing first and setting the text on
 * the next tick makes screen readers repeat a message that is identical to
 * the previous one ("That square is taken." twice in a row).
 */
function announce(text: string): void {
  announcer.textContent = '';
  window.clearTimeout(announceTimer);
  announceTimer = window.setTimeout(() => {
    announcer.textContent = text;
  }, 50);
}

function place(index: number): string {
  const { row, col } = rowCol(index);
  return `row ${row + 1}, column ${col + 1}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function resultText(s: Session): string {
  switch (result(s)) {
    case 'lost':
      return "You lost. I'm so, so sorry.";
    case 'tied':
      return 'You have tied.';
    case 'won':
      return 'You won!';
    default:
      return '';
  }
}

// ---- board ----------------------------------------------------------------

const squares: HTMLButtonElement[] = Array.from({ length: 9 }, (_, i) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'square';
  button.dataset.index = String(i);
  boardEl.append(button);
  return button;
});

function humanHasMoved(s: Session): boolean {
  return s.board.some((c) => c === s.human);
}

function lastComputerMove(s: Session): number | null {
  const last = s.history.at(-1);
  return last !== undefined && s.board[last] === computerOf(s) ? last : null;
}

function renderBoard(): void {
  const s = session;
  const outcome = s ? status(s) : null;
  const winLine: readonly number[] = outcome?.status === 'won' ? outcome.line : [];
  const canPlay = s !== null && isHumanTurn(s);
  const aiMove = s ? lastComputerMove(s) : null;

  squares.forEach((button, i) => {
    const mark = s?.board[i] ?? null;
    button.setAttribute('aria-label', `${capitalize(place(i))}, ${mark ?? 'empty'}`);
    button.setAttribute('aria-disabled', String(!canPlay || mark !== null));
    button.tabIndex = i === focusIndex ? 0 : -1;
    button.classList.toggle('win', winLine.includes(i));
    button.dataset.mark = mark ?? '';

    const img = button.querySelector('img');
    if (!mark) {
      img?.remove();
    } else if (img?.dataset.mark !== mark) {
      const fresh = document.createElement('img');
      fresh.src = MARK_IMG[mark];
      fresh.alt = '';
      fresh.dataset.mark = mark;
      fresh.width = 116;
      fresh.height = 116;
      if (i === aiMove) fresh.classList.add('ai-move');
      button.replaceChildren(fresh);
    }
  });
}

function renderMessage(): void {
  const s = session;
  document.body.dataset.result = s ? (result(s) ?? '') : '';
  if (!s) {
    messageEl.textContent = 'X always goes first! Choose your mark to start.';
  } else if (isOver(s)) {
    messageEl.textContent = resultText(s);
  } else {
    const prefix = humanHasMoved(s) ? '' : 'X always goes first! ';
    messageEl.textContent = `${prefix}You are ${s.human}.`;
  }
  startEl.hidden = s !== null && !isOver(s) && humanHasMoved(s);
}

function renderGame(): void {
  renderBoard();
  renderMessage();
}

function focusSquare(index: number): void {
  focusIndex = index;
  squares.forEach((b, i) => (b.tabIndex = i === index ? 0 : -1));
  squares[index]?.focus();
}

function persistGame(): void {
  saveSession(storage, session);
}

function onSquare(index: number): void {
  focusIndex = index;
  if (!session) {
    announce('Choose X, O or Random to start a game.');
    return;
  }
  if (isOver(session)) {
    announce(`The game is over. ${resultText(session)} Start a new game below.`);
    return;
  }
  if (session.board[index] !== null) {
    announce(`${capitalize(place(index))} is taken.`);
    return;
  }
  const before = session;
  const after = play(before, index, Math.random);
  if (after === before) return;

  const nextStats = recordIfFinished(stats, before, after);
  if (nextStats !== stats) {
    stats = nextStats;
    saveStats(storage, stats);
  }
  session = after;
  persistGame();
  renderGame();

  const parts = [`You played ${after.human} in ${place(index)}.`];
  const reply = lastComputerMove(after);
  if (reply !== null && reply !== index) parts.push(`Computer played ${computerOf(after)} in ${place(reply)}.`);
  parts.push(isOver(after) ? resultText(after) : 'Your turn.');
  announce(parts.join(' '));
}

function onStart(choice: Choice): void {
  session = start(choice, Math.random);
  persistGame();
  const firstFree = session.board[focusIndex] === null ? focusIndex : session.board.indexOf(null);
  focusIndex = firstFree;
  renderGame();
  const parts = [`New game. You are ${session.human}.`];
  const reply = lastComputerMove(session);
  if (reply !== null) parts.push(`Computer played ${computerOf(session)} in ${place(reply)}.`);
  parts.push('Your turn.');
  announce(parts.join(' '));
  focusSquare(focusIndex);
}

boardEl.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('button[data-index]');
  if (button) onSquare(Number(button.dataset.index));
});

boardEl.addEventListener('keydown', (event) => {
  const { row, col } = rowCol(focusIndex);
  let next: number;
  switch (event.key) {
    case 'ArrowUp':
      next = row > 0 ? focusIndex - 3 : focusIndex;
      break;
    case 'ArrowDown':
      next = row < 2 ? focusIndex + 3 : focusIndex;
      break;
    case 'ArrowLeft':
      next = col > 0 ? focusIndex - 1 : focusIndex;
      break;
    case 'ArrowRight':
      next = col < 2 ? focusIndex + 1 : focusIndex;
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = 8;
      break;
    default:
      return;
  }
  event.preventDefault();
  focusSquare(next);
});

// Keep the roving tab stop on whichever square was last focused by any means.
boardEl.addEventListener('focusin', (event) => {
  const index = Number((event.target as HTMLElement).dataset.index);
  if (Number.isInteger(index)) focusIndex = index;
});

startEl.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('button[data-choice]');
  if (button) onStart(button.dataset.choice as Choice);
});

// ---- statistics -----------------------------------------------------------

function renderStats(): void {
  const values: Record<string, number> = { ...stats, played: gamesPlayed(stats) };
  document.querySelectorAll<HTMLElement>('[data-stat]').forEach((cell) => {
    cell.textContent = String(values[cell.dataset.stat ?? ''] ?? 0);
  });
  $('#storage-note').hidden = storage !== null;
}

$('#reset-stats').addEventListener('click', () => {
  stats = resetStats(storage);
  renderStats();
  announce('Statistics reset.');
});

// Another tab finishing a game should show up here too.
window.addEventListener('storage', () => {
  stats = loadStats(storage);
  renderStats();
});

// ---- routing --------------------------------------------------------------

function routeFromHash(): Route | null {
  const name = location.hash.replace(/^#\//, '');
  if (!location.hash.startsWith('#/')) return location.hash ? null : 'play';
  return (ROUTES as readonly string[]).includes(name) ? (name as Route) : 'play';
}

function show(next: Route, moveFocus: boolean): void {
  route = next;
  // The losing backdrop belongs to the game screen only.
  document.body.dataset.route = route;
  document.querySelectorAll<HTMLElement>('[data-view]').forEach((view) => {
    view.hidden = view.dataset.view !== route;
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-route]').forEach((link) => {
    if (link.dataset.route === route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.title = `${TITLES[route]} · Tic-Tac-Toe`;
  if (route === 'stats') renderStats();
  if (moveFocus) $(`#${route}-title`).focus();
}

window.addEventListener('hashchange', () => {
  const next = routeFromHash();
  if (next) show(next, true);
});

// The skip link targets an element id, which must not be mistaken for a route.
$('[data-skip]').addEventListener('click', (event) => {
  event.preventDefault();
  $('#main').focus();
});

renderGame();
show(routeFromHash() ?? 'play', false);
