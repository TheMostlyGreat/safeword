/**
 * Recommended ESLint configuration for React + TypeScript + LLM coding agents
 *
 * Extends the TypeScript config with React-specific rules:
 * - eslint-plugin-react: JSX rules (keys, duplicates, etc.)
 * - eslint-plugin-react-hooks: Hook rules (rules-of-hooks, exhaustive-deps)
 *
 * Philosophy: LLMs make React-specific mistakes. These rules catch them.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-condition -- ESLint config types are incompatible across plugin packages */

import reactPlugin from 'eslint-plugin-react';
import * as reactHooksPlugin from 'eslint-plugin-react-hooks';

import { recommendedTypeScript } from './recommended-typescript.js';

/**
 * React + TypeScript recommended config
 *
 * Extends TypeScript config with React-specific rules for catching
 * common LLM mistakes: missing keys, hook violations, stale closures.
 */
export const recommendedTypeScriptReact: any[] = [
  // All TypeScript rules (includes base plugins)
  ...recommendedTypeScript,

  // React plugin - JSX rules
  reactPlugin.configs.flat?.recommended,
  reactPlugin.configs.flat?.['jsx-runtime'], // React 17+ (no import React needed)

  // React Hooks plugin
  {
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // Core hooks rules - critical for LLM code
      'react-hooks/rules-of-hooks': 'error', // Hooks only at top level
      'react-hooks/exhaustive-deps': 'error', // All deps in useEffect
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
