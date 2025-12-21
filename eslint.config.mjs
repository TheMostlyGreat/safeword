/**
 * Safeword Monorepo ESLint Configuration
 *
 * Uses eslint-plugin-safeword for all rules + project-specific boundaries.
 */

import eslintConfigPrettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import safeword from './packages/eslint-plugin/dist/index.js';

// Ignores
const ignores = [
  '**/node_modules/',
  '**/dist/',
  '**/build/',
  '**/coverage/',
  'examples/',
  'eslint.config.mjs', // Self - JS file can't use typed rules
];

// Monorepo boundaries configuration
const boundariesConfig = {
  name: 'monorepo-boundaries',
  plugins: { boundaries },
  settings: {
    'boundaries/elements': [
      { type: 'cli', pattern: 'packages/cli/**', mode: 'full' },
      { type: 'plugin', pattern: 'packages/eslint-plugin/**', mode: 'full' },
      { type: 'website', pattern: 'packages/website/**', mode: 'full' },
    ],
  },
  rules: {
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          // CLI can import from CLI and plugin (for eslint-plugin-safeword dep)
          { from: ['cli'], allow: ['cli', 'plugin'] },
          // Plugin is a leaf - can only import from itself
          { from: ['plugin'], allow: ['plugin'] },
          // Website is isolated - no cross-package imports
          { from: ['website'], allow: ['website'] },
        ],
      },
    ],
    'boundaries/no-unknown': 'off',
    'boundaries/no-unknown-files': 'off',
  },
};

// Start with ignores + safeword TypeScript config
const configs = [
  { ignores },
  ...safeword.configs.recommendedTypeScript,
  ...safeword.configs.vitest,
  ...safeword.configs.playwright,
  boundariesConfig,
  eslintConfigPrettier,

  // Config files override - disable strict TS rules for dynamic imports
  {
    name: 'config-files-override',
    files: ['*.config.mjs', '*.config.ts', '.safeword/*.mjs', 'packages/*/tsup.config.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },

  // CLI package overrides - disable false positives for CLI tools
  {
    name: 'cli-package-override',
    files: ['packages/cli/**/*.ts'],
    rules: {
      // Security false positives - CLI tools work with user-provided paths by design
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'off',
      'sonarjs/no-os-command-from-path': 'off',
      'sonarjs/os-command': 'off',
      'sonarjs/different-types-comparison': 'off',
      // JSDoc not required for internal CLI code
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-jsdoc': 'off',
      // CLI works with untyped external data (JSON, YAML, user input)
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },

  // CLI tests overrides (includes co-located unit tests in src/)
  {
    name: 'cli-tests-override',
    files: ['packages/cli/tests/**/*.ts', 'packages/cli/src/**/*.test.ts'],
    rules: {
      'sonarjs/no-unused-vars': 'off',
      'sonarjs/no-dead-store': 'off',
      'sonarjs/unused-import': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'sonarjs/slow-regex': 'off',
      'security/detect-unsafe-regex': 'off',
      'sonarjs/assertions-in-tests': 'off',
      'sonarjs/no-nested-functions': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'sonarjs/publicly-writable-directories': 'off',
      'sonarjs/no-alphabetical-sort': 'off',
      'regexp/no-dupe-disjunctions': 'off',
    },
  },

  // Website package overrides - Astro has virtual modules and special patterns
  {
    name: 'website-package-override',
    files: ['packages/website/**/*.ts', 'packages/website/**/*.tsx', 'packages/website/**/*.astro', 'packages/website/**/*.mjs'],
    rules: {
      // Astro virtual modules (astro:content, @astrojs/starlight/*)
      'import-x/no-unresolved': 'off',
      // Astro uses dynamic patterns that TS-ESLint flags
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },
];

export default configs;
