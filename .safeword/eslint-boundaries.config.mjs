/**
 * Architecture Boundaries Configuration (AUTO-GENERATED)
 *
 * Detected: packages/cli/src/utils, packages/cli/src/commands (monorepo)
 *
 * This enforces import boundaries between architectural layers:
 * - Lower layers (types, utils) cannot import from higher layers (components, features)
 * - Uses 'error' severity - LLMs ignore warnings, errors force compliance
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
      { type: 'utils', pattern: 'packages/cli/src/utils/**', mode: 'full' },
      { type: 'app', pattern: 'packages/cli/src/commands/**', mode: 'full' },
    ],
  },
  rules: {
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [{ from: ['app'], allow: ['utils'] }],
      },
    ],
    'boundaries/no-unknown': 'off', // Allow files outside defined elements
    'boundaries/no-unknown-files': 'off', // Allow non-matching files
  },
};
