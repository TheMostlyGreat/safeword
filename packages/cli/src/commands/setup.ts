/**
 * Setup command - Initialize safeword in a project
 *
 * Uses reconcile() with mode='install' to create all managed files.
 */

import { execSync } from 'node:child_process';
import nodePath from 'node:path';

import { reconcile } from '../reconcile.js';
import { SAFEWORD_SCHEMA } from '../schema.js';
import { createProjectContext } from '../utils/context.js';
import { exists, writeJson } from '../utils/fs.js';
import { isGitRepo } from '../utils/git.js';
import { error, header, info, listItem, success, warn } from '../utils/output.js';
import { VERSION } from '../version.js';

export interface SetupOptions {
  yes?: boolean;
}

interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  'lint-staged'?: Record<string, string[]>;
}

/**
 * Print file changes summary
 * @param created
 * @param updated
 * @param packageJsonCreated
 */
function printChangesSummary(
  created: string[],
  updated: string[],
  packageJsonCreated: boolean,
): void {
  if (created.length > 0 || packageJsonCreated) {
    info('\nCreated:');
    if (packageJsonCreated) listItem('package.json');
    for (const file of created) listItem(file);
  }

  if (updated.length > 0) {
    info('\nModified:');
    for (const file of updated) listItem(file);
  }
}

/**
 *
 * @param options
 */
export async function setup(options: SetupOptions): Promise<void> {
  const cwd = process.cwd();
  const safewordDirectory = nodePath.join(cwd, '.safeword');

  // Check if already configured
  if (exists(safewordDirectory)) {
    error('Already configured. Run `safeword upgrade` to update.');
    process.exit(1);
  }

  // Check for package.json, create if missing
  const packageJsonPath = nodePath.join(cwd, 'package.json');
  let packageJsonCreated = false;
  if (!exists(packageJsonPath)) {
    const dirName = nodePath.basename(cwd) || 'project';
    const defaultPackageJson: PackageJson = {
      name: dirName,
      version: '0.1.0',
      scripts: {},
    };
    writeJson(packageJsonPath, defaultPackageJson);
    packageJsonCreated = true;
  }

  const isNonInteractive = options.yes || !process.stdin.isTTY;

  header('Safeword Setup');
  info(`Version: ${VERSION}`);

  if (packageJsonCreated) {
    info('Created package.json (none found)');
  }

  try {
    // Use reconcile with mode='install' to create all managed files
    info('\nCreating safeword configuration...');
    const ctx = createProjectContext(cwd);
    const result = await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

    success('Created .safeword directory and configuration');

    // Install npm dependencies
    if (result.packagesToInstall.length > 0) {
      info('\nInstalling linting dependencies...');

      try {
        const installCmd = `npm install -D ${result.packagesToInstall.join(' ')}`;
        info(`Running: ${installCmd}`);

        execSync(installCmd, { cwd, stdio: 'inherit' });
        success('Installed linting dependencies');
      } catch {
        warn('Failed to install dependencies. Run manually:');
        listItem(`npm install -D ${result.packagesToInstall.join(' ')}`);
      }
    }

    // Report Husky status
    if (!isGitRepo(cwd)) {
      if (isNonInteractive) {
        warn('Skipped Husky setup (no git repository)');
      } else {
        warn('Skipped Husky setup (no .git directory)');
        info('Initialize git and run safeword upgrade to enable pre-commit hooks');
      }
    }

    // Print summary
    header('Setup Complete');
    printChangesSummary(result.created, result.updated, packageJsonCreated);

    info('\nNext steps:');
    listItem('Run `safeword check` to verify setup');
    listItem('Commit the new files to git');

    success(`\nSafeword ${VERSION} installed successfully!`);
  } catch (error_) {
    error(`Setup failed: ${error_ instanceof Error ? error_.message : 'Unknown error'}`);
    process.exit(1);
  }
}
