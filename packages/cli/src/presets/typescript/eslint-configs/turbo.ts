/**
 * ESLint configuration for Turborepo projects
 *
 * Ensures environment variables used in code are declared in turbo.json
 * for proper cache invalidation.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages */

import turboPlugin from 'eslint-plugin-turbo';

/**
 * Turborepo env var validation config
 *
 * Rule at error severity - LLMs ignore warnings.
 * Catches undeclared env vars that would break Turborepo caching.
 */
export const turboConfig: any[] = [
  {
    name: 'safeword/turbo',
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      // Env vars must be declared in turbo.json for cache invalidation
      'turbo/no-undeclared-env-vars': 'error',
    },
  },
];
