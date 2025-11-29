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
 * Remove safeword link from AGENTS.md.
 * Returns true if link was removed.
 */
export function removeAgentsMdLink(cwd: string): boolean {
  const agentsMdPath = join(cwd, 'AGENTS.md');
  if (!exists(agentsMdPath)) return false;

  const content = readFile(agentsMdPath);
  const lines = content.split('\n');
  const filteredLines = lines.filter((line) => !line.includes(SAFEWORD_LINK_MARKER));

  // Remove extra blank lines at the start
  while (filteredLines.length > 0 && filteredLines[0].trim() === '') {
    filteredLines.shift();
  }

  const newContent = filteredLines.join('\n');
  if (newContent !== content) {
    writeFile(agentsMdPath, newContent);
    return true;
  }

  return false;
}
