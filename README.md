# Tic-Tac-Toe

Tic-tac-toe in the browser against a computer that cannot be beaten. Tic-tac-toe
is a solved game, so the computer searches every possible continuation before it
moves; the best you can do is a tie.

**Play it:** <https://mpgray.github.io/tic-tac-toe/>
(live once GitHub Pages is enabled for this repository with the source set to
**GitHub Actions** — see [Deployment](#deployment)).

First built with Angular in December 2020; rebuilt in 2026 as a small,
framework-free TypeScript site whose main point is how thoroughly it is tested.
The Angular version is in the git history.

## Features

- Play as **X**, **O** or **Random**. X always goes first, so as O the computer
  opens.
- An unbeatable computer opponent: minimax with alpha-beta pruning.
- Your unfinished game is saved in the browser and resumes after a reload.
- Personal statistics — won, lost, tied, and games by the mark you chose —
  saved in the browser, with a reset control. If the browser blocks storage the
  game still works and says that statistics will not be kept.
- Accessible: the board is nine real buttons with labels such as
  "Row 1, column 2, X"; arrow keys, Home and End move between squares and Enter
  or Space plays; focus is always visible; moves and results are announced in a
  live region. Works at phone width, follows the system light/dark preference
  and turns off animation for `prefers-reduced-motion`.

## Running it

Requires Node.js 20.19 or later (CI uses the version in `.nvmrc`).

```bash
npm ci
npm run dev        # http://localhost:5173/tic-tac-toe/
npm run build      # production build in dist/
npm run preview    # serve dist/ at http://localhost:4173/tic-tac-toe/
```

## Testing

```bash
npm run typecheck  # tsc, strict mode
npm run lint       # ESLint with typescript-eslint
npm test           # Vitest unit tests
npm run test:e2e   # Playwright browser tests (builds and serves the site)
npm run check      # all of the above, in CI order
```

The first Playwright run on a new machine needs `npx playwright install chromium`.

### What the tests prove

**Unit tests (Vitest, `tests/unit/`)** run against the pure game modules:

- **The computer never loses.** The test plays every game a person could
  possibly play, as X and as O, and at each computer turn branches over *every*
  move the computer considers optimal — not just the one it would pick — so the
  randomised tie-break used in the browser is covered too. That is 16,752
  complete games; the person wins none of them. Guards make sure the walk is
  not vacuous (it must produce computer wins and draws).
- **Alpha-beta is exact.** In all 4,520 reachable positions where the game is
  still open, the pruned search scores every move identically to a plain,
  un-pruned minimax oracle written separately in the test.
- **Rules.** Win detection on each of the 8 lines for both marks, near-misses
  and mixed lines that are not wins, a win on the final square counted as a win
  rather than a draw, draw detection, turn order, and illegal moves rejected.
- **Persistence.** Stats and saved games round-trip; corrupt, tampered or
  impossible saves are rejected (a saved game is replayed from its move history
  and must reproduce its board); and storage that is missing or throws on every
  call never breaks the game.

**Browser tests (Playwright, `tests/e2e/`)** run against the production build
under the same `/tic-tac-toe/` base path GitHub Pages uses, on a desktop and a
phone-sized project:

- the game opens with an empty, labelled board and no console errors;
- the layout fits a 360px-wide screen with no sideways scrolling;
- playing with the mouse, including clicking a taken square;
- playing entirely with the keyboard: Tab to a start button, arrow keys,
  Enter and Space, visible focus, and the announced text;
- a full game ends in a loss or a tie, never a win;
- statistics survive a reload and reset clears them;
- an unfinished game resumes after a reload;
- the game still works when `localStorage` throws.

## Project layout

```
index.html               page shell: header, three views, live region
src/
  main.ts                DOM wiring: rendering, input, routing, saving
  style.css              colour tokens, light/dark, layout, motion
  assets/                X and O artwork, lost-game backdrop, favicon
  game/                  pure logic, no DOM (enforced by ESLint)
    board.ts             board, win lines, draws, move validation
    ai.ts                minimax with alpha-beta pruning
    session.ts           one game: start, play, validate a saved game
    stats.ts             statistics and saved game over injected storage
tests/
  unit/                  Vitest
  e2e/                   Playwright
.github/workflows/
  ci.yml                 typecheck, lint, unit, build, Playwright on push/PR
  pages.yml              build and deploy master to GitHub Pages
```

## Deployment

`.github/workflows/pages.yml` builds the site and deploys it to GitHub Pages on
every push to `master`. Vite's `base` is `/tic-tac-toe/` to match the Pages
URL. One-time setup by the repository owner: **Settings → Pages → Build and
deployment → Source: GitHub Actions**. Until that is set, the deploy job fails
at the "configure pages" step and nothing is published.

## Author

Michael Gray. Released under the [MIT License](LICENSE).
