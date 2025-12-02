/**
 * Diff command - Preview changes that would be made by upgrade
 *
 * Uses reconcile() with dryRun to compute what would change.
 */

import { join } from 'node:path';
import { VERSION } from '../version.js';
import { exists, readFileSafe } from '../utils/fs.js';
import { info, success, error, header, listItem } from '../utils/output.js';
import { createProjectContext } from '../utils/context.js';
import { reconcile, type Action } from '../reconcile.js';
import { SAFEWORD_SCHEMA } from '../schema.js';

export interface DiffOptions {
  verbose?: boolean;
}

interface FileDiff {
  path: string;
  status: 'added' | 'modified' | 'unchanged';
  currentContent?: string;
  newContent?: string;
}

/**
 * Create a unified diff between two strings
 */
function createUnifiedDiff(oldContent: string, newContent: string, filename: string): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const lines: string[] = [];
  lines.push(`--- a/${filename}`);
  lines.push(`+++ b/${filename}`);

  // Simple diff - show all changes
  let hasChanges = false;

  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === newLine) {
      lines.push(` ${oldLine ?? ''}`);
    } else {
      hasChanges = true;
      if (oldLine !== undefined) {
        lines.push(`-${oldLine}`);
      }
      if (newLine !== undefined) {
        lines.push(`+${newLine}`);
      }
    }
  }

  if (!hasChanges) {
    return '';
  }

  // Add context marker
  lines.splice(2, 0, `@@ -1,${oldLines.length} +1,${newLines.length} @@`);

  return lines.join('\n');
}

/**
 * Convert reconcile actions to file diffs
 */
function actionsToDiffs(actions: Action[], cwd: string): FileDiff[] {
  const diffs: FileDiff[] = [];
  const seenPaths = new Set<string>();

  for (const action of actions) {
    if (action.type === 'write') {
      if (seenPaths.has(action.path)) continue;
      seenPaths.add(action.path);

      const fullPath = join(cwd, action.path);
      const currentContent = readFileSafe(fullPath);

      if (currentContent === null) {
        diffs.push({
          path: action.path,
          status: 'added',
          newContent: action.content,
        });
      } else if (currentContent.trim() !== action.content.trim()) {
        diffs.push({
          path: action.path,
          status: 'modified',
          currentContent,
          newContent: action.content,
        });
      } else {
        diffs.push({
          path: action.path,
          status: 'unchanged',
          currentContent,
          newContent: action.content,
        });
      }
    }
  }

  return diffs;
}

export async function diff(options: DiffOptions): Promise<void> {
  const cwd = process.cwd();
  const safewordDir = join(cwd, '.safeword');

  // Check if configured
  if (!exists(safewordDir)) {
    error('Not configured. Run `safeword setup` first.');
    process.exit(1);
  }

  // Read project version
  const versionPath = join(safewordDir, 'version');
  const projectVersion = readFileSafe(versionPath)?.trim() ?? 'unknown';

  header('Safeword Diff');
  info(`Changes from v${projectVersion} → v${VERSION}`);

  // Use reconcile with dryRun to compute changes
  const ctx = createProjectContext(cwd);
  const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx, { dryRun: true });

  // Convert actions to file diffs
  const diffs = actionsToDiffs(result.actions, cwd);

  const added = diffs.filter(d => d.status === 'added');
  const modified = diffs.filter(d => d.status === 'modified');
  const unchanged = diffs.filter(d => d.status === 'unchanged');

  // Summary
  info(
    `\nSummary: ${added.length} added, ${modified.length} modified, ${unchanged.length} unchanged`,
  );

  // Package changes
  if (result.packagesToInstall.length > 0) {
    info(`\nPackages to install: ${result.packagesToInstall.length}`);
  }

  // List by category
  if (added.length > 0) {
    info('\nAdded:');
    for (const file of added) {
      listItem(file.path);
    }
  }

  if (modified.length > 0) {
    info('\nModified:');
    for (const file of modified) {
      listItem(file.path);
    }
  }

  if (unchanged.length > 0) {
    info('\nUnchanged:');
    for (const file of unchanged) {
      listItem(file.path);
    }
  }

  // Verbose output - show actual diffs
  if (options.verbose) {
    header('Detailed Changes');

    for (const file of modified) {
      if (file.currentContent && file.newContent) {
        info(`\n${file.path}:`);
        const diffOutput = createUnifiedDiff(file.currentContent, file.newContent, file.path);
        if (diffOutput) {
          console.log(diffOutput);
        }
      }
    }

    for (const file of added) {
      if (file.newContent) {
        info(`\n${file.path}: (new file)`);
        const lines = file.newContent.split('\n').slice(0, 10);
        for (const line of lines) {
          console.log(`+${line}`);
        }
        if (file.newContent.split('\n').length > 10) {
          console.log('... (truncated)');
        }
      }
    }

    if (result.packagesToInstall.length > 0) {
      info('\nPackages to install:');
      for (const pkg of result.packagesToInstall) {
        listItem(pkg);
      }
    }
  }

  if (added.length === 0 && modified.length === 0 && result.packagesToInstall.length === 0) {
    success('\nNo changes needed - configuration is up to date');
  } else {
    info('\nRun `safeword upgrade` to apply these changes');
  }
}
