import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'playwright-report', 'test-results', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // The game logic must stay DOM-free so it can be unit tested without a
    // browser. This turns that design rule into a lint failure.
    files: ['src/game/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', 'document', 'window', 'navigator', 'location'],
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      // Tests index into fixtures they just built; a wrong guess fails loudly.
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);
