/**
 * Dependency-cruiser config generator
 *
 * Generates dependency-cruiser configuration from detected architecture.
 * Used by `safeword sync-config` command and `/audit` slash command.
 */

import nodePath from 'node:path';

import type { DetectedArchitecture } from './boundaries.js';
import { readJson } from './fs.js';

export interface DepCruiseArchitecture extends DetectedArchitecture {
  workspaces?: string[];
}

interface PackageJson {
  workspaces?: string[] | { packages?: string[] };
}

/**
 * Detect workspaces from package.json
 * Supports both array format and object format (yarn workspaces)
 */
export function detectWorkspaces(cwd: string): string[] | undefined {
  const packageJsonPath = nodePath.join(cwd, 'package.json');
  const packageJson = readJson(packageJsonPath) as PackageJson | undefined;

  if (!packageJson?.workspaces) return undefined;

  // Handle both formats: string[] or { packages: string[] }
  const workspaces = Array.isArray(packageJson.workspaces)
    ? packageJson.workspaces
    : packageJson.workspaces.packages;

  return workspaces && workspaces.length > 0 ? workspaces : undefined;
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

  return String.raw`module.exports = {
  forbidden: [
    // ERROR RULES (block on violations)
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },${hasMonorepoRules ? `\n${monorepoRules},` : ''}
    // INFO RULES (reported in /audit, not errors)
    {
      name: 'no-orphans',
      severity: 'info',
      from: { orphan: true, pathNot: ['\\.test\\.', 'index\\.ts$', 'main\\.ts$'] },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: ['node_modules', '.safeword'] },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
  },
};
`;
}

/**
 * Generate .dependency-cruiser.js (main config that imports generated)
 */
export function generateDepCruiseMainConfig(): string {
  return `/**
 * Dependency Cruiser Configuration
 *
 * Imports auto-generated rules from .safeword/depcruise-config.js
 * ADD YOUR CUSTOM RULES BELOW the spread operator.
 */

const generated = require('./.safeword/depcruise-config.js');

module.exports = {
  forbidden: [
    ...generated.forbidden,
    // ADD YOUR CUSTOM RULES BELOW:
    // { name: 'no-legacy', from: { path: 'legacy/' }, to: { path: 'new/' } },
  ],
  options: {
    ...generated.options,
    // Your overrides here
  },
};
`;
}
