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

import { importX } from "eslint-plugin-import-x";
import { configs as tseslintConfigs } from "typescript-eslint";

import { basePlugins, prettierConfig } from "./base.js";

/**
 * File patterns for TypeScript files.
 * Used for parser options and type-checked rules.
 */
const TS_FILES = ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"];

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
    name: "safeword/typescript-parser-options",
    files: TS_FILES,
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },

  // Disable type-checked rules for non-TS files (no type info available)
  // Includes JS files and .astro files (which use astro-eslint-parser)
  {
    ...tseslintConfigs.disableTypeChecked,
    name: "safeword/disable-type-checked-for-non-ts",
    files: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.jsx", "**/*.astro"],
  },

  // No JSDoc for TypeScript - types > docs
  // TypeScript signatures provide better documentation than JSDoc

  // TypeScript-specific rule overrides for LLM code
  // Only applies to TS files (JS files don't have type info for these rules)
  {
    name: "safeword/typescript-rules",
    files: TS_FILES,
    rules: {
      // Allow interface vs type - both are valid
      "@typescript-eslint/consistent-type-definitions": "off",

      // LLMs use `any` when stuck - force them to use `unknown` instead
      "@typescript-eslint/no-explicit-any": "error",

      // LLMs use truthy checks when they should be explicit
      // This catches bugs like `if (count)` when count could be 0
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
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

      // Design rules not in strict+stylistic (high LLM value)
      "@typescript-eslint/consistent-type-imports": "error", // import type { X } for types
      "@typescript-eslint/switch-exhaustiveness-check": "error", // Missing case in union switch
      "@typescript-eslint/no-shadow": "error", // Variable shadows outer scope
      "@typescript-eslint/require-array-sort-compare": "error", // [].sort() needs compareFn
      "@typescript-eslint/no-unused-private-class-members": "error", // Catch dead code in classes
    },
  },

  // Prettier must be last to disable conflicting rules
  prettierConfig,

  // Re-enable curly after prettier (prettier turns it off but we want braces for LLM code)
  {
    name: "safeword/post-prettier",
    rules: {
      curly: "error", // Force braces on if/else/for/while - LLMs write unsafe single-line blocks
    },
  },
];
