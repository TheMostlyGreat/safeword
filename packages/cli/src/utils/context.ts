/**
 * Project Context Utilities
 *
 * Shared helpers for creating ProjectContext objects used by reconcile().
 */

import { join } from 'node:path';
import { readJson } from './fs.js';
import { isGitRepo } from './git.js';
import { detectProjectType, type PackageJson } from './project-detector.js';
import type { ProjectContext } from '../schema.js';

/**
 * Create a ProjectContext from the current working directory.
 *
 * Reads package.json and detects project type for use with reconcile().
 */
export function createProjectContext(cwd: string): ProjectContext {
  const packageJson = readJson<PackageJson>(join(cwd, 'package.json'));

  return {
    cwd,
    projectType: detectProjectType(packageJson ?? {}),
    devDeps: packageJson?.devDependencies ?? {},
    isGitRepo: isGitRepo(cwd),
  };
}
