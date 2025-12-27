/**
 * Upgrade command - Update safeword configuration to latest version
 *
 * Uses reconcile() with mode='upgrade' to update all managed files.
 */

import nodePath from 'node:path';

import { installPack } from '../packs/install.js';
import { getMissingPacks } from '../packs/registry.js';
import { reconcile, type ReconcileResult } from '../reconcile.js';
import { SAFEWORD_SCHEMA } from '../schema.js';
import { createProjectContext } from '../utils/context.js';
import { exists, readFileSafe } from '../utils/fs.js';
import { detectPackageManager, installDependencies } from '../utils/install.js';
import { error, header, info, listItem, success, warn } from '../utils/output.js';
import { compareVersions } from '../utils/version.js';
import { VERSION } from '../version.js';

function getProjectVersion(safewordDirectory: string): string {
  const versionPath = nodePath.join(safewordDirectory, 'version');
  return readFileSafe(versionPath)?.trim() ?? '0.0.0';
}

function printUpgradeSummary(result: ReconcileResult, projectVersion: string, cwd: string): void {
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
    const pm = detectPackageManager(cwd);
    const uninstallCmd = pm === 'yarn' ? 'yarn remove' : `${pm} uninstall`;
    warn(
      `\n${result.packagesToRemove.length} package(s) are now bundled in eslint-plugin-safeword:`,
    );
    for (const pkg of result.packagesToRemove) listItem(pkg);
    info("\nIf you don't use these elsewhere, you can remove them:");
    listItem(`${uninstallCmd} ${result.packagesToRemove.join(' ')}`);
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
    const pm = detectPackageManager(cwd);
    error(`CLI v${VERSION} is older than project v${projectVersion}.`);
    error(`Update the CLI first: ${pm} install -g safeword`);
    process.exit(1);
  }

  header('Safeword Upgrade');
  info(`Upgrading from v${projectVersion} to v${VERSION}`);

  try {
    const ctx = createProjectContext(cwd);
    const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);
    installDependencies(cwd, result.packagesToInstall, 'missing packages');

    // Install missing language packs
    for (const packId of getMissingPacks(cwd)) {
      installPack(packId, cwd);
      info(`Installed ${packId} pack`);
    }

    printUpgradeSummary(result, projectVersion, cwd);
  } catch (error_) {
    error(`Upgrade failed: ${error_ instanceof Error ? error_.message : 'Unknown error'}`);
    process.exit(1);
  }
}
