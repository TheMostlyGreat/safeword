/**
 * Recommended ESLint configuration for React + TypeScript + LLM coding agents
 *
 * Extends the TypeScript config with React-specific rules:
 * - eslint-plugin-react: JSX rules (keys, duplicates, etc.)
 * - eslint-plugin-react-hooks 7.x: Hook rules + React Compiler diagnostics
 *
 * Philosophy: LLMs make React-specific mistakes. These rules catch them.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-condition -- ESLint config types are incompatible across plugin packages */

import reactPlugin from 'eslint-plugin-react';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- react-hooks 7.x types don't export configs
const reactHooksPlugin = require('eslint-plugin-react-hooks') as {
  configs: { flat: { recommended: any } };
};

import { recommendedTypeScript } from './recommended-typescript.js';

/**
 * React + TypeScript recommended config
 *
 * Extends TypeScript config with React-specific rules for catching
 * common LLM mistakes: missing keys, hook violations, stale closures.
 *
 * Includes React Compiler rules (v7.x) for detecting purity violations,
 * improper memoization, and other compiler-incompatible patterns.
 */
export const recommendedTypeScriptReact: any[] = [
  // All TypeScript rules (includes base plugins)
  ...recommendedTypeScript,

  // React plugin - JSX rules
  reactPlugin.configs.flat?.recommended,
  reactPlugin.configs.flat?.['jsx-runtime'], // React 17+ (no import React needed)

  // React Hooks + Compiler rules (v7.x flat config)
  reactHooksPlugin.configs.flat.recommended,

  // Escalate warn rules to error + add LLM-critical rules not in recommended
  {
    rules: {
      // Escalate default warns to error (LLMs ignore warnings)
      'react-hooks/exhaustive-deps': 'error', // Default: warn
      'react-hooks/incompatible-library': 'error', // Default: warn
      'react-hooks/unsupported-syntax': 'error', // Default: warn

      // LLM-critical rules NOT in recommended preset
      'react-hooks/void-use-memo': 'error', // LLMs forget to return from useMemo
      'react-hooks/memoized-effect-dependencies': 'error', // LLMs create unstable refs as deps
      'react-hooks/no-deriving-state-in-effects': 'error', // LLMs derive state in useEffect
    },
  },

  // React rule overrides for TypeScript projects
  {
    rules: {
      // Turn off rules that are redundant with TypeScript
      'react/prop-types': 'off', // TS handles prop validation
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+

      // Escalate important rules to error
      'react/jsx-key': 'error', // LLMs forget keys in map()
      'react/jsx-no-duplicate-props': 'error', // Copy-paste bugs
      'react/no-direct-mutation-state': 'error', // Critical React bug
      'react/no-children-prop': 'error', // Anti-pattern
      'react/jsx-no-target-blank': 'error', // Security - has autofix
      'react/no-unknown-property': 'error', // class -> className, has autofix
      'react/no-unescaped-entities': 'error', // XSS prevention
    },
  },
];

export default recommendedTypeScriptReact;
