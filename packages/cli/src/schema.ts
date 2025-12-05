/**
 * SAFEWORD Schema - Single Source of Truth
 *
 * All files, directories, configurations, and packages managed by safeword
 * are defined here. Commands use this schema via the reconciliation engine.
 *
 * Adding a new file? Add it here and it will be handled by setup/upgrade/reset.
 */

import { VERSION } from './version.js';
import { type ProjectType } from './utils/project-detector.js';
import { AGENTS_MD_LINK, getPrettierConfig, getLintStagedConfig } from './templates/content.js';
import { getEslintConfig, SETTINGS_HOOKS, CURSOR_HOOKS } from './templates/config.js';
import { generateBoundariesConfig, detectArchitecture } from './utils/boundaries.js';
import { HUSKY_PRE_COMMIT_CONTENT, MCP_SERVERS } from './utils/install.js';
import { filterOutSafewordHooks } from './utils/hooks.js';

// ============================================================================
// Interfaces
// ============================================================================

export interface ProjectContext {
  cwd: string;
  projectType: ProjectType;
  devDeps: Record<string, string>;
  isGitRepo: boolean;
}

export interface FileDefinition {
  template?: string; // Path in templates/ dir
  content?: string | (() => string); // Static content or factory
  generator?: (ctx: ProjectContext) => string; // Dynamic generator needing context
}

// managedFiles: created if missing, updated only if content === current template output
export type ManagedFileDefinition = FileDefinition;

export interface JsonMergeDefinition {
  keys: string[]; // Dot-notation keys we manage
  conditionalKeys?: Record<string, string[]>; // Keys added based on project type
  merge: (existing: Record<string, unknown>, ctx: ProjectContext) => Record<string, unknown>;
  unmerge: (existing: Record<string, unknown>) => Record<string, unknown>;
  removeFileIfEmpty?: boolean; // Delete file if our keys were the only content
}

export interface TextPatchDefinition {
  operation: 'prepend' | 'append';
  content: string;
  marker: string; // Used to detect if already applied & for removal
  createIfMissing: boolean;
}

export interface SafewordSchema {
  version: string;
  ownedDirs: string[]; // Fully owned - create on setup, delete on reset
  sharedDirs: string[]; // We add to but don't own
  preservedDirs: string[]; // Created on setup, NOT deleted on reset (user data)
  deprecatedFiles: string[]; // Files to delete on upgrade (renamed or removed)
  ownedFiles: Record<string, FileDefinition>; // Overwrite on upgrade (if changed)
  managedFiles: Record<string, ManagedFileDefinition>; // Create if missing, update if safeword content
  jsonMerges: Record<string, JsonMergeDefinition>;
  textPatches: Record<string, TextPatchDefinition>;
  packages: {
    base: string[];
    conditional: Record<string, string[]>;
  };
}

// ============================================================================
// SAFEWORD_SCHEMA - The Single Source of Truth
// ============================================================================

/**
 * Check if a package name is an ESLint-related package.
 * Used by sync command to filter packages for pre-commit installation.
 */
function isEslintPackage(pkg: string): boolean {
  return (
    pkg.startsWith('eslint') ||
    pkg.startsWith('@eslint/') ||
    pkg.startsWith('@microsoft/eslint') ||
    pkg.startsWith('@next/eslint') ||
    pkg.startsWith('@vitest/eslint') ||
    pkg.startsWith('@electron-toolkit/eslint') ||
    pkg === 'typescript-eslint'
  );
}

/**
 * Get ESLint packages from schema base packages.
 * Single source of truth - no separate list to maintain.
 */
export function getBaseEslintPackages(): string[] {
  return SAFEWORD_SCHEMA.packages.base.filter(pkg => isEslintPackage(pkg));
}

/**
 * Get conditional ESLint packages for a specific project type key.
 */
export function getConditionalEslintPackages(key: string): string[] {
  const deps = SAFEWORD_SCHEMA.packages.conditional[key];
  return deps ? deps.filter(pkg => isEslintPackage(pkg)) : [];
}

