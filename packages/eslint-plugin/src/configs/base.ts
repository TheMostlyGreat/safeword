/**
 * Base ESLint plugins shared between JS and TypeScript configs
 *
 * These plugins work without type information and are included in both
 * `recommended` (JS) and `recommendedTypeScript` configs.
 */

import js from '@eslint/js';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import pluginPromise from 'eslint-plugin-promise';
import { configs as regexpConfigs } from 'eslint-plugin-regexp';
import pluginSecurity from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { configs as sonarConfigs } from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';

import { rules as safewordRules } from '../rules/index.js';

/**
 * File patterns for base JS/TS rules
 * Excludes .astro, .vue, .svelte which use different parsers
 */
export const JS_TS_FILES = ['**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}'];

/**
 * Add files restriction to config objects.
 * Handles both single config objects and arrays of configs.
 * Skips config objects that only have ignores (global ignores).
 * Skips config objects that already have files set.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages
function scopeConfigToFiles(config: any, files: string[]): any {
  // Skip global ignores (config with only ignores property)
  if (config.ignores && Object.keys(config).length === 1) {
    return config;
  }
  // Skip configs that already have files set
  if (config.files) {
    return config;
  }
  // Add files restriction
  return { ...config, files };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages
function scopeToFiles(configs: any[], files: string[]): any[] {
  return configs.flatMap(config => {
    // Handle arrays (third-party configs may be arrays)
    if (Array.isArray(config)) {
      return config.map(c => scopeConfigToFiles(c, files));
    }
    return scopeConfigToFiles(config, files);
  });
}

/**
 * Base plugins - shared between JS and TS configs
 * Does NOT include JSDoc (different config per language) or Prettier (must be last)
 *
 * Note: Uses any[] because ESLint plugin types are incompatible across packages.
 * Runtime validation by ESLint ensures correctness.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages
const basePluginsUnscoped: any[] = [
  // Default ignores - always skip these directories
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
  },

  // ESLint core recommended
  js.configs.recommended,

  // Code style and design rules - catches common LLM patterns
  {
    name: 'safeword/code-style',
    rules: {
      'no-unneeded-ternary': 'error', // x ? true : false → x
      'prefer-template': 'error', // 'a' + b → `a${b}`
      'dot-notation': 'error', // obj["prop"] → obj.prop
      'object-shorthand': 'error', // { foo: foo } → { foo }
      'no-extra-boolean-cast': 'error', // !!value → Boolean(value) or value
      'prefer-object-spread': 'error', // Object.assign({}, x) → { ...x }
      'logical-assignment-operators': 'error', // x = x ?? y → x ??= y
      'operator-assignment': 'error', // x = x + 1 → x += 1
      curly: 'error', // Require braces around if/else/for/while
      'arrow-body-style': ['error', 'as-needed'], // () => { return x } → () => x
      'prefer-arrow-callback': ['error', { allowNamedFunctions: true }], // function() {} → () => {}
      // Design constraints - forces LLMs to decompose code
      'max-depth': ['error', 4], // Forces early returns, avoids deep nesting
      'max-params': ['error', 5], // Forces object params or decomposition
      complexity: ['error', 10], // Cyclomatic complexity - LLMs write dense, complex code
      'max-nested-callbacks': ['error', 3], // Prevents callback hell in async code
      eqeqeq: ['error', 'always', { null: 'ignore' }], // === required, except x == null
    },
  },

  // Import validation
  importX.flatConfigs.recommended,
  {
    name: 'safeword/import-rules',
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
    },
    rules: {
      'import-x/no-duplicates': 'error', // LLMs create duplicate imports
      'import-x/no-cycle': 'error', // Circular dependencies A → B → A
      'import-x/no-self-import': 'error', // File imports itself (copy-paste bug)
      // Turn off rules with high false-positive rate (binary: error or off)
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
    },
  },

  // Code quality / complexity
  sonarConfigs.recommended,
  {
    name: 'safeword/sonarjs-rules',
    rules: {
      // Enable design rules (off by default but valuable for clean code)
      'sonarjs/no-collapsible-if': 'error', // if(a) { if(b) } → if(a && b)
      'sonarjs/no-nested-switch': 'error', // Switch inside switch is a smell
      'sonarjs/prefer-immediate-return': 'error', // const x = y; return x → return y
      'sonarjs/no-inconsistent-returns': 'error', // Some paths return, some don't
    },
  },

  // Security - detect common vulnerabilities
  pluginSecurity.configs.recommended,
  {
    name: 'safeword/security-rules',
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
      // Escalate all to error (LLMs ignore warnings)
      'security/detect-object-injection': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-pseudoRandomBytes': 'error',
    },
  },

  // Promise handling - catches floating promises (critical for LLM code)
  pluginPromise.configs['flat/recommended'],
  {
    name: 'safeword/promise-rules',
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
  regexpConfigs['flat/recommended'],
  {
    name: 'safeword/regexp-rules',
    rules: {
      // Escalate warn rules to error (LLMs ignore warnings)
      'regexp/confusing-quantifier': 'error',
      'regexp/no-empty-alternative': 'error',
      'regexp/no-lazy-ends': 'error',
      'regexp/no-potentially-useless-backreference': 'error',
      'regexp/no-useless-flag': 'error',
      'regexp/optimal-lookaround-quantifier': 'error',
    },
  },

  // Modern JS enforcement - strict for agents
  unicorn.configs.recommended,
  {
    name: 'safeword/unicorn-rules',
    rules: {
      // Keep off - legitimate use cases
      'unicorn/no-process-exit': 'off', // CLI apps use process.exit
      'unicorn/prefer-module': 'off', // CJS still valid in Node.js ecosystem
      // Escalated to error for LLM code
      'unicorn/switch-case-braces': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/no-array-reduce': 'error', // LLMs write confusing reduce
      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: {
            ctx: true, // context
            req: true, // request
            res: true, // response
            err: true, // error
            dir: true, // directory
            pkg: true, // package
            env: true, // environment
            args: true, // arguments
            params: true, // parameters
            props: true, // properties
            ref: true, // reference
            src: true, // source
            dest: true, // destination
            db: true, // database
            fn: true, // function
            cb: true, // callback
            acc: true, // accumulator
            prev: true, // previous
            curr: true, // current
            i: true, // index
            j: true, // index
            k: true, // index
          },
        },
      ],
      'unicorn/no-null': 'error', // Use undefined
      'unicorn/no-array-for-each': 'error', // Use for...of
      'unicorn/no-negated-condition': 'error', // Clearer conditionals
    },
  },

  // Import sorting - auto-fixable, reduces noise
  {
    name: 'safeword/import-sort',
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import-x/order': 'off', // Disable in favor of simple-import-sort
    },
  },

  // Safeword custom rules - LLM-specific patterns
  {
    name: 'safeword/custom-rules',
    plugins: { safeword: { rules: safewordRules } },
    rules: {
      'safeword/no-incomplete-error-handling': 'error',
    },
  },
];

/**
 * Base plugins scoped to JS/TS files only.
 * Prevents rules from running on .astro, .vue, .svelte files which use different parsers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages
export const basePlugins: any[] = scopeToFiles(basePluginsUnscoped, JS_TS_FILES);

/**
 * Prettier config - must be last to disable conflicting rules
 */

export { default as prettierConfig } from 'eslint-config-prettier';
