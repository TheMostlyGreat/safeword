/**
 * Shared installation utilities
 *
 * Package manager detection and MCP server constants.
 * Operations are handled by reconcile() in src/reconcile.ts.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

/**
 * Detect package manager by lockfile (bun > pnpm > yarn > npm)
 */
export function detectPackageManager(cwd: string): PackageManager {
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) return 'bun';
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

/**
 * Get install command for package manager
 */
export function getInstallCommand(pm: PackageManager, packages: string[]): string {
  const cmds: Record<PackageManager, string> = {
    npm: `npm install -D ${packages.join(' ')}`,
    yarn: `yarn add -D ${packages.join(' ')}`,
    pnpm: `pnpm add -D ${packages.join(' ')}`,
    bun: `bun add -D ${packages.join(' ')}`,
  };
  return cmds[pm];
}

/**
 * MCP servers installed by safeword
 */
export const MCP_SERVERS = {
  context7: {
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp@latest'],
  },
  playwright: {
    command: 'npx',
    args: ['@playwright/mcp@latest'],
  },
} as const;
