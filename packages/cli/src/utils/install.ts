/**
 * Shared installation utilities for setup, upgrade, and reset commands
 *
 * Provides common functionality to ensure consistent behavior across commands.
 */

import { join } from 'node:path';
import {
  exists,
  ensureDir,
  writeFile,
  readJson,
  writeJson,
  updateJson,
  copyDir,
  copyFile,
  getTemplatesDir,
  makeScriptsExecutable,
  remove,
} from './fs.js';
import { filterOutSafewordHooks } from './hooks.js';
import { SETTINGS_HOOKS } from '../templates/index.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Husky pre-commit hook content - includes safeword sync + lint-staged
 * The sync command keeps ESLint plugins aligned with detected frameworks
 */
export const HUSKY_PRE_COMMIT_CONTENT = 'npx safeword sync --quiet --stage\nnpx lint-staged\n';

/**
 * MCP servers installed by safeword
 */
export const MCP_SERVERS = {
  context7: {
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp@latest'],
  },
  playwright: {
    command: 'npx',
    args: ['@playwright/mcp@latest'],
  },
} as const;

/**
 * Safeword commands that are installed
 */
export const SAFEWORD_COMMANDS = ['review.md', 'architecture.md', 'lint.md'] as const;

/**
 * Scripts added by safeword to package.json
 */
export const SAFEWORD_SCRIPTS = [
  'lint',
  'lint:md',
  'format',
  'format:check',
  'knip',
  'publint',
  'prepare',
] as const;

/**
 * Linting config files created by safeword
 */
export const LINTING_CONFIG_FILES = [
  'eslint.config.mjs',
  '.prettierrc',
  '.markdownlint-cli2.jsonc',
] as const;

/**
 * Base devDependencies installed by safeword (always installed)
 */
export const BASE_DEV_DEPS = [
  'eslint',
  'prettier',
  '@eslint/js',
  'eslint-plugin-import-x',
  'eslint-plugin-sonarjs',
  '@microsoft/eslint-plugin-sdl',
  'eslint-config-prettier',
  'markdownlint-cli2',
  'knip',
  'husky',
  'lint-staged',
  'eslint-plugin-boundaries',
  'eslint-plugin-playwright',
] as const;

/**
 * Optional devDependencies installed based on project detection
 */
export const OPTIONAL_DEV_DEPS = {
  typescript: ['typescript-eslint'],
  react: ['eslint-plugin-react', 'eslint-plugin-react-hooks', 'eslint-plugin-jsx-a11y'],
  nextjs: ['@next/eslint-plugin-next'],
  astro: ['eslint-plugin-astro'],
  vue: ['eslint-plugin-vue'],
  svelte: ['eslint-plugin-svelte'],
  electron: ['@electron-toolkit/eslint-config'],
  vitest: ['@vitest/eslint-plugin'],
  tailwind: ['prettier-plugin-tailwindcss'],
  publishableLibrary: ['publint'],
} as const;

// ============================================================================
// Hook Management
// ============================================================================

/**
 * Merge safeword hooks with existing hooks, preserving non-safeword hooks
 *
 * @param existingHooks - Current hooks from settings.json
 * @returns Merged hooks object with safeword hooks added/replaced
 */
export function mergeSettingsHooks(
  existingHooks: Record<string, unknown[]>,
): Record<string, unknown[]> {
  const hooks = { ...existingHooks };

  for (const [event, newHooks] of Object.entries(SETTINGS_HOOKS)) {
    const eventHooks = (hooks[event] as unknown[]) ?? [];
    const nonSafewordHooks = filterOutSafewordHooks(eventHooks);
    hooks[event] = [...nonSafewordHooks, ...newHooks];
  }

  return hooks;
}

// ============================================================================
// Template Installation
// ============================================================================

export interface TemplateInstallResult {
  created: string[];
  updated: string[];
}

/**
 * Install/update templates to .safeword and .claude directories
 *
 * @param projectDir - Project root directory
 * @param options.isSetup - True for fresh install (creates directories), false for upgrade
 * @returns Lists of created and updated paths
 */
