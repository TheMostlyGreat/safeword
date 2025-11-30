/**
 * Upgrade command - Update safeword configuration to latest version
 */

import { join } from 'node:path';
import { VERSION } from '../version.js';
import {
  exists,
  ensureDir,
  writeFile,
  readFileSafe,
  updateJson,
  copyDir,
  copyFile,
  getTemplatesDir,
  makeScriptsExecutable,
} from '../utils/fs.js';
import { info, success, error, header, listItem } from '../utils/output.js';
import { isGitRepo } from '../utils/git.js';
import { execSync } from 'node:child_process';
import { compareVersions } from '../utils/version.js';
import { filterOutSafewordHooks } from '../utils/hooks.js';
import { ensureAgentsMdLink } from '../utils/agents-md.js';
import { SETTINGS_HOOKS } from '../templates/index.js';

export async function upgrade(): Promise<void> {
  const cwd = process.cwd();
  const safewordDir = join(cwd, '.safeword');

  // Check if configured
  if (!exists(safewordDir)) {
    error('Not configured. Run `safeword setup` first.');
    process.exit(1);
  }

  // Read project version
  const versionPath = join(safewordDir, 'version');
  const projectVersion = readFileSafe(versionPath)?.trim() ?? '0.0.0';

  // Check for downgrade
  if (compareVersions(VERSION, projectVersion) < 0) {
    error(`CLI v${VERSION} is older than project v${projectVersion}.`);
    error('Update the CLI first: npm install -g safeword');
    process.exit(1);
  }

  header('Safeword Upgrade');
  info(`Upgrading from v${projectVersion} to v${VERSION}`);

  const updated: string[] = [];
  const unchanged: string[] = [];

  try {
    const templatesDir = getTemplatesDir();

    // 1. Update .safeword directory
    info('\nUpdating .safeword directory...');

    // Update core files from templates
    copyFile(join(templatesDir, 'SAFEWORD.md'), join(safewordDir, 'SAFEWORD.md'));
    writeFile(join(safewordDir, 'version'), VERSION);
    updated.push('.safeword/SAFEWORD.md');
    updated.push('.safeword/version');

    // Update guides, templates, prompts from templates
    copyDir(join(templatesDir, 'guides'), join(safewordDir, 'guides'));
    copyDir(join(templatesDir, 'doc-templates'), join(safewordDir, 'templates'));
    copyDir(join(templatesDir, 'prompts'), join(safewordDir, 'prompts'));

    // Update lib scripts and make executable
    copyDir(join(templatesDir, 'lib'), join(safewordDir, 'lib'));
    makeScriptsExecutable(join(safewordDir, 'lib'));

    // Update hook scripts and make executable
    copyDir(join(templatesDir, 'hooks'), join(safewordDir, 'hooks'));
    makeScriptsExecutable(join(safewordDir, 'hooks'));

    updated.push('.safeword/guides/');
    updated.push('.safeword/templates/');
    updated.push('.safeword/prompts/');
    updated.push('.safeword/hooks/');
    success('Updated .safeword directory');

    // 2. Verify AGENTS.md link
    info('\nVerifying AGENTS.md...');
    const agentsMdResult = ensureAgentsMdLink(cwd);
    if (agentsMdResult === 'created') {
      updated.push('AGENTS.md');
      success('Created AGENTS.md');
    } else if (agentsMdResult === 'modified') {
      updated.push('AGENTS.md');
      success('Restored link to AGENTS.md');
    } else {
      unchanged.push('AGENTS.md');
      info('AGENTS.md link is present');
    }

    // 3. Update Claude Code hooks
    info('\nUpdating Claude Code hooks...');

    const claudeDir = join(cwd, '.claude');
    const settingsPath = join(claudeDir, 'settings.json');

    ensureDir(claudeDir);

    updateJson<{ hooks?: Record<string, unknown[]> }>(settingsPath, existing => {
      const hooks = existing?.hooks ?? {};

      // Merge hooks, preserving existing non-safeword hooks
      for (const [event, newHooks] of Object.entries(SETTINGS_HOOKS)) {
        const existingHooks = (hooks[event] as unknown[]) ?? [];
        const nonSafewordHooks = filterOutSafewordHooks(existingHooks);
        hooks[event] = [...nonSafewordHooks, ...newHooks];
      }

      return { ...existing, hooks };
    });

    updated.push('.claude/settings.json');
    success('Updated hooks in .claude/settings.json');

    // 4. Update skills and commands
    info('\nUpdating skills and commands...');

    copyDir(join(templatesDir, 'skills'), join(claudeDir, 'skills'));
    copyDir(join(templatesDir, 'commands'), join(claudeDir, 'commands'));

    updated.push('.claude/skills/');
    updated.push('.claude/commands/');
    success('Updated skills and commands');

    // 5. Update Husky hooks if repo exists
    if (isGitRepo(cwd)) {
      const huskyDir = join(cwd, '.husky');
      if (exists(huskyDir)) {
        info('\nUpdating Husky pre-commit hook...');
        const huskyPreCommit = join(huskyDir, 'pre-commit');
        writeFile(huskyPreCommit, 'npx lint-staged\n');
        updated.push('.husky/pre-commit');
        success('Updated Husky pre-commit hook');
      } else {
        // Initialize Husky if not present
        info('\nInitializing Husky...');
        try {
          execSync('npx husky init', { cwd, stdio: 'pipe' });
          const huskyPreCommit = join(cwd, '.husky', 'pre-commit');
          writeFile(huskyPreCommit, 'npx lint-staged\n');
          updated.push('.husky/pre-commit');
          success('Initialized Husky with lint-staged');
        } catch {
          info('Husky not initialized (run: npx husky init)');
        }
      }
    }

    // Print summary
    header('Upgrade Complete');

    info(`\nVersion: v${projectVersion} → v${VERSION}`);

    if (updated.length > 0) {
      info('\nUpdated:');
      for (const file of updated) {
        listItem(file);
      }
    }

    if (unchanged.length > 0) {
      info('\nUnchanged:');
      for (const file of unchanged) {
        listItem(file);
      }
    }

    success(`\nSafeword upgraded to v${VERSION}`);
  } catch (err) {
    error(`Upgrade failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    process.exit(1);
  }
}
