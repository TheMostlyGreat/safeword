/**
 * Recommended ESLint configuration for React + TypeScript + LLM coding agents
 *
 * Extends the TypeScript config with React-specific rules:
 * - eslint-plugin-react: JSX rules (keys, duplicates, etc.)
 * - eslint-plugin-react-hooks 7.x: Hook rules + React Compiler diagnostics
 * - eslint-plugin-jsx-a11y: Accessibility rules (strict preset)
 *
 * Philosophy: LLMs make React-specific mistakes. These rules catch them.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-condition -- ESLint config types are incompatible across plugin packages */

import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPluginImport from 'eslint-plugin-react-hooks';

// Type assertion - react-hooks 7.x exports configs but types don't declare it
const reactHooksPlugin = reactHooksPluginImport as unknown as {
  configs?: { flat?: { 'recommended-latest'?: any } };
};

import { recommendedTypeScript } from './recommended-typescript.js';

// Runtime validation - ensure react-hooks 7.x with flat config support
const reactHooksConfig = reactHooksPlugin.configs?.flat?.['recommended-latest'];
if (!reactHooksConfig) {
  throw new Error(
    'eslint-plugin-safeword requires eslint-plugin-react-hooks >= 7.0.0 with flat config support. ' +
      'Please upgrade react-hooks: npm install eslint-plugin-react-hooks@latest',
  );
}

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
  // Using recommended-latest which includes void-use-memo
  reactHooksConfig,

  // Accessibility rules - strict preset (all at error level)
  jsxA11y.flatConfigs.strict,

  // Escalate warn rules to error + add LLM-critical rules
  {
    name: 'safeword/react-hooks-rules',
    rules: {
      // Escalate default warns to error (LLMs ignore warnings)
      'react-hooks/exhaustive-deps': 'error', // Default: warn
      'react-hooks/incompatible-library': 'error', // Default: warn
      'react-hooks/unsupported-syntax': 'error', // Default: warn

      // LLM-critical rules NOT in recommended-latest preset
      'react-hooks/memoized-effect-dependencies': 'error', // LLMs create unstable refs as deps
      'react-hooks/no-deriving-state-in-effects': 'error', // LLMs derive state in useEffect
    },
  },

  // React rule overrides for TypeScript projects
  {
    name: 'safeword/react-rules',
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
