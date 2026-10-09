import { defineConfig } from 'vitest/config';

// Served from https://mpgray.github.io/tic-tac-toe/ on GitHub Pages, so every
// built URL needs the repository name as its prefix. `npm run dev` and the
// Playwright preview server use the same base, so tests exercise real paths.
export default defineConfig({
  base: '/tic-tac-toe/',
  build: {
    target: 'es2022',
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