export function installTemplates(
  projectDir: string,
  options: { isSetup: boolean },
): TemplateInstallResult {
  const templatesDir = getTemplatesDir();
  const safewordDir = join(projectDir, '.safeword');
  const claudeDir = join(projectDir, '.claude');

  const created: string[] = [];
  const updated: string[] = [];
  const list = options.isSetup ? created : updated;

  // Create directory structure (setup only)
  if (options.isSetup) {
    ensureDir(safewordDir);
    ensureDir(join(safewordDir, 'learnings'));
    ensureDir(join(safewordDir, 'planning', 'user-stories'));
    ensureDir(join(safewordDir, 'planning', 'design'));
    ensureDir(join(safewordDir, 'tickets', 'completed'));
  }

  // .safeword core files
  copyFile(join(templatesDir, 'SAFEWORD.md'), join(safewordDir, 'SAFEWORD.md'));
  list.push('.safeword/SAFEWORD.md');

  // .safeword subdirectories
  copyDir(join(templatesDir, 'guides'), join(safewordDir, 'guides'));
  copyDir(join(templatesDir, 'doc-templates'), join(safewordDir, 'templates'));
  copyDir(join(templatesDir, 'prompts'), join(safewordDir, 'prompts'));
  list.push('.safeword/guides/');
  list.push('.safeword/templates/');
  list.push('.safeword/prompts/');

  // lib scripts
  copyDir(join(templatesDir, 'lib'), join(safewordDir, 'lib'));
  makeScriptsExecutable(join(safewordDir, 'lib'));

  // hook scripts
  copyDir(join(templatesDir, 'hooks'), join(safewordDir, 'hooks'));
  makeScriptsExecutable(join(safewordDir, 'hooks'));
  list.push('.safeword/hooks/');

  // .claude directories
  ensureDir(claudeDir);
  copyDir(join(templatesDir, 'skills'), join(claudeDir, 'skills'));
  copyDir(join(templatesDir, 'commands'), join(claudeDir, 'commands'));
  list.push('.claude/skills/');
  list.push('.claude/commands/');

  return { created, updated };
}

// ============================================================================
// MCP Configuration
// ============================================================================

interface McpConfig {
  mcpServers?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Update MCP configuration with safeword servers
 *
 * @param projectDir - Project root directory
 * @returns 'created' | 'modified' | 'unchanged'
 */
export function updateMcpConfig(projectDir: string): 'created' | 'modified' | 'unchanged' {
  const mcpConfigPath = join(projectDir, '.mcp.json');
  const existed = exists(mcpConfigPath);

  updateJson<McpConfig>(mcpConfigPath, existing => {
    const mcpServers = existing?.mcpServers ?? {};

    // Add/update safeword MCP servers
    mcpServers.context7 = MCP_SERVERS.context7;
    mcpServers.playwright = MCP_SERVERS.playwright;

    return { ...existing, mcpServers };
  });

  return existed ? 'modified' : 'created';
}

/**
 * Remove safeword MCP servers from configuration
 *
 * @param projectDir - Project root directory
 * @returns true if changes were made
 */
export function removeMcpServers(projectDir: string): boolean {
  const mcpConfigPath = join(projectDir, '.mcp.json');

  if (!exists(mcpConfigPath)) {
    return false;
  }

  const mcpConfig = readJson<McpConfig>(mcpConfigPath);
  if (!mcpConfig?.mcpServers) {
    return false;
  }

  // Remove safeword MCP servers
  delete mcpConfig.mcpServers.context7;
  delete mcpConfig.mcpServers.playwright;

  // If no servers left, remove the file
  if (Object.keys(mcpConfig.mcpServers).length === 0) {
    remove(mcpConfigPath);
  } else {
    writeJson(mcpConfigPath, mcpConfig);
  }

  return true;
}

// ============================================================================
// Husky Configuration
// ============================================================================

/**
 * Setup or update Husky pre-commit hook
 *
 * @param projectDir - Project root directory
 * @returns 'created' | 'updated' | 'skipped'
 */
export function setupHuskyPreCommit(projectDir: string): 'created' | 'updated' | 'skipped' {
  const huskyDir = join(projectDir, '.husky');
  const huskyPreCommit = join(huskyDir, 'pre-commit');

  const dirExisted = exists(huskyDir);

  ensureDir(huskyDir);
  writeFile(huskyPreCommit, HUSKY_PRE_COMMIT_CONTENT);
  makeScriptsExecutable(huskyDir);

  return dirExisted ? 'updated' : 'created';
}

// ============================================================================
// Settings Hooks
// ============================================================================

interface SettingsJson {
  hooks?: Record<string, unknown[]>;
  [key: string]: unknown;
}

/**
 * Update Claude Code settings with safeword hooks
 *
 * @param projectDir - Project root directory
 * @returns 'created' | 'modified'
 */
export function updateSettingsHooks(projectDir: string): 'created' | 'modified' {
  const claudeDir = join(projectDir, '.claude');
  const settingsPath = join(claudeDir, 'settings.json');

  ensureDir(claudeDir);
  const existed = exists(settingsPath);

  updateJson<SettingsJson>(settingsPath, existing => {
    const hooks = mergeSettingsHooks(existing?.hooks ?? {});
    return { ...existing, hooks };
  });

  return existed ? 'modified' : 'created';
}

/**
 * Remove safeword hooks from Claude Code settings
 *
 * @param projectDir - Project root directory
 * @returns true if changes were made
 */
export function removeSettingsHooks(projectDir: string): boolean {
  const settingsPath = join(projectDir, '.claude', 'settings.json');

  if (!exists(settingsPath)) {
    return false;
  }

  const settings = readJson<SettingsJson>(settingsPath);
  if (!settings?.hooks) {
    return false;
  }

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
  }

  return modified;
}
