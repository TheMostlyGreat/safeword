/**
 * ESLint configuration for Astro projects
 *
 * Applies to .astro files.
 * Includes recommended rules plus LLM-critical security/convention rules.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, import-x/no-named-as-default-member -- ESLint config types are incompatible across plugin packages */

import astroPlugin from 'eslint-plugin-astro';

/**
 * Astro config
 *
 * Includes:
 * - 8 recommended rules (all at error)
 * - 3 LLM-critical rules: no-set-html-directive (XSS), no-unsafe-inline-scripts (CSP), no-exports-from-components
 *
 * Total: 11 rules, all at error severity.
 */
export const astroConfig: any[] = [
  // Spread flat/recommended (5 config objects: plugin setup, file patterns, prettier overrides, rules)
  ...astroPlugin.configs['flat/recommended'],

  // Add LLM-critical rules
  {
    name: 'safeword/astro',
    rules: {
      // XSS prevention - LLMs often use set:html for rendering user content
      'astro/no-set-html-directive': 'error',

      // CSP safety - inline scripts can break Content Security Policy
      'astro/no-unsafe-inline-scripts': 'error',

      // Astro convention - LLMs try to export from .astro components (not allowed)
      'astro/no-exports-from-components': 'error',
    },
  },
];

export default astroConfig;
