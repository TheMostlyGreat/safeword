/**
 * Recommended ESLint configuration for JavaScript + LLM coding agents
 *
 * This preset bundles and configures multiple ESLint plugins with
 * severity levels optimized for catching common LLM-generated code issues.
 *
 * Philosophy: LLMs ignore warnings, so rules that catch real bugs are at "error".
 *
 * For TypeScript projects, use `recommendedTypeScript` instead.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment -- ESLint config types are incompatible across plugin packages */

import pluginJsdoc from 'eslint-plugin-jsdoc';

import { basePlugins, prettierConfig } from './base.js';

/**
 * JavaScript recommended config - core plugins without TypeScript
 *
 * Note: Uses any[] because ESLint plugin types are incompatible across packages.
 * Runtime validation by ESLint ensures correctness.
 */

export const recommended: any[] = [
  // All base plugins (security, promise, unicorn, etc.)
  ...basePlugins,

  // JSDoc - JavaScript flavor (no TS-specific rules)
  pluginJsdoc.configs['flat/recommended'],
  {
    rules: {
      // Don't require JSDoc types - modern JS uses inference or TypeScript
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns-type': 'off',
      'jsdoc/require-property-type': 'off',
    },
  },

  // Prettier must be last to disable conflicting rules
  prettierConfig,
];

export default recommended;
