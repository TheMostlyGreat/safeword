/**
 * Dependency-cruiser config generator
 *
 * Generates dependency-cruiser configuration from detected architecture.
 * Used by `safeword sync-config` command and `/audit` slash command.
 */

import type { DetectedArchitecture } from './boundaries.js';

interface DepCruiseArchitecture extends DetectedArchitecture {
  workspaces?: string[];
}

/**
 * Generate monorepo hierarchy rules based on workspace patterns
 */
function generateMonorepoRules(workspaces: string[]): string {
  const rules: string[] = [];

  const hasLibs = workspaces.some(w => w.startsWith('libs'));
  const hasPackages = workspaces.some(w => w.startsWith('packages'));
  const hasApps = workspaces.some(w => w.startsWith('apps'));

  // libs cannot import packages or apps
  if (hasLibs && (hasPackages || hasApps)) {
    rules.push(`    {
      name: 'libs-cannot-import-packages-or-apps',
      severity: 'error',
      from: { path: '^libs/' },
      to: { path: '^(packages|apps)/' },
    }`);
  }

  // packages cannot import apps
  if (hasPackages && hasApps) {
    rules.push(`    {
      name: 'packages-cannot-import-apps',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    }`);
  }

  return rules.join(',\n');
}

/**
 * Generate .safeword/depcruise-config.js content (forbidden rules + options)
 */
export function generateDepCruiseConfigFile(arch: DepCruiseArchitecture): string {
  const monorepoRules = arch.workspaces ? generateMonorepoRules(arch.workspaces) : '';
  const hasMonorepoRules = monorepoRules.length > 0;

  return `module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },${hasMonorepoRules ? `\n${monorepoRules},` : ''}
  ],
  options: {},
};
`;
}
