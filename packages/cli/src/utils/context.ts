/**
 * Project Context Utilities
 *
 * Shared helpers for creating ProjectContext objects used by reconcile().
 */

import nodePath from 'node:path';

import type { ProjectContext } from '../schema.js';
import { readJson } from './fs.js';
import { isGitRepo } from './git.js';
import { detectProjectType, type PackageJson } from './project-detector.js';

/**
 * Create a ProjectContext from the current working directory.
 *
 * Reads package.json and detects project type for use with reconcile().
 * @param cwd
 */
export function createProjectContext(cwd: string): ProjectContext {
  const packageJson = readJson<PackageJson>(nodePath.join(cwd, 'package.json'));

  return {
    cwd,
    projectType: detectProjectType(packageJson ?? {}, cwd),
    developmentDeps: packageJson?.devDependencies ?? {},
    isGitRepo: isGitRepo(cwd),
  };
}
