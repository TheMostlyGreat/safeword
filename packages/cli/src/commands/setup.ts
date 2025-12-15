/**
 * Setup command - Initialize safeword in a project
 *
 * Uses reconcile() with mode='install' to create all managed files.
 */

import { execSync } from 'node:child_process';
import nodePath from 'node:path';

import { reconcile, type ReconcileResult } from '../reconcile.js';
import { SAFEWORD_SCHEMA } from '../schema.js';
import { createProjectContext } from '../utils/context.js';
import { exists, writeJson } from '../utils/fs.js';
import { isGitRepo } from '../utils/git.js';
import { error, header, info, listItem, success, warn } from '../utils/output.js';
import { VERSION } from '../version.js';
import { buildArchitecture, hasArchitectureDetected, syncConfigCore } from './sync-config.js';

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

function ensurePackageJson(cwd: string): boolean {
  const packageJsonPath = nodePath.join(cwd, 'package.json');
  if (exists(packageJsonPath)) return false;

  const dirName = nodePath.basename(cwd) || 'project';
  const defaultPackageJson: PackageJson = { name: dirName, version: '0.1.0', scripts: {} };
  writeJson(packageJsonPath, defaultPackageJson);
  return true;
}

function installDependencies(cwd: string, packages: string[]): void {
  if (packages.length === 0) return;

  info('\nInstalling linting dependencies...');
  const installCmd = `npm install -D ${packages.join(' ')}`;
  info(`Running: ${installCmd}`);

  try {
    execSync(installCmd, { cwd, stdio: 'inherit' });
    success('Installed linting dependencies');
  } catch {
    warn('Failed to install dependencies. Run manually:');
    listItem(installCmd);
  }
}

function printSetupSummary(
  result: ReconcileResult,
  packageJsonCreated: boolean,
  archFiles: string[] = [],
): void {
  header('Setup Complete');

  const allCreated = [...result.created, ...archFiles];
  if (allCreated.length > 0 || packageJsonCreated) {
    info('\nCreated:');
    if (packageJsonCreated) listItem('package.json');
    for (const file of allCreated) listItem(file);
  }

  if (result.updated.length > 0) {
    info('\nModified:');
    for (const file of result.updated) listItem(file);
  }

  info('\nNext steps:');
  listItem('Run `safeword check` to verify setup');
  listItem('Commit the new files to git');

  success(`\nSafeword ${VERSION} installed successfully!`);
}

export async function setup(options: SetupOptions): Promise<void> {
  const cwd = process.cwd();
  const safewordDirectory = nodePath.join(cwd, '.safeword');

  if (exists(safewordDirectory)) {
    error('Already configured. Run `safeword upgrade` to update.');
    process.exit(1);
  }

  const packageJsonCreated = ensurePackageJson(cwd);

  header('Safeword Setup');
  info(`Version: ${VERSION}`);
  if (packageJsonCreated) info('Created package.json (none found)');

  try {
    info('\nCreating safeword configuration...');
    const ctx = createProjectContext(cwd);
    const result = await reconcile(SAFEWORD_SCHEMA, 'install', ctx);
    success('Created .safeword directory and configuration');

    // Detect architecture and workspaces, generate depcruise configs if found
    const arch = buildArchitecture(cwd);
    const archFiles: string[] = [];

    if (hasArchitectureDetected(arch)) {
      const syncResult = syncConfigCore(cwd, arch);
      if (syncResult.generatedConfig) archFiles.push('.safeword/depcruise-config.js');
      if (syncResult.createdMainConfig) archFiles.push('.dependency-cruiser.js');

      const detected: string[] = [];
      if (arch.elements.length > 0) {
        detected.push(arch.elements.map(element => element.location).join(', '));
      }
      if (arch.workspaces && arch.workspaces.length > 0) {
        detected.push(`workspaces: ${arch.workspaces.join(', ')}`);
      }
      info(`\nArchitecture detected: ${detected.join('; ')}`);
      info('Generated dependency-cruiser config for /audit command');
    }

    installDependencies(cwd, result.packagesToInstall);

    if (!isGitRepo(cwd)) {
      const isNonInteractive = options.yes || !process.stdin.isTTY;
      warn(
        isNonInteractive
          ? 'Skipped Husky setup (no git repository)'
          : 'Skipped Husky setup (no .git directory)',
      );
      if (!isNonInteractive)
        info('Initialize git and run safeword upgrade to enable pre-commit hooks');
    }

    printSetupSummary(result, packageJsonCreated, archFiles);
  } catch (error_) {
    error(`Setup failed: ${error_ instanceof Error ? error_.message : 'Unknown error'}`);
    process.exit(1);
  }
}
