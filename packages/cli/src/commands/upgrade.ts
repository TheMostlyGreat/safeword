/**
 * Upgrade command - Update safeword configuration to latest version
 *
 * Uses reconcile() with mode='upgrade' to update all managed files.
 */

import { execSync } from 'node:child_process';
import nodePath from 'node:path';

import { reconcile } from '../reconcile.js';
import { SAFEWORD_SCHEMA } from '../schema.js';
import { createProjectContext } from '../utils/context.js';
import { exists, readFileSafe } from '../utils/fs.js';
import { error, header, info, listItem, success, warn } from '../utils/output.js';
import { compareVersions } from '../utils/version.js';
import { VERSION } from '../version.js';
import { sync } from './sync.js';

/**
 * Uninstall deprecated packages that are now bundled in eslint-plugin-safeword.
 * @param packages - List of package names to uninstall
 * @param cwd - Working directory
 */
function uninstallDeprecatedPackages(packages: string[], cwd: string): void {
  if (packages.length === 0) return;

  info(`\nRemoving ${packages.length} deprecated package(s)...`);
  for (const pkg of packages) {
    listItem(pkg);
  }

  try {
    const uninstallCommand = `npm uninstall ${packages.join(' ')}`;
    execSync(uninstallCommand, { cwd, stdio: 'inherit' });
    success('Removed deprecated packages (now bundled in eslint-plugin-safeword)');
  } catch {
    warn('Failed to remove some packages. Run manually:');
    listItem(`npm uninstall ${packages.join(' ')}`);
  }
}

/**
 * Upgrade safeword configuration to the latest version.
 */
export async function upgrade(): Promise<void> {
  const cwd = process.cwd();
  const safewordDirectory = nodePath.join(cwd, '.safeword');

  // Check if configured
  if (!exists(safewordDirectory)) {
    error('Not configured. Run `safeword setup` first.');
    process.exit(1);
  }

  // Read project version
  const versionPath = nodePath.join(safewordDirectory, 'version');
  const projectVersion = readFileSafe(versionPath)?.trim() ?? '0.0.0';

  // Check for downgrade
  if (compareVersions(VERSION, projectVersion) < 0) {
    error(`CLI v${VERSION} is older than project v${projectVersion}.`);
    error('Update the CLI first: npm install -g safeword');
    process.exit(1);
  }

  header('Safeword Upgrade');
  info(`Upgrading from v${projectVersion} to v${VERSION}`);

  try {
    // Use reconcile with mode='upgrade' to update all managed files
    const ctx = createProjectContext(cwd);
    const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);

    // Print summary
    header('Upgrade Complete');

    info(`\nVersion: v${projectVersion} → v${VERSION}`);

    if (result.created.length > 0) {
      info('\nCreated:');
      for (const file of result.created) {
        listItem(file);
      }
    }

    if (result.updated.length > 0) {
      info('\nUpdated:');
      for (const file of result.updated) {
        listItem(file);
      }
    }

    // Auto-sync: install missing ESLint packages
    if (result.packagesToInstall.length > 0) {
      info(`\nSyncing ${result.packagesToInstall.length} package(s)...`);
      await sync();
    }

    // Remove deprecated packages (now bundled in eslint-plugin-safeword)
    uninstallDeprecatedPackages(result.packagesToRemove, cwd);

    success(`\nSafeword upgraded to v${VERSION}`);
  } catch (error_) {
    error(`Upgrade failed: ${error_ instanceof Error ? error_.message : 'Unknown error'}`);
    process.exit(1);
  }
}
