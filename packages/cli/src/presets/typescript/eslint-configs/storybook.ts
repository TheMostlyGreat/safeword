/**
 * ESLint configuration for Storybook stories
 *
 * Uses official flat/recommended as base, then:
 * - Upgrades all warn → error (LLMs ignore warnings)
 * - Adds strict rules not in recommended
 *
 * @see https://github.com/storybookjs/eslint-plugin-storybook
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages */

import storybookPlugin from 'eslint-plugin-storybook';

/**
 * Storybook story linting config
 *
 * Based on flat/recommended with stricter settings for LLM code generation.
 */
export const storybookConfig: any[] = [
  // Use official flat/recommended as base (includes plugin setup + file patterns)
  ...storybookPlugin.configs['flat/recommended'],

  // Override warnings to errors + add strict rules
  {
    name: 'safeword/storybook-strict',
    files: ['**/*.stories.{ts,tsx,js,jsx,mjs,cjs}', '**/*.story.{ts,tsx,js,jsx,mjs,cjs}'],
    rules: {
      // Upgrade warn → error (LLMs ignore warnings)
      'storybook/hierarchy-separator': 'error',
      'storybook/no-redundant-story-name': 'error',
      'storybook/prefer-pascal-case': 'error',

      // Strict rules not in recommended (useful for LLMs)
      'storybook/csf-component': 'error', // component property should be set
      'storybook/no-stories-of': 'error', // storiesOf is deprecated
      'storybook/meta-inline-properties': 'error', // Meta should only have inline properties
    },
  },
];
