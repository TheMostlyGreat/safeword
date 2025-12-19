/**
 * ESLint configuration for Tailwind CSS projects
 *
 * Applies to UI files using Tailwind classes: JSX, TSX, Astro, HTML.
 * Includes rules for correctness and style consistency.
 *
 * Note: eslint-plugin-tailwindcss v3.x does not support Tailwind v4.
 * This config gracefully degrades to empty when Tailwind v4 is detected.
 * See: https://github.com/francoismassart/eslint-plugin-tailwindcss/issues/325
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages */

/**
 * File patterns for Tailwind rules.
 * Targets files that contain Tailwind class names.
 */
export const TAILWIND_FILES = ['**/*.{jsx,tsx,astro,html}'];

/**
 * Tailwind config - lazy loaded to handle Tailwind v4 incompatibility.
 *
 * Returns empty array if eslint-plugin-tailwindcss fails to load
 * (e.g., when Tailwind v4 is installed which doesn't export resolveConfig).
 *
 * Includes:
 * - 8 rules configured (6 enabled at error, 2 explicitly disabled)
 *
 * Correctness rules:
 * - no-contradicting-classname: Catches conflicting classes (e.g., text-red-500 text-blue-500)
 * - no-custom-classname: Catches typos and hallucinated class names
 *   (projects with custom utilities should configure tailwindcss.whitelist)
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
function createTailwindConfig(): any[] {
  try {
    // Dynamic require to catch Tailwind v4 incompatibility errors
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tailwindPlugin = require('eslint-plugin-tailwindcss');

    return [
      // Spread flat config (plugin setup and file patterns)
      ...tailwindPlugin.configs['flat/recommended'],

      // Override with stricter rules at error level
      {
        name: 'safeword/tailwind',
        files: TAILWIND_FILES,
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
  } catch {
    // eslint-plugin-tailwindcss doesn't support Tailwind v4 yet
    // Return empty config to gracefully degrade
    return [];
  }
}

export const tailwindConfig: any[] = createTailwindConfig();

export default tailwindConfig;
