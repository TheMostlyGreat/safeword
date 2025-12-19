/**
 * Upgrade command - Update safeword configuration to latest version
 *
 * Uses reconcile() with mode='upgrade' to update all managed files.
 */

import { execSync } from 'node:child_process';
import nodePath from 'node:path';

import { reconcile, type ReconcileResult } from '../reconcile.js';
import { SAFEWORD_SCHEMA } from '../schema.js';
import { createProjectContext } from '../utils/context.js';
import { exists, readFileSafe } from '../utils/fs.js';
import { detectPackageManager, getInstallCommand } from '../utils/install.js';
import { error, header, info, listItem, success, warn } from '../utils/output.js';
import { compareVersions } from '../utils/version.js';
import { VERSION } from '../version.js';

function installDependencies(cwd: string, packages: string[]): void {
  if (packages.length === 0) return;

  const pm = detectPackageManager(cwd);
  const installCmd = getInstallCommand(pm, packages);

  info('\nInstalling missing packages...');
  info(`Running: ${installCmd}`);

  try {
    execSync(installCmd, { cwd, stdio: 'inherit' });
    success('Installed missing packages');
  } catch {
    warn('Failed to install packages. Run manually:');
    listItem(installCmd);
  }
}

function getProjectVersion(safewordDirectory: string): string {
  const versionPath = nodePath.join(safewordDirectory, 'version');
  return readFileSafe(versionPath)?.trim() ?? '0.0.0';
}

function printUpgradeSummary(result: ReconcileResult, projectVersion: string): void {
  header('Upgrade Complete');
  info(`\nVersion: v${projectVersion} → v${VERSION}`);

  if (result.created.length > 0) {
    info('\nCreated:');
    for (const file of result.created) listItem(file);
  }

  if (result.updated.length > 0) {
    info('\nUpdated:');
    for (const file of result.updated) listItem(file);
  }

  if (result.packagesToRemove.length > 0) {
    warn(
      `\n${result.packagesToRemove.length} package(s) are now bundled in eslint-plugin-safeword:`,
    );
    for (const pkg of result.packagesToRemove) listItem(pkg);
    info("\nIf you don't use these elsewhere, you can remove them:");
    listItem(`npm uninstall ${result.packagesToRemove.join(' ')}`);
  }

  success(`\nSafeword upgraded to v${VERSION}`);
}

export async function upgrade(): Promise<void> {
  const cwd = process.cwd();
  const safewordDirectory = nodePath.join(cwd, '.safeword');

  if (!exists(safewordDirectory)) {
    error('Not configured. Run `safeword setup` first.');
    process.exit(1);
  }

  const projectVersion = getProjectVersion(safewordDirectory);

  if (compareVersions(VERSION, projectVersion) < 0) {
    error(`CLI v${VERSION} is older than project v${projectVersion}.`);
    error('Update the CLI first: npm install -g safeword');
    process.exit(1);
  }

  header('Safeword Upgrade');
  info(`Upgrading from v${projectVersion} to v${VERSION}`);

  try {
    const ctx = createProjectContext(cwd);
    const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);
    installDependencies(cwd, result.packagesToInstall);
    printUpgradeSummary(result, projectVersion);
  } catch (error_) {
    error(`Upgrade failed: ${error_ instanceof Error ? error_.message : 'Unknown error'}`);
    process.exit(1);
  }
}
