import baseConfig from '@local-service-marketplace/eslint-config/base';
import nextConfig from '@local-service-marketplace/eslint-config/next';

/**
 * Root ESLint flat config for monorepo tooling (lint-staged / husky).
 * ESLint 9 resolves config from CWD, so the root must provide one when
 * hooks run `eslint --fix` from the repository root.
 *
 * Include the Next/React overlay for apps/web so react-hooks rules
 * (and eslint-disable comments for them) resolve during pre-commit.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const webReactOverlay = nextConfig
  .filter((block) => Boolean(block.plugins?.react || block.plugins?.['react-hooks']))
  .map((block) => ({
    ...block,
    files: ['apps/web/**/*.{ts,tsx,js,jsx}'],
  }));

export default [
  ...baseConfig,
  ...webReactOverlay,
  {
    // Nest DI relies on emitDecoratorMetadata; never type-only injected imports.
    files: ['apps/api/**/*.{ts,js}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
