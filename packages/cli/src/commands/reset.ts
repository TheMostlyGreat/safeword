/**
 * Reset command - Remove safeword configuration from project
 */

import { join } from 'node:path';
import { exists, remove, readJson, writeJson, listDir } from '../utils/fs.js';
import { info, success, error, header, listItem } from '../utils/output.js';
import { isGitRepo, removeGitHook } from '../utils/git.js';
import { filterOutSafewordHooks } from '../utils/hooks.js';
import { removeAgentsMdLink } from '../utils/agents-md.js';

export interface ResetOptions {
  yes?: boolean;
}

export async function reset(options: ResetOptions): Promise<void> {
  const cwd = process.cwd();
  const safewordDir = join(cwd, '.safeword');

  // Check if configured
  if (!exists(safewordDir)) {
    info('Nothing to remove. Project is not configured with safeword.');
    return;
  }

  const isNonInteractive = options.yes || !process.stdin.isTTY;

  // Confirmation (in interactive mode without --yes)
  if (!isNonInteractive) {
    // In a real implementation, we'd prompt here
    // For now, non-TTY mode auto-confirms
  }

  header('Safeword Reset');
  info('Removing safeword configuration...');

  const removed: string[] = [];

  try {
    // 1. Remove .safeword directory
    if (exists(safewordDir)) {
      remove(safewordDir);
      removed.push('.safeword/');
      success('Removed .safeword directory');
    }

    // 2. Remove safeword hooks from .claude/settings.json
    const settingsPath = join(cwd, '.claude', 'settings.json');

    if (exists(settingsPath)) {
      info('\nRemoving hooks from .claude/settings.json...');

      interface SettingsJson {
        hooks?: Record<string, unknown[]>;
        [key: string]: unknown;
      }

      const settings = readJson<SettingsJson>(settingsPath);

      if (settings?.hooks) {
        let modified = false;

        for (const [event, hooks] of Object.entries(settings.hooks)) {
          if (Array.isArray(hooks)) {
            const filtered = filterOutSafewordHooks(hooks);
            if (filtered.length !== hooks.length) {
              settings.hooks[event] = filtered;
              modified = true;
            }
          }
        }

        if (modified) {
          writeJson(settingsPath, settings);
          removed.push('.claude/settings.json (hooks)');
          success('Removed safeword hooks');
        }
      }
    }

    // 3. Remove safeword skills
    const skillsDir = join(cwd, '.claude', 'skills');

    if (exists(skillsDir)) {
      info('\nRemoving safeword skills...');

      const skills = listDir(skillsDir);
      for (const skill of skills) {
        if (skill.startsWith('safeword-')) {
          remove(join(skillsDir, skill));
          removed.push(`.claude/skills/${skill}/`);
        }
      }

      if (removed.some(r => r.includes('skills'))) {
        success('Removed safeword skills');
      }
    }

    // 3.5. Remove safeword slash commands
    const commandsDir = join(cwd, '.claude', 'commands');
    const safewordCommands = ['quality-review.md', 'arch-review.md', 'lint.md'];

    if (exists(commandsDir)) {
      info('\nRemoving safeword commands...');

      let commandsRemoved = false;
      for (const cmd of safewordCommands) {
        const cmdPath = join(commandsDir, cmd);
        if (exists(cmdPath)) {
          remove(cmdPath);
          removed.push(`.claude/commands/${cmd}`);
          commandsRemoved = true;
        }
      }

      if (commandsRemoved) {
        success('Removed safeword commands');
      }
    }

    // 3.6. Remove MCP servers from .mcp.json
    const mcpConfigPath = join(cwd, '.mcp.json');

    if (exists(mcpConfigPath)) {
      info('\nRemoving MCP servers...');

      interface McpConfig {
        mcpServers?: Record<string, unknown>;
        [key: string]: unknown;
      }

      const mcpConfig = readJson<McpConfig>(mcpConfigPath);

      if (mcpConfig?.mcpServers) {
        // Remove safeword MCP servers
        delete mcpConfig.mcpServers.context7;
        delete mcpConfig.mcpServers.playwright;

        // If no servers left, remove the file
        if (Object.keys(mcpConfig.mcpServers).length === 0) {
          remove(mcpConfigPath);
          removed.push('.mcp.json');
        } else {
          writeJson(mcpConfigPath, mcpConfig);
          removed.push('.mcp.json (context7, playwright)');
        }

        success('Removed MCP servers');
      }
    }

    // 4. Remove git hook markers
    if (isGitRepo(cwd)) {
      info('\nRemoving git hook markers...');
      removeGitHook(cwd);
      removed.push('.git/hooks/pre-commit (markers)');
      success('Removed git hook markers');
    }

    // 5. Remove link from AGENTS.md
    info('\nCleaning AGENTS.md...');
    if (removeAgentsMdLink(cwd)) {
      removed.push('AGENTS.md (link)');
      success('Removed safeword link from AGENTS.md');
    }

    // Print summary
    header('Reset Complete');

    if (removed.length > 0) {
      info('\nRemoved:');
      for (const item of removed) {
        listItem(item);
      }
    }

    // Note about preserved linting
    info('\nPreserved (remove manually if desired):');
    listItem('eslint.config.mjs');
    listItem('.prettierrc');
    listItem('package.json lint/format scripts');
    listItem('ESLint/Prettier devDependencies');

    success('\nSafeword configuration removed');
  } catch (err) {
    error(`Reset failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    process.exit(1);
  }
}
