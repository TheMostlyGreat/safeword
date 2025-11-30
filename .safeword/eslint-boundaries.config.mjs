/**
 * Architecture Boundaries Configuration (AUTO-GENERATED)
 *
 * No architecture directories detected yet - add types/, utils/, components/, etc.
 *
 * This enforces import boundaries between architectural layers:
 * - Lower layers (types, utils) cannot import from higher layers (components, features)
 * - Uses 'warn' severity - informative, not blocking
 *
 * Recognized directories (in hierarchy order):
 *   types → utils → lib → hooks/services → components → features/modules → app
 *
 * To customize, override in your eslint.config.mjs:
 *   rules: { 'boundaries/element-types': ['error', { ... }] }
 */

import boundaries from 'eslint-plugin-boundaries';

export default {
  plugins: { boundaries },
  settings: {
    'boundaries/elements': [

    ],
  },
  rules: {
    'boundaries/element-types': ['warn', {
      default: 'disallow',
      rules: [

      ],
    }],
    'boundaries/no-unknown': 'off', // Allow files outside defined elements
    'boundaries/no-unknown-files': 'off', // Allow non-matching files
  },
};
