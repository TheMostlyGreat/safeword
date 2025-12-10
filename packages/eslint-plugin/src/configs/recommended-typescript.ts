/**
 * Recommended ESLint configuration for TypeScript + LLM coding agents
 *
 * Extends the base recommended config with typescript-eslint's
 * strictTypeChecked + stylisticTypeChecked presets.
 *
 * Type-checked rules are critical for LLM code - they catch:
 * - Floating promises (forgot await)
 * - Misused promises (passing promise where value expected)
 * - Unsafe any usage
 * - Incorrect async/await patterns
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment -- ESLint config types are incompatible across plugin packages */

import { importX } from 'eslint-plugin-import-x';
import pluginJsdoc from 'eslint-plugin-jsdoc';
import { configs as tseslintConfigs } from 'typescript-eslint';

import { basePlugins, prettierConfig } from './base.js';

/**
 * TypeScript recommended config - all base plugins + typescript-eslint strict
 *
 * Requires: tsconfig.json in project root (or configured via languageOptions)
 *
 * Note: Uses any[] because ESLint plugin types are incompatible across packages.
 * Runtime validation by ESLint ensures correctness.
 */

export const recommendedTypeScript: any[] = [
  // All base plugins (security, promise, unicorn, etc.)
  ...basePlugins,

  // TypeScript-specific import config
  importX.flatConfigs.typescript,

  // typescript-eslint strict + stylistic (type-checked)
  ...tseslintConfigs.strictTypeChecked,
  ...tseslintConfigs.stylisticTypeChecked,

  // Enable projectService for type-checked rules (modern approach, auto-discovers tsconfig)
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },

  // JSDoc for TypeScript
  pluginJsdoc.configs['flat/recommended-typescript'],

  // TypeScript-specific rule overrides for LLM code
  {
    rules: {
      // Allow interface vs type - both are valid
      '@typescript-eslint/consistent-type-definitions': 'off',

      // LLMs use `any` when stuck - force them to use `unknown` instead
      '@typescript-eslint/no-explicit-any': 'error',

      // LLMs use truthy checks when they should be explicit
      // This catches bugs like `if (count)` when count could be 0
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: true, // Allow string checks (common pattern)
          allowNumber: false, // Disallow number checks (0 is falsy bug)
          allowNullableObject: true,
          allowNullableBoolean: true,
          allowNullableString: true,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],
    },
  },

  // Prettier must be last to disable conflicting rules
  prettierConfig,
];

export default recommendedTypeScript;
