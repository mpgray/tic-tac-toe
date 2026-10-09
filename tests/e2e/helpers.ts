import { expect, type Locator, type Page } from '@playwright/test';

export const board = (page: Page): Locator => page.getByRole('group', { name: 'Game board' });

export const square = (page: Page, row: number, col: number): Locator =>
  board(page).getByRole('button', { name: new RegExp(`^Row ${row}, column ${col},`) });

export const message = (page: Page): Locator => page.locator('#game-message');

export const announcer = (page: Page): Locator => page.getByRole('status');

/** Labels of all nine squares, row-major, e.g. "Row 1, column 1, X". */
export async function labels(page: Page): Promise<string[]> {
  return board(page)
    .getByRole('button')
    .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''));
}

export async function marks(page: Page): Promise<string[]> {
  return (await labels(page)).map((l) => l.split(', ').at(-1) ?? '');
}

/**
 * Plays to the end with the mouse, always clicking the first open square.
 * Returns the final message. The computer never loses, so this ends in a
 * loss or a tie.
 */
export async function playToEndByMouse(page: Page): Promise<string> {
  for (let turn = 0; turn < 5; turn++) {
    const open = board(page).locator('button[aria-disabled="false"]');
    if ((await open.count()) === 0) break;
    const before = (await marks(page)).filter((m) => m !== 'empty').length;
    await open.first().click();
    await expect.poll(async () => (await marks(page)).filter((m) => m !== 'empty').length).toBeGreaterThan(before);
  }
  await expect(message(page)).toHaveText(/You lost|You have tied/);
  return (await message(page).textContent()) ?? '';
}

export function statCell(page: Page, name: string): Locator {
  return page.getByRole('row', { name: new RegExp(`^${name} `) }).getByRole('cell');
}
