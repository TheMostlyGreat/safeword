/**
 * AGENTS.md file utilities
 */

import { join } from 'node:path';
import { exists, readFile, writeFile } from './fs.js';
import { AGENTS_MD_LINK } from '../templates/index.js';

const SAFEWORD_LINK_MARKER = '@./.safeword/SAFEWORD.md';

/**
 * Check if AGENTS.md has the safeword link
 */
export function hasAgentsMdLink(cwd: string): boolean {
  const agentsMdPath = join(cwd, 'AGENTS.md');
  if (!exists(agentsMdPath)) return false;
  const content = readFile(agentsMdPath);
  return content.includes(SAFEWORD_LINK_MARKER);
}

/**
 * Ensure AGENTS.md exists and has the safeword link.
 * Returns 'created' | 'modified' | 'unchanged'
 */
export function ensureAgentsMdLink(cwd: string): 'created' | 'modified' | 'unchanged' {
  const agentsMdPath = join(cwd, 'AGENTS.md');

  if (!exists(agentsMdPath)) {
    writeFile(agentsMdPath, `${AGENTS_MD_LINK}\n`);
    return 'created';
  }

  const content = readFile(agentsMdPath);
  if (!content.includes(SAFEWORD_LINK_MARKER)) {
    writeFile(agentsMdPath, `${AGENTS_MD_LINK}\n\n${content}`);
    return 'modified';
  }

  return 'unchanged';
}

/**
 * Remove safeword link block from AGENTS.md.
 * Returns true if link was removed.
 */
export function removeAgentsMdLink(cwd: string): boolean {
  const agentsMdPath = join(cwd, 'AGENTS.md');
  if (!exists(agentsMdPath)) return false;

  const content = readFile(agentsMdPath);

  // Remove the entire AGENTS_MD_LINK block if present
  let newContent = content.replace(AGENTS_MD_LINK, '');

  // Also handle legacy single-line format (filter any remaining lines with marker)
  const lines = newContent.split('\n').filter((line) => !line.includes(SAFEWORD_LINK_MARKER));

  // Remove extra blank lines and separators at the start
  while (lines.length > 0 && (lines[0].trim() === '' || lines[0].trim() === '---')) {
    lines.shift();
  }

  newContent = lines.join('\n');

  if (newContent !== content) {
    writeFile(agentsMdPath, newContent);
    return true;
  }

  return false;
}
