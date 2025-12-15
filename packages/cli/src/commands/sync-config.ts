/**
 * Sync Config command - Regenerate depcruise config from current project structure
 *
 * Used by `/audit` slash command to refresh config before running checks.
 */

import nodePath from 'node:path';

import { exists } from '../utils/fs.js';
import { error } from '../utils/output.js';

/**
 * Sync depcruise config with current project structure
 */
export async function syncConfig(): Promise<void> {
  const cwd = process.cwd();
  const safewordDirectory = nodePath.join(cwd, '.safeword');

  // Check if .safeword exists
  if (!exists(safewordDirectory)) {
    error('Not configured. Run `safeword setup` first.');
    process.exit(1);
  }
}
