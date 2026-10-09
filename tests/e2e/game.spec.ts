import { expect, test } from '@playwright/test';
import {
  announcer,
  board,
  labels,
  marks,
  message,
  playToEndByMouse,
  square,
  statCell,
} from './helpers';

test.describe('opening the game', () => {
  test('shows an empty, labelled board and the start choices', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    await page.goto('./');

    await expect(page).toHaveTitle('Play · Tic-Tac-Toe');
    await expect(page.getByRole('heading', { level: 1, name: 'Tic-Tac-Toe' })).toBeVisible();
    await expect(board(page).getByRole('button')).toHaveCount(9);
    expect(await labels(page)).toEqual([
      'Row 1, column 1, empty', 'Row 1, column 2, empty', 'Row 1, column 3, empty',
      'Row 2, column 1, empty', 'Row 2, column 2, empty', 'Row 2, column 3, empty',
      'Row 3, column 1, empty', 'Row 3, column 2, empty', 'Row 3, column 3, empty',
    ]);
    for (const name of ['Play as X', 'Play as O', 'Play as Random']) {
      await expect(page.getByRole('button', { name })).toBeVisible();
    }
    await expect(message(page)).toHaveText('X always goes first! Choose your mark to start.');
    expect(errors).toEqual([]);
  });

  test('fits a phone screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('./');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const box = await square(page, 3, 3).boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44); // comfortable touch target
  });

  test('navigates between Play, Statistics and About', async ({ page }) => {
    await page.goto('./');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await nav.getByRole('link', { name: 'About' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeFocused();
    await expect(nav.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText('X always goes first.')).toBeVisible();
    await nav.getByRole('link', { name: 'Statistics' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Statistics' })).toBeVisible();
    await expect(board(page)).toBeHidden();
  });
});

test.describe('playing with a mouse', () => {
  test('a click places the mark and the computer replies', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Play as X' }).click();
    await expect(message(page)).toHaveText('X always goes first! You are X.');

    await square(page, 1, 1).click();

    await expect(square(page, 1, 1)).toHaveAccessibleName('Row 1, column 1, X');
    // Against a corner opening the only move that does not lose is the centre.
    await expect(square(page, 2, 2)).toHaveAccessibleName('Row 2, column 2, O');
    expect((await marks(page)).filter((m) => m !== 'empty')).toHaveLength(2);
    await expect(page.getByRole('button', { name: 'Play as X' })).toBeHidden();
  });

  test('clicking a taken square does nothing', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Play as X' }).click();
    await square(page, 1, 1).click();
    const before = await labels(page);
    await square(page, 2, 2).click({ force: true });
    expect(await labels(page)).toEqual(before);
    await expect(announcer(page)).toHaveText('Row 2, column 2 is taken.');
  });

  test('a full game ends in a loss or a tie, never a win', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Play as O' }).click();
    const final = await playToEndByMouse(page);
    expect(final).not.toMatch(/You won/);
    // The start choices come back for the next game.
    await expect(page.getByRole('button', { name: 'Play as Random' })).toBeVisible();
  });
});

test.describe('playing with a keyboard', () => {
  test('arrow keys move, Enter and Space play, and moves are announced', async ({ page }) => {
    await page.goto('./');

    // Tab from the top of the page to the "Play as X" button.
    const playAsX = page.getByRole('button', { name: 'Play as X' });
    for (let i = 0; i < 20 && !(await playAsX.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(playAsX).toBeFocused();
    await page.keyboard.press('Enter');

    // Focus moves to the board, starting in the centre.
    await expect(square(page, 2, 2)).toBeFocused();
    const outline = await square(page, 2, 2).evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none'); // visible focus

    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowLeft');
    await expect(square(page, 1, 1)).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(square(page, 1, 1)).toHaveAccessibleName('Row 1, column 1, X');
    await expect(square(page, 2, 2)).toHaveAccessibleName('Row 2, column 2, O');
    await expect(announcer(page)).toHaveText(
      'You played X in row 1, column 1. Computer played O in row 2, column 2. Your turn.',
    );

    await page.keyboard.press('ArrowRight');
    await expect(square(page, 1, 2)).toBeFocused();
    await page.keyboard.press(' ');

    await expect(square(page, 1, 2)).toHaveAccessibleName('Row 1, column 2, X');
    // The computer must block the top row.
    await expect(square(page, 1, 3)).toHaveAccessibleName('Row 1, column 3, O');
    await expect(announcer(page)).toContainText('Computer played O in row 1, column 3.');
  });

  test('arrow keys stop at the edge of the board', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Play as X' }).click();
    await square(page, 2, 2).focus();
    for (const key of ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowRight']) {
      await page.keyboard.press(key);
    }
    await expect(square(page, 3, 3)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(square(page, 1, 1)).toBeFocused();
    // Only one square is in the tab order at a time.
    await expect(board(page).locator('button[tabindex="0"]')).toHaveCount(1);
  });
});

test.describe('saved progress', () => {
  test('statistics survive a reload, and reset clears them', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Play as X' }).click();
    const final = await playToEndByMouse(page);

    await page.goto('./#/stats');
    await expect(statCell(page, 'Games played')).toHaveText('1');
    await expect(statCell(page, 'X')).toHaveText('1');
    await expect(statCell(page, final.startsWith('You lost') ? 'Lost' : 'Tied')).toHaveText('1');

    await page.reload();
    await expect(statCell(page, 'Games played')).toHaveText('1');
    await expect(statCell(page, 'Won')).toHaveText('0');

    await page.getByRole('button', { name: 'Reset statistics' }).click();
    await expect(statCell(page, 'Games played')).toHaveText('0');
    await expect(announcer(page)).toHaveText('Statistics reset.');
    await page.reload();
    await expect(statCell(page, 'Games played')).toHaveText('0');
  });

  test('an unfinished game resumes after a reload', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Play as X' }).click();
    await square(page, 1, 1).click();
    await expect(square(page, 2, 2)).toHaveAccessibleName('Row 2, column 2, O');
    const before = await labels(page);

    await page.reload();
    expect(await labels(page)).toEqual(before);
    await expect(message(page)).toHaveText('You are X.');
  });

  test('the game still works when the browser blocks storage', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Blocked', 'SecurityError');
        },
      });
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('./');
    await page.getByRole('button', { name: 'Play as O' }).click();
    await playToEndByMouse(page);
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Statistics' }).click();
    await expect(statCell(page, 'Games played')).toHaveText('1');
    await expect(page.getByText('This browser is not letting the site save data')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
