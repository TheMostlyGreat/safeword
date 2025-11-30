/**
 * Sync command - Keep linting plugins in sync with project dependencies
 *
 * This command detects frameworks in package.json and ensures the corresponding
 * ESLint plugins are installed. Designed to be called from hooks on each session.
 *
 * Behavior:
 * - Silent when nothing needs to change
 * - Installs missing plugins
 * - Updates eslint.config.mjs if project type changed
 * - Outputs list of changed files for git add
 */

import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { exists, readJson, writeFile } from '../utils/fs.js';
import { detectProjectType, type PackageJson, type ProjectType } from '../utils/project-detector.js';
import { getEslintConfig } from '../templates/index.js';
import { detectArchitecture, generateBoundariesConfig } from '../utils/boundaries.js';

export interface SyncOptions {
  quiet?: boolean;
}

interface SyncResult {
  installedPackages: string[];
  updatedFiles: string[];
}

/**
 * Maps project type flags to their required ESLint plugin packages
 */
function getRequiredPlugins(projectType: ProjectType): string[] {
  const plugins: string[] = [
    // Always required
    'eslint',
    '@eslint/js',
    'eslint-plugin-import-x',
    'eslint-plugin-sonarjs',
    '@microsoft/eslint-plugin-sdl',
    'eslint-config-prettier',
    'eslint-plugin-boundaries',
    'eslint-plugin-playwright',
  ];

  if (projectType.typescript) {
    plugins.push('typescript-eslint');
  }
  if (projectType.react || projectType.nextjs) {
    plugins.push('eslint-plugin-react', 'eslint-plugin-react-hooks', 'eslint-plugin-jsx-a11y');
  }
  if (projectType.nextjs) {
    plugins.push('@next/eslint-plugin-next');
  }
  if (projectType.astro) {
    plugins.push('eslint-plugin-astro');
  }
  if (projectType.vue) {
    plugins.push('eslint-plugin-vue');
  }
  if (projectType.svelte) {
    plugins.push('eslint-plugin-svelte');
  }
  if (projectType.electron) {
    plugins.push('@electron-toolkit/eslint-config');
  }
  if (projectType.vitest) {
    plugins.push('@vitest/eslint-plugin');
  }

  return plugins;
}

/**
 * Get the package name for npm (handles scoped packages)
 */
function getPackageName(pkg: string): string {
  // For scoped packages like @next/eslint-plugin-next, the key in package.json is the full name
  return pkg;
}

/**
 * Check which packages are missing from devDependencies
 */
function getMissingPackages(required: string[], installed: Record<string, string>): string[] {
  return required.filter(pkg => {
    const name = getPackageName(pkg);
    return !(name in installed);
  });
}

/**
 * Compare two ProjectType objects to see if they differ in ways that affect ESLint config
 */
function projectTypeChanged(current: ProjectType, stored: ProjectType | null): boolean {
  if (!stored) return true;

  const relevantKeys: (keyof ProjectType)[] = [
    'typescript',
    'react',
    'nextjs',
    'astro',
    'vue',
    'svelte',
    'electron',
    'vitest',
  ];

  return relevantKeys.some(key => current[key] !== stored[key]);
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

  const result: SyncResult = {
    installedPackages: [],
    updatedFiles: [],
  };

  // Detect current project type
  const projectType = detectProjectType(packageJson);
  const devDeps = packageJson.devDependencies || {};

  // Check for missing plugins
  const requiredPlugins = getRequiredPlugins(projectType);
  const missingPlugins = getMissingPackages(requiredPlugins, devDeps);

  // Install missing plugins
  if (missingPlugins.length > 0) {
    try {
      execSync(`npm install -D ${missingPlugins.join(' ')}`, {
        cwd,
        stdio: options.quiet ? 'ignore' : 'inherit',
      });
      result.installedPackages = missingPlugins;
      result.updatedFiles.push('package.json', 'package-lock.json');
    } catch {
      // Installation failed - continue anyway
    }
  }

  // Check if eslint.config.mjs needs regeneration
  // We store the detected project type to compare on next sync
  const projectTypePath = join(safewordDir, '.project-type.json');
  let storedProjectType: ProjectType | null = null;

  if (exists(projectTypePath)) {
    storedProjectType = readJson<ProjectType>(projectTypePath);
  }

  // Regenerate eslint.config.mjs if project type changed
  if (projectTypeChanged(projectType, storedProjectType)) {
    const eslintConfigPath = join(cwd, 'eslint.config.mjs');
    writeFile(
      eslintConfigPath,
      getEslintConfig({
        ...projectType,
        boundaries: true,
      }),
    );
    result.updatedFiles.push('eslint.config.mjs');

    // Update boundaries config
    const architecture = detectArchitecture(cwd);
    const boundariesConfigPath = join(safewordDir, 'eslint-boundaries.config.mjs');
    writeFile(boundariesConfigPath, generateBoundariesConfig(architecture));

    // Store current project type for next comparison
    writeFile(projectTypePath, JSON.stringify(projectType, null, 2));
  }

  // Output changed files (for git add in hook)
  if (result.updatedFiles.length > 0) {
    // Dedupe the list
    const uniqueFiles = [...new Set(result.updatedFiles)];
    console.log(uniqueFiles.join('\n'));
  }
}
