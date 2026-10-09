import { existsSync } from 'node:fs';
import { chromium, defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}/tic-tac-toe/`;

/**
 * CI installs the Chromium build this Playwright version expects. Some
 * sandboxes ship a different, preinstalled build instead and forbid
 * `playwright install`; fall back to it only when the expected one is absent.
 * PW_CHROMIUM_PATH overrides both.
 */
function chromiumExecutable(): string | undefined {
  const override = process.env.PW_CHROMIUM_PATH;
  if (override) return override;
  if (existsSync(chromium.executablePath())) return undefined;
  const preinstalled = '/opt/pw-browsers/chromium';
  return existsSync(preinstalled) ? preinstalled : undefined;
}

const executablePath = chromiumExecutable();

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // Tests run against the production build, served under the same
    // /tic-tac-toe/ base path GitHub Pages uses.
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
