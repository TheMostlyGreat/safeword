/**
 * Git utilities for CLI operations
 */

import { join } from 'node:path';
import { exists } from './fs.js';

/**
 * Check if directory is a git repository
 */
export function isGitRepo(cwd: string): boolean {
  return exists(join(cwd, '.git'));
}
