/**
 * Reset command - Remove safeword configuration from project
 *
 * By default, preserves linting configuration (eslint, prettier, etc.)
 * Use --full to also remove linting config and uninstall npm packages
 */

import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { exists, remove, readJson, writeJson, listDir } from '../utils/fs.js';
import { info, success, warn, error, header, listItem } from '../utils/output.js';
import { filterOutSafewordHooks } from '../utils/hooks.js';
import { removeAgentsMdLink } from '../utils/agents-md.js';
import {
  SAFEWORD_COMMANDS,
  SAFEWORD_SCRIPTS,
  LINTING_CONFIG_FILES,
  BASE_DEV_DEPS,
  OPTIONAL_DEV_DEPS,
} from '../utils/install.js';

export interface ResetOptions {
  yes?: boolean;
  full?: boolean;
}

interface PackageJson {
  name?: string;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
  'lint-staged'?: Record<string, string[]>;
  [key: string]: unknown;
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
  const fullReset = options.full ?? false;

  // Confirmation (in interactive mode without --yes)
  if (!isNonInteractive) {
    // In a real implementation, we'd prompt here
    // For now, non-TTY mode auto-confirms
  }

  header('Safeword Reset');
  if (fullReset) {
    info('Performing full reset (including linting configuration)...');
  } else {
    info('Removing safeword configuration...');
  }

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

    if (exists(commandsDir)) {
      info('\nRemoving safeword commands...');

      let commandsRemoved = false;
      for (const cmd of SAFEWORD_COMMANDS) {
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

    // 4. Remove Husky directory
    const huskyDir = join(cwd, '.husky');
    if (exists(huskyDir)) {
      info('\nRemoving Husky hooks...');
      remove(huskyDir);
      removed.push('.husky/');
      success('Removed Husky hooks');
    }

    // 5. Remove link from AGENTS.md
    info('\nCleaning AGENTS.md...');
    if (removeAgentsMdLink(cwd)) {
      removed.push('AGENTS.md (link)');
      success('Removed safeword link from AGENTS.md');
    }

    // 6. Full reset: Remove linting configuration and uninstall packages
    if (fullReset) {
      info('\nRemoving linting configuration...');

      // Remove linting config files
      for (const configFile of LINTING_CONFIG_FILES) {
        const configPath = join(cwd, configFile);
        if (exists(configPath)) {
          remove(configPath);
          removed.push(configFile);
        }
      }
      success('Removed linting config files');

      // Remove scripts and lint-staged from package.json
      const packageJsonPath = join(cwd, 'package.json');
      if (exists(packageJsonPath)) {
        info('\nCleaning package.json...');

        const packageJson = readJson<PackageJson>(packageJsonPath);
        if (packageJson) {
          let modified = false;

          // Remove safeword scripts
          if (packageJson.scripts) {
            for (const script of SAFEWORD_SCRIPTS) {
              if (script in packageJson.scripts) {
                delete packageJson.scripts[script];
                modified = true;
              }
            }
          }

          // Remove lint-staged config
          if (packageJson['lint-staged']) {
            delete packageJson['lint-staged'];
            modified = true;
          }

          if (modified) {
            writeJson(packageJsonPath, packageJson);
            removed.push('package.json (scripts, lint-staged)');
            success('Cleaned package.json');
          }
        }
      }

      // Uninstall npm packages
      info('\nUninstalling devDependencies...');

      // Collect all packages to uninstall
      const packagesToUninstall: string[] = [...BASE_DEV_DEPS];

      // Add all optional deps too (they might have been installed)
      for (const deps of Object.values(OPTIONAL_DEV_DEPS)) {
        packagesToUninstall.push(...deps);
      }

      try {
        const uninstallCmd = `npm uninstall ${packagesToUninstall.join(' ')}`;
        info(`Running: ${uninstallCmd}`);
        execSync(uninstallCmd, { cwd, stdio: 'inherit' });
        removed.push('devDependencies (safeword packages)');
        success('Uninstalled safeword devDependencies');
      } catch {
        warn('Failed to uninstall some packages. Run manually:');
        listItem(`npm uninstall ${packagesToUninstall.join(' ')}`);
      }
    }

    // Print summary
    header('Reset Complete');

    if (removed.length > 0) {
      info('\nRemoved:');
      for (const item of removed) {
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
