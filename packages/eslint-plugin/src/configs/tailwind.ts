/**
 * ESLint configuration for Tailwind CSS projects
 *
 * Uses eslint-plugin-better-tailwindcss for native Tailwind v4 support.
 * All rules enabled at error level (LLMs ignore warnings).
 *
 * Includes 11 rules:
 * - Correctness: no-conflicting-classes, no-unregistered-classes, no-restricted-classes
 * - Stylistic: enforce-consistent-class-order, enforce-shorthand-classes, no-duplicate-classes,
 *   no-deprecated-classes, enforce-consistent-line-wrapping, no-unnecessary-whitespace,
 *   enforce-consistent-variable-syntax, enforce-consistent-important-position
 *
 * @see https://github.com/schoero/eslint-plugin-better-tailwindcss
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages */

import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';

/** File patterns for Tailwind rules - targets files containing Tailwind classes */
export const TAILWIND_FILES = ['**/*.{jsx,tsx,astro,html}'];

export const tailwindConfig: any[] = [
  {
    name: 'safeword/tailwind',
    files: TAILWIND_FILES,
    plugins: {
      'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    rules: {
      // Correctness rules - catch LLM mistakes
      'better-tailwindcss/no-conflicting-classes': 'error',
      'better-tailwindcss/no-unregistered-classes': 'error',
      'better-tailwindcss/no-restricted-classes': 'error', // no-op by default, configurable

      // Stylistic rules - enforce consistency
      'better-tailwindcss/enforce-consistent-class-order': 'error',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'error',
      'better-tailwindcss/enforce-consistent-variable-syntax': 'error',
      'better-tailwindcss/enforce-consistent-important-position': 'error',
      'better-tailwindcss/enforce-shorthand-classes': 'error',
      'better-tailwindcss/no-duplicate-classes': 'error',
      'better-tailwindcss/no-deprecated-classes': 'error',
      'better-tailwindcss/no-unnecessary-whitespace': 'error',
    },
  },
];
