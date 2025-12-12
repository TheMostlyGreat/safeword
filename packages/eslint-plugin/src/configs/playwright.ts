/**
 * ESLint configuration for Playwright e2e tests
 *
 * Applies to test files: *.test.ts, *.spec.ts, *.e2e.ts
 * Enforces e2e test best practices for LLM-generated tests.
 *
 * All rules escalated to error EXCEPT no-skipped-test (stays warn for TDD).
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages */

import playwrightPlugin from 'eslint-plugin-playwright';

/**
 * Playwright e2e test linting config
 *
 * Based on recommended config with all warns escalated to error.
 * Exception: no-skipped-test stays at warn (legitimate TDD pattern).
 */
export const playwrightConfig: any[] = [
  {
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}', '**/*.e2e.{ts,tsx,js,jsx}'],
    plugins: {
      playwright: playwrightPlugin,
    },
    rules: {
      // From recommended - already at error
      'playwright/missing-playwright-await': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-standalone-expect': 'error',
      'playwright/no-unsafe-references': 'error',
      'playwright/no-unused-locators': 'error',
      'playwright/no-wait-for-navigation': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/valid-describe-callback': 'error',
      'playwright/valid-expect': 'error',
      'playwright/valid-expect-in-promise': 'error',
      'playwright/valid-test-tags': 'error',
      'playwright/valid-title': 'error',

      // Escalated from warn to error (LLMs ignore warnings)
      'playwright/expect-expect': 'error',
      'playwright/max-nested-describe': 'error',
      'playwright/no-conditional-expect': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/no-eval': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-nested-step': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/no-useless-await': 'error',
      'playwright/no-useless-not': 'error',
      'playwright/no-wait-for-selector': 'error',
      'playwright/no-wait-for-timeout': 'error',

      // EXCEPTION: stays at warn (legitimate TDD pattern)
      'playwright/no-skipped-test': 'warn',
    },
  },
];

export default playwrightConfig;
