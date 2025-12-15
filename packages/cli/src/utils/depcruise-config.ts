/**
 * Dependency-cruiser config generator
 *
 * Generates dependency-cruiser configuration from detected architecture.
 * Used by `safeword sync-config` command and `/audit` slash command.
 */

import type { DetectedArchitecture } from './boundaries.js';

/**
 * Generate .safeword/depcruise-config.js content (forbidden rules + options)
 */
export function generateDepCruiseConfigFile(arch: DetectedArchitecture): string {
  return `module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {},
};
`;
}
