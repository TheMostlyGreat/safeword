/**
 * ESLint configuration for Vitest tests
 *
 * Applies to test files: *.test.ts, *.spec.ts
 * Enforces test best practices for LLM-generated tests.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages */

import vitestPlugin from 'eslint-plugin-vitest';

/**
 * Vitest test linting config
 *
 * Includes recommended rules plus no-focused-tests.
 * All rules at error severity.
 */
export const vitestConfig: any[] = [
  {
    name: 'safeword/vitest',
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}'],
    plugins: {
      vitest: vitestPlugin,
    },
    rules: {
      // Recommended rules (all at error)
      'vitest/expect-expect': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/no-commented-out-tests': 'error',
      'vitest/valid-title': 'error',
      'vitest/valid-expect': ['error', { maxArgs: 2 }], // Allow custom message: expect(value, 'message')
      'vitest/valid-describe-callback': 'error',
      'vitest/require-local-test-context-for-concurrent-snapshots': 'error',
      'vitest/no-import-node-test': 'error',

      // Additional strict rules
      'vitest/no-focused-tests': 'error', // No .only() in CI
    },
  },
];

export default vitestConfig;
