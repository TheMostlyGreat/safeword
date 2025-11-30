/**
 * Diff command - Preview changes that would be made by upgrade
 */

import { join } from 'node:path';
import { VERSION } from '../version.js';
import { exists, readFileSafe, getTemplatesDir } from '../utils/fs.js';
import { info, success, error, header, listItem } from '../utils/output.js';

export interface DiffOptions {
  verbose?: boolean;
}

interface FileDiff {
  path: string;
  status: 'added' | 'modified' | 'unchanged';
  currentContent?: string;
  newContent: string;
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
  // A real implementation would use a proper diff algorithm
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
 * Get all files that would be changed by upgrade
 */
function getFileDiffs(cwd: string): FileDiff[] {
  const templatesDir = getTemplatesDir();
  const diffs: FileDiff[] = [];

  // Define files to check (template source -> install destination)
  const files: Array<{ templatePath: string; installPath: string }> = [
    { templatePath: 'SAFEWORD.md', installPath: '.safeword/SAFEWORD.md' },
    { templatePath: 'hooks/session-verify-agents.sh', installPath: '.safeword/hooks/session-verify-agents.sh' },
    { templatePath: 'hooks/session-version.sh', installPath: '.safeword/hooks/session-version.sh' },
    { templatePath: 'hooks/session-lint-check.sh', installPath: '.safeword/hooks/session-lint-check.sh' },
    { templatePath: 'hooks/prompt-timestamp.sh', installPath: '.safeword/hooks/prompt-timestamp.sh' },
    { templatePath: 'hooks/prompt-questions.sh', installPath: '.safeword/hooks/prompt-questions.sh' },
    { templatePath: 'hooks/post-tool-lint.sh', installPath: '.safeword/hooks/post-tool-lint.sh' },
    { templatePath: 'hooks/stop-quality.sh', installPath: '.safeword/hooks/stop-quality.sh' },
    { templatePath: 'skills/safeword-quality-reviewer/SKILL.md', installPath: '.claude/skills/safeword-quality-reviewer/SKILL.md' },
  ];

  // Add version file (not from templates)
  const versionPath = join(cwd, '.safeword/version');
  const currentVersion = readFileSafe(versionPath);
  if (currentVersion === null) {
    diffs.push({ path: '.safeword/version', status: 'added', newContent: VERSION });
  } else if (currentVersion.trim() !== VERSION) {
    diffs.push({ path: '.safeword/version', status: 'modified', currentContent: currentVersion, newContent: VERSION });
  } else {
    diffs.push({ path: '.safeword/version', status: 'unchanged', currentContent: currentVersion, newContent: VERSION });
  }

  for (const file of files) {
    const templateFullPath = join(templatesDir, file.templatePath);
    const installFullPath = join(cwd, file.installPath);

    const newContent = readFileSafe(templateFullPath);
    if (newContent === null) continue; // Skip if template doesn't exist

    const currentContent = readFileSafe(installFullPath);

    if (currentContent === null) {
      diffs.push({
        path: file.installPath,
        status: 'added',
        newContent,
      });
    } else if (currentContent.trim() !== newContent.trim()) {
      diffs.push({
        path: file.installPath,
        status: 'modified',
        currentContent,
        newContent,
      });
    } else {
      diffs.push({
        path: file.installPath,
        status: 'unchanged',
        currentContent,
        newContent,
      });
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

  const diffs = getFileDiffs(cwd);

  const added = diffs.filter(d => d.status === 'added');
  const modified = diffs.filter(d => d.status === 'modified');
  const unchanged = diffs.filter(d => d.status === 'unchanged');

  // Summary
  info(
    `\nSummary: ${added.length} added, ${modified.length} modified, ${unchanged.length} unchanged`,
  );

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
      if (file.currentContent) {
        info(`\n${file.path}:`);
        const diffOutput = createUnifiedDiff(file.currentContent, file.newContent, file.path);
        if (diffOutput) {
          console.log(diffOutput);
        }
      }
    }

    for (const file of added) {
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

  if (added.length === 0 && modified.length === 0) {
    success('\nNo changes needed - configuration is up to date');
  } else {
    info('\nRun `safeword upgrade` to apply these changes');
  }
}
