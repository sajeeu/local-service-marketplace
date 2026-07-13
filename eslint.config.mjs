import baseConfig from '@local-service-marketplace/eslint-config/base';

/**
 * Root ESLint flat config for monorepo tooling (lint-staged / husky).
 * ESLint 9 resolves config from CWD, so the root must provide one when
 * hooks run `eslint --fix` from the repository root.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default [
  ...baseConfig,
  {
    ignores: ['scripts/debug-*.mjs', '**/debug-*.log'],
  },
  {
    // Nest DI relies on emitDecoratorMetadata; never type-only injected imports.
    files: ['apps/api/**/*.{ts,js}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
