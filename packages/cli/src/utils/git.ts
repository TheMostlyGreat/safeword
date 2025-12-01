/**
 * Git utilities for CLI operations
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { exists, readFile, writeFile, ensureDir, makeExecutable } from './fs.js';

const MARKER_START = '# SAFEWORD_ARCH_CHECK_START';
const MARKER_END = '# SAFEWORD_ARCH_CHECK_END';

/**
 * Check if directory is a git repository
 */
export function isGitRepo(cwd: string): boolean {
  return exists(join(cwd, '.git'));
}

/**
 * Initialize a git repository
 */
export function initGitRepo(cwd: string): void {
  execSync('git init', { cwd, stdio: 'pipe' });
}

/**
 * Get the pre-commit hook content to add
 */
function getHookContent(): string {
  return `
${MARKER_START}
# Safeword pre-commit linting
# This section is managed by safeword - do not edit manually
if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -f "$CLAUDE_PROJECT_DIR/.safeword/hooks/git-pre-commit.sh" ]; then
  "$CLAUDE_PROJECT_DIR"/.safeword/hooks/git-pre-commit.sh
elif [ -f ".safeword/hooks/git-pre-commit.sh" ]; then
  ./.safeword/hooks/git-pre-commit.sh
fi
${MARKER_END}
`;
}

/**
 * Install safeword markers into pre-commit hook
 */
export function installGitHook(cwd: string): void {
  const hooksDir = join(cwd, '.git', 'hooks');
  const hookPath = join(hooksDir, 'pre-commit');

  ensureDir(hooksDir);

  let content = '';

  if (exists(hookPath)) {
    content = readFile(hookPath);

    // Check if already has safeword markers
    if (content.includes(MARKER_START)) {
      // Remove existing safeword section and re-add (update)
      content = removeMarkerSection(content);
    }
  } else {
    // Create new hook file with shebang
    content = '#!/bin/bash\n';
  }

  // Add safeword section
  content = content.trimEnd() + '\n' + getHookContent();

  writeFile(hookPath, content);
  makeExecutable(hookPath);
}

/**
 * Remove safeword markers from pre-commit hook
 */
export function removeGitHook(cwd: string): void {
  const hookPath = join(cwd, '.git', 'hooks', 'pre-commit');

  if (!exists(hookPath)) return;

  let content = readFile(hookPath);

  if (!content.includes(MARKER_START)) return;

  content = removeMarkerSection(content);

  // If only shebang remains, we could delete the file
  // but safer to leave it
  writeFile(hookPath, content);
}

/**
 * Remove the section between markers (inclusive)
 */
function removeMarkerSection(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inMarkerSection = false;

  for (const line of lines) {
    if (line.includes(MARKER_START)) {
      inMarkerSection = true;
      continue;
    }
    if (line.includes(MARKER_END)) {
      inMarkerSection = false;
      continue;
    }
    if (!inMarkerSection) {
      result.push(line);
    }
  }

  return result.join('\n').trim() + '\n';
}

/**
 * Check if git hooks have safeword markers
 */
export function hasGitHook(cwd: string): boolean {
  const hookPath = join(cwd, '.git', 'hooks', 'pre-commit');
  if (!exists(hookPath)) return false;
  const content = readFile(hookPath);
  return content.includes(MARKER_START);
}
