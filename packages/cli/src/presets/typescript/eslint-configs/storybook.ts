/**
 * ESLint configuration for Storybook stories
 *
 * Applies to story files: *.stories.ts, *.stories.tsx, *.story.ts
 * Enforces CSF (Component Story Format) best practices for LLM-generated stories.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages */

import storybookPlugin from 'eslint-plugin-storybook';

/**
 * Storybook story linting config
 *
 * All rules at error severity - LLMs ignore warnings.
 * Rules help ensure correct CSF syntax and best practices.
 */
export const storybookConfig: any[] = [
  {
    name: 'safeword/storybook',
    files: ['**/*.stories.{ts,tsx,js,jsx}', '**/*.story.{ts,tsx,js,jsx}'],
    plugins: {
      storybook: storybookPlugin,
    },
    rules: {
      // CSF format rules (all at error)
      'storybook/default-exports': 'error', // Story files must have default export
      'storybook/story-exports': 'error', // Must have at least one story export
      'storybook/csf-component': 'error', // component property should be set
      'storybook/no-stories-of': 'error', // storiesOf is deprecated

      // Interaction testing rules
      'storybook/await-interactions': 'error', // LLMs often forget to await
      'storybook/context-in-play-function': 'error', // Pass context to play functions
      'storybook/use-storybook-expect': 'error', // Use @storybook/test expect
      'storybook/use-storybook-testing-library': 'error', // Use @storybook/testing-library

      // Code quality rules
      'storybook/hierarchy-separator': 'error', // No deprecated separators in title
      'storybook/no-redundant-story-name': 'error', // Remove redundant name property
      'storybook/prefer-pascal-case': 'error', // Stories should use PascalCase
      'storybook/no-uninstalled-addons': 'error', // Catch typos in addon names

      // Strict rules (not in recommended but useful for LLMs)
      'storybook/meta-inline-properties': 'error', // Meta should only have inline properties
    },
  },
];
