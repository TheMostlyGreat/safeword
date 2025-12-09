/**
 * Base ESLint plugins shared between JS and TypeScript configs
 *
 * These plugins work without type information and are included in both
 * `recommended` (JS) and `recommendedTypeScript` configs.
 */

import js from '@eslint/js';
import type { Linter } from 'eslint';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import pluginPromise from 'eslint-plugin-promise';
import * as pluginRegexp from 'eslint-plugin-regexp';
import pluginSecurity from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';

/**
 * Base plugins - shared between JS and TS configs
 * Does NOT include JSDoc (different config per language) or Prettier (must be last)
 */
export const basePlugins: Linter.Config[] = [
  // ESLint core recommended
  js.configs.recommended,

  // Import validation
  importX.flatConfigs.recommended,
  {
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
    },
  },

  // Code quality / complexity
  // eslint-disable-next-line import-x/no-named-as-default-member -- sonarjs default export pattern
  sonarjs.configs.recommended,

  // Security - detect common vulnerabilities
  pluginSecurity.configs.recommended,
  {
    rules: {
      // Critical security rules at error (LLMs ignore warnings)
      'security/detect-bidi-characters': 'error', // Trojan Source attacks
      'security/detect-eval-with-expression': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-child-process': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      // High false positive rate (~40%) - warn for human review
      'security/detect-object-injection': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-buffer-noassert': 'warn',
      'security/detect-new-buffer': 'warn',
      'security/detect-pseudoRandomBytes': 'warn',
    },
  },

  // Promise handling - catches floating promises (critical for LLM code)
  pluginPromise.configs['flat/recommended'],
  {
    rules: {
      'promise/no-multiple-resolved': 'error', // Catches missing return after resolve
      // LLMs mix callback/promise paradigms - escalate to error
      'promise/no-callback-in-promise': 'error',
      'promise/no-nesting': 'error',
      'promise/no-promise-in-callback': 'error',
      'promise/no-return-in-finally': 'error',
      'promise/valid-params': 'error',
    },
  },

  // Regexp - catches ReDoS vulnerabilities and malformed regex
  pluginRegexp.configs.recommended,

  // Modern JS enforcement
  unicorn.configs.recommended,
  {
    rules: {
      'unicorn/prevent-abbreviations': 'off', // ctx, dir, pkg, err are standard
      'unicorn/no-null': 'off', // null is valid JS
      'unicorn/no-process-exit': 'off', // CLI apps use process.exit
      'unicorn/import-style': 'off', // Named imports are fine
      'unicorn/numeric-separators-style': 'off', // Style preference
      'unicorn/text-encoding-identifier-case': 'off', // utf-8 vs utf8
      'unicorn/no-negated-condition': 'off', // Sometimes clearer
      'unicorn/no-array-for-each': 'off', // forEach is fine
      'unicorn/prefer-module': 'off', // CJS still valid
      // Escalated to error for LLM code
      'unicorn/switch-case-braces': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/no-array-reduce': 'error', // LLMs write confusing reduce
    },
  },

  // Import sorting - auto-fixable, reduces noise
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import-x/order': 'off', // Disable in favor of simple-import-sort
    },
  },
];

/**
 * Prettier config - must be last to disable conflicting rules
 */

export { default as prettierConfig } from 'eslint-config-prettier';
