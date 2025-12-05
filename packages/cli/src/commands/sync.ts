/**
 * Sync command - Keep linting plugins in sync with project dependencies
 *
 * Detects frameworks in package.json and ensures the corresponding ESLint plugins
 * are installed. Designed to be called from Husky pre-commit hook.
 *
 * Behavior:
 * - Fast exit when nothing needs to change
 * - Installs missing plugins
 * - Optionally stages modified files (--stage flag for pre-commit)
 * - Clear error message if installation fails
 */

import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { exists, readJson } from '../utils/fs.js';
import {
  detectProjectType,
  type PackageJson,
  type ProjectType,
} from '../utils/project-detector.js';
import { SAFEWORD_SCHEMA } from '../schema.js';

export interface SyncOptions {
  quiet?: boolean;
  stage?: boolean;
}

/**
 * Base ESLint packages always required for linting.
 * Explicit list for clarity - sync only cares about ESLint plugins.
 *
 * NOTE: This is a subset of SAFEWORD_SCHEMA.packages.base (which includes
 * prettier, markdownlint-cli2, husky, lint-staged, knip). When adding new
 * ESLint packages to schema.ts, also add them here if they should be
 * auto-installed on pre-commit.
 */
const BASE_ESLINT_PACKAGES = [
  'eslint',
  '@eslint/js',
  'eslint-plugin-import-x',
  'eslint-plugin-sonarjs',
  '@microsoft/eslint-plugin-sdl',
  'eslint-config-prettier',
  'eslint-plugin-boundaries',
  'eslint-plugin-playwright',
];

/**
 * Get required ESLint packages based on project type.
 * Uses explicit base list + SAFEWORD_SCHEMA.packages.conditional for frameworks.
 */
function getRequiredPlugins(projectType: ProjectType): string[] {
  const plugins: string[] = [...BASE_ESLINT_PACKAGES];
  const { conditional } = SAFEWORD_SCHEMA.packages;

  // Add conditional packages from schema based on detected project type
  for (const [key, deps] of Object.entries(conditional)) {
    // Special case: react plugins also needed for nextjs
    const isActive =
      key === 'react'
        ? projectType.react || projectType.nextjs
        : projectType[key as keyof ProjectType];

    if (isActive && deps) {
      plugins.push(...deps);
    }
  }

  return plugins;
}

/**
 * Check which packages are missing from devDependencies
 */
function getMissingPackages(required: string[], installed: Record<string, string>): string[] {
  return required.filter(pkg => !(pkg in installed));
}

/**
 * Sync linting configuration with current project dependencies
 */
export async function sync(options: SyncOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const safewordDir = join(cwd, '.safeword');
  const packageJsonPath = join(cwd, 'package.json');

  // Must be in a safeword project
  if (!exists(safewordDir)) {
    if (!options.quiet) {
      console.error('Not a safeword project. Run `safeword setup` first.');
    }
    process.exit(1);
  }

  if (!exists(packageJsonPath)) {
    if (!options.quiet) {
      console.error('No package.json found.');
    }
    process.exit(1);
  }

  const packageJson = readJson<PackageJson>(packageJsonPath);
  if (!packageJson) {
    process.exit(1);
  }

  // Detect current project type
  const projectType = detectProjectType(packageJson);
  const devDeps = packageJson.devDependencies || {};

  // Check for missing plugins
  const requiredPlugins = getRequiredPlugins(projectType);
  const missingPlugins = getMissingPackages(requiredPlugins, devDeps);

  // Fast exit if nothing to install
  if (missingPlugins.length === 0) {
    return;
  }

  // Install missing plugins
  if (!options.quiet) {
    console.log(`Installing missing ESLint plugins: ${missingPlugins.join(', ')}`);
  }

  try {
    // eslint-disable-next-line sonarjs/os-command -- npm install with known package names
    execSync(`npm install -D ${missingPlugins.join(' ')}`, {
      cwd,
      stdio: options.quiet ? 'pipe' : 'inherit',
    });
  } catch {
    // Clear error message for network/install failures
    const pluginList = missingPlugins.join(' ');
    console.error(`\n✗ Failed to install ESLint plugins\n`);
    console.error(`Your project needs: ${pluginList}`);
    console.error(`\nRun manually when online:`);
    console.error(`  npm install -D ${pluginList}\n`);
    process.exit(1);
  }

  // Stage modified files if --stage flag is set (for pre-commit hook)
  if (options.stage) {
    try {
      // eslint-disable-next-line sonarjs/no-os-command-from-path -- git with fixed args
      execSync('git add package.json package-lock.json', {
        cwd,
        stdio: 'pipe',
      });
    } catch {
      // Not in a git repo or git add failed - ignore
    }
  }

  if (!options.quiet) {
    console.log(`✓ Installed ${missingPlugins.length} ESLint plugin(s)`);
  }
}
