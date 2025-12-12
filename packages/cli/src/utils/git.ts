/**
 * Git utilities for CLI operations
 */

import nodePath from 'node:path';

import { exists } from './fs.js';

/**
 * Check if directory is a git repository
 * @param cwd
 */
export function isGitRepo(cwd: string): boolean {
  return exists(nodePath.join(cwd, '.git'));
}