export const SAFEWORD_SCHEMA: SafewordSchema = {
  version: VERSION,

  // Directories fully owned by safeword (created on setup, deleted on reset)
  ownedDirs: [
    '.safeword',
    '.safeword/hooks',
    '.safeword/hooks/cursor',
    '.safeword/lib',
    '.safeword/guides',
    '.safeword/templates',
    '.safeword/prompts',
    '.safeword/planning',
    '.safeword/planning/specs',
    '.safeword/planning/test-definitions',
    '.safeword/planning/design',
    '.safeword/planning/issues',
    '.safeword/scripts',
    '.husky',
    '.cursor',
    '.cursor/rules',
    '.cursor/commands',
  ],

  // Directories we add to but don't own (not deleted on reset)
  sharedDirs: ['.claude', '.claude/skills', '.claude/commands'],

  // Created on setup but NOT deleted on reset (preserves user data)
  preservedDirs: [
    '.safeword/learnings',
    '.safeword/tickets',
    '.safeword/tickets/completed',
    '.safeword/logs',
  ],

  // Files to delete on upgrade (renamed or removed in newer versions)
  deprecatedFiles: ['.safeword/templates/user-stories-template.md'],

  // Files owned by safeword (overwritten on upgrade if content changed)
  ownedFiles: {
    // Core files
    '.safeword/SAFEWORD.md': { template: 'SAFEWORD.md' },
    '.safeword/version': { content: () => VERSION },
    '.safeword/eslint-boundaries.config.mjs': {
      generator: ctx => generateBoundariesConfig(detectArchitecture(ctx.cwd)),
    },

    // Hooks (7 files)
    '.safeword/hooks/session-verify-agents.sh': { template: 'hooks/session-verify-agents.sh' },
    '.safeword/hooks/session-version.sh': { template: 'hooks/session-version.sh' },
    '.safeword/hooks/session-lint-check.sh': { template: 'hooks/session-lint-check.sh' },
    '.safeword/hooks/prompt-timestamp.sh': { template: 'hooks/prompt-timestamp.sh' },
    '.safeword/hooks/prompt-questions.sh': { template: 'hooks/prompt-questions.sh' },
    '.safeword/hooks/post-tool-lint.sh': { template: 'hooks/post-tool-lint.sh' },
    '.safeword/hooks/stop-quality.sh': { template: 'hooks/stop-quality.sh' },

    // Lib (2 files)
    '.safeword/lib/common.sh': { template: 'lib/common.sh' },
    '.safeword/lib/jq-fallback.sh': { template: 'lib/jq-fallback.sh' },

    // Guides (13 files)
    '.safeword/guides/architecture-guide.md': { template: 'guides/architecture-guide.md' },
    '.safeword/guides/cli-reference.md': { template: 'guides/cli-reference.md' },
    '.safeword/guides/code-philosophy.md': { template: 'guides/code-philosophy.md' },
    '.safeword/guides/context-files-guide.md': { template: 'guides/context-files-guide.md' },
    '.safeword/guides/data-architecture-guide.md': {
      template: 'guides/data-architecture-guide.md',
    },
    '.safeword/guides/design-doc-guide.md': { template: 'guides/design-doc-guide.md' },
    '.safeword/guides/development-workflow.md': { template: 'guides/development-workflow.md' },
    '.safeword/guides/learning-extraction.md': { template: 'guides/learning-extraction.md' },
    '.safeword/guides/llm-guide.md': { template: 'guides/llm-guide.md' },
    '.safeword/guides/tdd-best-practices.md': { template: 'guides/tdd-best-practices.md' },
    '.safeword/guides/test-definitions-guide.md': { template: 'guides/test-definitions-guide.md' },
    '.safeword/guides/user-story-guide.md': { template: 'guides/user-story-guide.md' },
    '.safeword/guides/zombie-process-cleanup.md': { template: 'guides/zombie-process-cleanup.md' },

    // Templates (7 files)
    '.safeword/templates/architecture-template.md': {
      template: 'doc-templates/architecture-template.md',
    },
    '.safeword/templates/design-doc-template.md': {
      template: 'doc-templates/design-doc-template.md',
    },
    '.safeword/templates/task-spec-template.md': {
      template: 'doc-templates/task-spec-template.md',
    },
    '.safeword/templates/test-definitions-feature.md': {
      template: 'doc-templates/test-definitions-feature.md',
    },
    '.safeword/templates/ticket-template.md': { template: 'doc-templates/ticket-template.md' },
    '.safeword/templates/feature-spec-template.md': {
      template: 'doc-templates/feature-spec-template.md',
    },
    '.safeword/templates/work-log-template.md': { template: 'doc-templates/work-log-template.md' },

    // Prompts (2 files)
    '.safeword/prompts/architecture.md': { template: 'prompts/architecture.md' },
    '.safeword/prompts/quality-review.md': { template: 'prompts/quality-review.md' },

    // Scripts (3 files)
    '.safeword/scripts/bisect-test-pollution.sh': { template: 'scripts/bisect-test-pollution.sh' },
    '.safeword/scripts/bisect-zombie-processes.sh': {
      template: 'scripts/bisect-zombie-processes.sh',
    },
    '.safeword/scripts/lint-md.sh': { template: 'scripts/lint-md.sh' },

    // Claude skills and commands (6 files)
    '.claude/skills/safeword-quality-reviewer/SKILL.md': {
      template: 'skills/safeword-quality-reviewer/SKILL.md',
    },
    '.claude/skills/safeword-systematic-debugger/SKILL.md': {
      template: 'skills/safeword-systematic-debugger/SKILL.md',
    },
    '.claude/skills/safeword-tdd-enforcer/SKILL.md': {
      template: 'skills/safeword-tdd-enforcer/SKILL.md',
    },
    '.claude/commands/architecture.md': { template: 'commands/architecture.md' },
    '.claude/commands/lint.md': { template: 'commands/lint.md' },
    '.claude/commands/quality-review.md': { template: 'commands/quality-review.md' },

    // Husky (1 file)
    '.husky/pre-commit': { content: HUSKY_PRE_COMMIT_CONTENT },

    // Cursor rules (1 file)
    '.cursor/rules/safeword-core.mdc': { template: 'cursor/rules/safeword-core.mdc' },

    // Cursor commands (3 files - same as Claude)
    '.cursor/commands/lint.md': { template: 'commands/lint.md' },
    '.cursor/commands/quality-review.md': { template: 'commands/quality-review.md' },
    '.cursor/commands/architecture.md': { template: 'commands/architecture.md' },

    // Cursor hooks adapters (2 files)
    '.safeword/hooks/cursor/after-file-edit.sh': { template: 'hooks/cursor/after-file-edit.sh' },
    '.safeword/hooks/cursor/stop.sh': { template: 'hooks/cursor/stop.sh' },
  },

  // Files created if missing, updated only if content matches current template
  managedFiles: {
    'eslint.config.mjs': {
      generator: () => getEslintConfig({ boundaries: true }),
    },
    '.prettierrc': { generator: ctx => getPrettierConfig(ctx.projectType) },
    '.markdownlint-cli2.jsonc': { template: 'markdownlint-cli2.jsonc' },
  },

  // JSON files where we merge specific keys
  jsonMerges: {
    'package.json': {
      keys: [
        'scripts.lint',
        'scripts.lint:md',
        'scripts.format',
        'scripts.format:check',
        'scripts.knip',
        'scripts.prepare',
        'lint-staged',
      ],
      conditionalKeys: {
        publishableLibrary: ['scripts.publint'],
        shell: ['scripts.lint:sh'],
      },
      merge: (existing, ctx) => {
        const scripts = (existing.scripts as Record<string, string>) ?? {};
        const result = { ...existing };

        // Add scripts if not present
        if (!scripts.lint) scripts.lint = 'eslint .';
        if (!scripts['lint:md']) scripts['lint:md'] = 'markdownlint-cli2 "**/*.md" "#node_modules"';
        if (!scripts.format) scripts.format = 'prettier --write .';
        if (!scripts['format:check']) scripts['format:check'] = 'prettier --check .';
        if (!scripts.knip) scripts.knip = 'knip';
        if (!scripts.prepare) scripts.prepare = 'husky || true';

        // Conditional: publint for publishable libraries
        if (ctx.projectType.publishableLibrary && !scripts.publint) {
          scripts.publint = 'publint';
        }

        // Conditional: lint:sh for projects with shell scripts
        if (ctx.projectType.shell && !scripts['lint:sh']) {
          scripts['lint:sh'] = 'shellcheck **/*.sh';
        }

        result.scripts = scripts;

        // Add lint-staged config
        if (!existing['lint-staged']) {
          result['lint-staged'] = getLintStagedConfig(ctx.projectType);
        }

        return result;
      },
      unmerge: existing => {
        const result = { ...existing };
        const scripts = { ...(existing.scripts as Record<string, string>) };

        // Remove safeword-specific scripts but preserve lint/format (useful standalone)
        delete scripts['lint:md'];
        delete scripts['lint:sh'];
        delete scripts['format:check'];
        delete scripts.knip;
        delete scripts.prepare;
        delete scripts.publint;

        if (Object.keys(scripts).length > 0) {
          result.scripts = scripts;
        } else {
          delete result.scripts;
        }

        delete result['lint-staged'];

        return result;
      },
    },

    '.claude/settings.json': {
      keys: ['hooks'],
      merge: existing => {
        // Preserve non-safeword hooks while adding/updating safeword hooks
        const existingHooks = (existing.hooks as Record<string, unknown[]>) ?? {};
        const mergedHooks: Record<string, unknown[]> = { ...existingHooks };

        for (const [event, newHooks] of Object.entries(SETTINGS_HOOKS)) {
          const eventHooks = (mergedHooks[event] as unknown[]) ?? [];
          const nonSafewordHooks = filterOutSafewordHooks(eventHooks);
          mergedHooks[event] = [...nonSafewordHooks, ...newHooks];
        }

        return { ...existing, hooks: mergedHooks };
      },
      unmerge: existing => {
        // Remove only safeword hooks, preserve custom hooks
        const existingHooks = (existing.hooks as Record<string, unknown[]>) ?? {};
        const cleanedHooks: Record<string, unknown[]> = {};

        for (const [event, eventHooks] of Object.entries(existingHooks)) {
          const nonSafewordHooks = filterOutSafewordHooks(eventHooks as unknown[]);
          if (nonSafewordHooks.length > 0) {
            cleanedHooks[event] = nonSafewordHooks;
          }
        }

        const result = { ...existing };
        if (Object.keys(cleanedHooks).length > 0) {
          result.hooks = cleanedHooks;
        } else {
          delete result.hooks;
        }
        return result;
      },
    },

    '.mcp.json': {
      keys: ['mcpServers.context7', 'mcpServers.playwright'],
      removeFileIfEmpty: true,
      merge: existing => {
        const mcpServers = (existing.mcpServers as Record<string, unknown>) ?? {};
        return {
          ...existing,
          mcpServers: {
            ...mcpServers,
            context7: MCP_SERVERS.context7,
            playwright: MCP_SERVERS.playwright,
          },
        };
      },
      unmerge: existing => {
        const result = { ...existing };
        const mcpServers = { ...(existing.mcpServers as Record<string, unknown>) };

        delete mcpServers.context7;
        delete mcpServers.playwright;

        if (Object.keys(mcpServers).length > 0) {
          result.mcpServers = mcpServers;
        } else {
          delete result.mcpServers;
        }

        return result;
      },
    },

    '.cursor/mcp.json': {
      keys: ['mcpServers.context7', 'mcpServers.playwright'],
      removeFileIfEmpty: true,
      merge: existing => {
        const mcpServers = (existing.mcpServers as Record<string, unknown>) ?? {};
        return {
          ...existing,
          mcpServers: {
            ...mcpServers,
            context7: MCP_SERVERS.context7,
            playwright: MCP_SERVERS.playwright,
          },
        };
      },
      unmerge: existing => {
        const result = { ...existing };
        const mcpServers = { ...(existing.mcpServers as Record<string, unknown>) };

        delete mcpServers.context7;
        delete mcpServers.playwright;

        if (Object.keys(mcpServers).length > 0) {
          result.mcpServers = mcpServers;
        } else {
          delete result.mcpServers;
        }

        return result;
      },
    },

    '.cursor/hooks.json': {
      keys: ['version', 'hooks.afterFileEdit', 'hooks.stop'],
      removeFileIfEmpty: true,
      merge: existing => {
        const hooks = (existing.hooks as Record<string, unknown[]>) ?? {};
        return {
          ...existing,
          version: 1, // Required by Cursor
          hooks: {
            ...hooks,
            ...CURSOR_HOOKS,
          },
        };
      },
      unmerge: existing => {
        const result = { ...existing };
        const hooks = { ...(existing.hooks as Record<string, unknown[]>) };

        delete hooks.afterFileEdit;
        delete hooks.stop;

        if (Object.keys(hooks).length > 0) {
          result.hooks = hooks;
        } else {
          delete result.hooks;
          delete result.version;
        }

        return result;
      },
    },
  },

  // Text files where we patch specific content
  textPatches: {
    'AGENTS.md': {
      operation: 'prepend',
      content: AGENTS_MD_LINK,
      marker: '@./.safeword/SAFEWORD.md',
      createIfMissing: true,
    },
    'CLAUDE.md': {
      operation: 'prepend',
      content: AGENTS_MD_LINK,
      marker: '@./.safeword/SAFEWORD.md',
      createIfMissing: false, // Only patch if exists, don't create (AGENTS.md is primary)
    },
  },

  // NPM packages to install
  packages: {
    base: [
      'eslint',
      'prettier',
      '@eslint/js',
      'eslint-plugin-import-x',
      'eslint-import-resolver-typescript',
      'eslint-plugin-sonarjs',
      'eslint-plugin-unicorn',
      'eslint-plugin-boundaries',
      'eslint-plugin-playwright',
      '@microsoft/eslint-plugin-sdl',
      'eslint-config-prettier',
      'markdownlint-cli2',
      'knip',
      'husky',
      'lint-staged',
    ],
    conditional: {
      typescript: ['typescript-eslint'],
      react: ['eslint-plugin-react', 'eslint-plugin-react-hooks', 'eslint-plugin-jsx-a11y'],
      nextjs: ['@next/eslint-plugin-next'],
      astro: ['eslint-plugin-astro', 'prettier-plugin-astro'],
      vue: ['eslint-plugin-vue'],
      svelte: ['eslint-plugin-svelte', 'prettier-plugin-svelte'],
      electron: ['@electron-toolkit/eslint-config'],
      vitest: ['@vitest/eslint-plugin'],
      tailwind: ['prettier-plugin-tailwindcss'],
      publishableLibrary: ['publint'],
      shell: ['shellcheck', 'prettier-plugin-sh'],
    },
  },
};
