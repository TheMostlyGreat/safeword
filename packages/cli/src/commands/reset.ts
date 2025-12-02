/**
 * Reset command - Remove safeword configuration from project
 *
 * Uses reconcile() with mode='uninstall' or 'uninstall-full' to remove configuration.
 *
 * By default, preserves linting configuration (eslint, prettier, etc.)
 * Use --full to also remove linting config and uninstall npm packages
 */

import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { exists } from '../utils/fs.js';
import { info, success, warn, error, header, listItem } from '../utils/output.js';
import { createProjectContext } from '../utils/context.js';
import { reconcile } from '../reconcile.js';
import { SAFEWORD_SCHEMA } from '../schema.js';

export interface ResetOptions {
  yes?: boolean;
  full?: boolean;
}

export async function reset(options: ResetOptions): Promise<void> {
  const cwd = process.cwd();
  const safewordDir = join(cwd, '.safeword');

  // Check if configured
  if (!exists(safewordDir)) {
    info('Nothing to remove. Project is not configured with safeword.');
    return;
  }

  const fullReset = options.full ?? false;

  header('Safeword Reset');
  if (fullReset) {
    info('Performing full reset (including linting configuration)...');
  } else {
    info('Removing safeword configuration...');
  }

  try {
    // Use reconcile with appropriate mode
    const mode = fullReset ? 'uninstall-full' : 'uninstall';
    const ctx = createProjectContext(cwd);
    const result = await reconcile(SAFEWORD_SCHEMA, mode, ctx);

    // Handle npm uninstall for full reset
    if (fullReset && result.packagesToRemove.length > 0) {
      info('\nUninstalling devDependencies...');

      try {
        const uninstallCmd = `npm uninstall ${result.packagesToRemove.join(' ')}`;
        info(`Running: ${uninstallCmd}`);
        execSync(uninstallCmd, { cwd, stdio: 'inherit' });
        success('Uninstalled safeword devDependencies');
      } catch {
        warn('Failed to uninstall some packages. Run manually:');
        listItem(`npm uninstall ${result.packagesToRemove.join(' ')}`);
      }
    }

    // Print summary
    header('Reset Complete');

    if (result.removed.length > 0) {
      info('\nRemoved:');
      for (const item of result.removed) {
        listItem(item);
      }
    }

    // Note about preserved linting (only shown if not full reset)
    if (!fullReset) {
      info('\nPreserved (use --full to remove):');
      listItem('eslint.config.mjs');
      listItem('.prettierrc');
      listItem('.markdownlint-cli2.jsonc');
      listItem('package.json (scripts, lint-staged config)');
      listItem('devDependencies (eslint, prettier, husky, lint-staged, etc.)');
    }

    success('\nSafeword configuration removed');
  } catch (err) {
    error(`Reset failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    process.exit(1);
  }
}
