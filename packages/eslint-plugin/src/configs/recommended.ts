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

import type { Linter } from 'eslint';
import pluginJsdoc from 'eslint-plugin-jsdoc';

import { basePlugins, prettierConfig } from './base.js';

/**
 * JavaScript recommended config - core plugins without TypeScript
 */
export const recommended: Linter.Config[] = [
  // All base plugins (security, promise, unicorn, etc.)
  ...basePlugins,

  // JSDoc - JavaScript flavor (no TS-specific rules)
  pluginJsdoc.configs['flat/recommended'],

  // Prettier must be last to disable conflicting rules
  prettierConfig,
];

export default recommended;
