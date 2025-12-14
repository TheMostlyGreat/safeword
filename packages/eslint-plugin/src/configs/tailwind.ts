/**
 * ESLint configuration for Tailwind CSS projects
 *
 * Applies to JSX/TSX files using Tailwind classes.
 * Includes rules for correctness and style consistency.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages */

import tailwindPlugin from 'eslint-plugin-tailwindcss';

/**
 * Tailwind config
 *
 * Includes:
 * - 6 rules, all at error severity
 *
 * Correctness rules:
 * - no-contradicting-classname: Catches conflicting classes (e.g., text-red-500 text-blue-500)
 * - no-custom-classname: Catches typos and hallucinated class names
 * - no-unnecessary-arbitrary-value: Use standard utilities when they exist
 * - enforces-negative-arbitrary-values: Correct syntax for negative arbitrary values
 *
 * Style rules:
 * - classnames-order: Consistent ordering (responsive, state, etc.)
 * - enforces-shorthand: Use shorthand (e.g., inset-0 instead of top-0 right-0 bottom-0 left-0)
 *
 * Skipped rules:
 * - migration-from-tailwind-2: Only for legacy migrations
 * - no-arbitrary-value: Too restrictive - arbitrary values are often legitimate
 */
export const tailwindConfig: any[] = [
  // Spread flat config (plugin setup and file patterns)
  ...tailwindPlugin.configs['flat/recommended'],

  // Override with stricter rules at error level
  {
    rules: {
      // Correctness - catch LLM mistakes
      'tailwindcss/no-contradicting-classname': 'error',
      'tailwindcss/no-custom-classname': 'error',
      'tailwindcss/no-unnecessary-arbitrary-value': 'error',
      'tailwindcss/enforces-negative-arbitrary-values': 'error',

      // Style consistency
      'tailwindcss/classnames-order': 'error',
      'tailwindcss/enforces-shorthand': 'error',

      // Disabled - not applicable
      'tailwindcss/migration-from-tailwind-2': 'off',
      'tailwindcss/no-arbitrary-value': 'off',
    },
  },
];

export default tailwindConfig;
