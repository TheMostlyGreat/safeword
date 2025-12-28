/**
 * SAFEWORD Schema - Single Source of Truth
 *
 * All files, directories, configurations, and packages managed by safeword
 * are defined here. Commands use this schema via the reconciliation engine.
 *
 * Adding a new file? Add it here and it will be handled by setup/upgrade/reset.
 */

import { CURSOR_HOOKS, getEslintConfig, SETTINGS_HOOKS } from './templates/config.js';
import { AGENTS_MD_LINK } from './templates/content.js';
import { filterOutSafewordHooks } from './utils/hooks.js';
import { MCP_SERVERS } from './utils/install.js';
import { type Languages, type ProjectType } from './utils/project-detector.js';
import { VERSION } from './version.js';

// ============================================================================
// Interfaces
// ============================================================================

export interface ProjectContext {
  cwd: string;
  projectType: ProjectType;
  developmentDeps: Record<string, string>;
  isGitRepo: boolean;
  /** Languages detected in project (for conditional file generation) */
  languages?: Languages;
}

export interface FileDefinition {
  template?: string; // Path in templates/ dir
  content?: string | (() => string); // Static content or factory
  generator?: (ctx: ProjectContext) => string | null; // Dynamic generator, null = skip file
}

// managedFiles: created if missing, updated only if content === current template output
export type ManagedFileDefinition = FileDefinition;

export interface JsonMergeDefinition {
  keys: string[]; // Dot-notation keys we manage
  conditionalKeys?: Record<string, string[]>; // Keys added based on project type
  merge: (existing: Record<string, unknown>, ctx: ProjectContext) => Record<string, unknown>;
  unmerge: (existing: Record<string, unknown>) => Record<string, unknown>;
  removeFileIfEmpty?: boolean; // Delete file if our keys were the only content
  skipIfMissing?: boolean; // Don't create file if it doesn't exist (for optional integrations)
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
  deprecatedPackages: string[]; // Packages to uninstall on upgrade (consolidated into safeword plugin)
  deprecatedDirs: string[]; // Directories to delete on upgrade (no longer managed)
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
// Shared merge definitions
// ============================================================================

/**
 * Biome config merge - adds safeword files to excludes list.
 * Biome v2 uses `includes` with `!` prefix for exclusions.
 */
const BIOME_JSON_MERGE: JsonMergeDefinition = {
  keys: ['files.includes'],
  skipIfMissing: true, // Only modify if project already uses Biome
  merge: existing => {
    const files = (existing.files as Record<string, unknown>) ?? {};
    const existingIncludes = Array.isArray(files.includes) ? files.includes : [];

    // Add safeword exclusions (! prefix) if not already present
    // Note: Biome v2.2.0+ doesn't need /** for folders
    const safewordExcludes = ['!eslint.config.mjs', '!.safeword'];
    const newIncludes = [...existingIncludes];
    for (const exclude of safewordExcludes) {
      if (!newIncludes.includes(exclude)) {
        newIncludes.push(exclude);
      }
    }

    return {
      ...existing,
      files: {
        ...files,
        includes: newIncludes,
      },
    };
  },
  unmerge: existing => {
    const result = { ...existing };
    const files = (existing.files as Record<string, unknown>) ?? {};
    const existingIncludes = Array.isArray(files.includes) ? files.includes : [];

    // Remove safeword exclusions from includes list
    const safewordExcludes = new Set(['!eslint.config.mjs', '!.safeword', '!.safeword/**']);
    const cleanedIncludes = existingIncludes.filter(
      (entry: string) => !safewordExcludes.has(entry),
    );

    if (cleanedIncludes.length > 0) {
      files.includes = cleanedIncludes;
      result.files = files;
    } else {
      delete files.includes;
      if (Object.keys(files).length > 0) {
        result.files = files;
      } else {
        delete result.files;
      }
    }

    return result;
  },
};

// ============================================================================
// SAFEWORD_SCHEMA - The Single Source of Truth
// ============================================================================

export const SAFEWORD_SCHEMA: SafewordSchema = {
  version: VERSION,

  // Directories fully owned by safeword (created on setup, deleted on reset)
  ownedDirs: [
    '.safeword',
    '.safeword/hooks',
    '.safeword/hooks/cursor',
    '.safeword/hooks/lib',
    '.safeword/guides',
    '.safeword/templates',
    '.safeword/prompts',
    '.safeword/planning',
    '.safeword/planning/specs',
    '.safeword/planning/test-definitions',
    '.safeword/planning/design',
    '.safeword/planning/issues',
    '.safeword/planning/plans',
    '.safeword/scripts',
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
  deprecatedFiles: [
    '.safeword/templates/user-stories-template.md',
    // Consolidated into planning-guide.md and testing-guide.md (v0.8.0)
    '.safeword/guides/development-workflow.md',
    '.safeword/guides/tdd-best-practices.md',
    '.safeword/guides/user-story-guide.md',
    '.safeword/guides/test-definitions-guide.md',
    // Boundaries config now project-specific (v0.9.0)
    '.safeword/eslint-boundaries.config.mjs',
    // Shell hooks replaced with TypeScript/Bun (v0.13.0)
    '.safeword/hooks/session-verify-agents.sh',
    '.safeword/hooks/session-version.sh',
    '.safeword/hooks/session-lint-check.sh',
    '.safeword/hooks/prompt-timestamp.sh',
    '.safeword/hooks/prompt-questions.sh',
    '.safeword/hooks/post-tool-lint.sh',
    '.safeword/hooks/stop-quality.sh',
    '.safeword/hooks/cursor/after-file-edit.sh',
    '.safeword/hooks/cursor/stop.sh',
    // Shell libraries no longer needed with Bun
    '.safeword/lib/common.sh',
    '.safeword/lib/jq-fallback.sh',
  ],

  // Packages to uninstall on upgrade (now bundled in eslint-plugin-safeword)
  deprecatedPackages: [
    // Individual ESLint plugins now bundled in eslint-plugin-safeword
    '@eslint/js',
    'eslint-plugin-import-x',
    'eslint-import-resolver-typescript',
    'eslint-plugin-sonarjs',
    'eslint-plugin-unicorn',
    'eslint-plugin-boundaries',
    'eslint-plugin-playwright',
    'eslint-plugin-promise',
    'eslint-plugin-regexp',
    'eslint-plugin-jsdoc',
    'eslint-plugin-simple-import-sort',
    'eslint-plugin-security',
    // Conditional ESLint plugins now in safeword
    'typescript-eslint',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'eslint-plugin-jsx-a11y',
    '@next/eslint-plugin-next',
    'eslint-plugin-astro',
    '@vitest/eslint-plugin',
    // Pre-commit hooks no longer managed by safeword
    'husky',
    'lint-staged',
  ],

  // Directories to delete on upgrade (no longer managed by safeword)
  deprecatedDirs: [
    '.husky', // Pre-commit hooks no longer managed by safeword
    '.safeword/lib', // Shell libraries no longer needed with Bun (v0.13.0)
  ],

  // Files owned by safeword (overwritten on upgrade if content changed)
  ownedFiles: {
    // Core files
    '.safeword/SAFEWORD.md': { template: 'SAFEWORD.md' },
    '.safeword/version': { content: () => VERSION },

    // Hooks shared library (2 files) - TypeScript with Bun runtime
    '.safeword/hooks/lib/lint.ts': { template: 'hooks/lib/lint.ts' },
    '.safeword/hooks/lib/quality.ts': { template: 'hooks/lib/quality.ts' },

    // Hooks (7 files) - TypeScript with Bun runtime
    '.safeword/hooks/session-verify-agents.ts': { template: 'hooks/session-verify-agents.ts' },
    '.safeword/hooks/session-version.ts': { template: 'hooks/session-version.ts' },
    '.safeword/hooks/session-lint-check.ts': { template: 'hooks/session-lint-check.ts' },
    '.safeword/hooks/prompt-timestamp.ts': { template: 'hooks/prompt-timestamp.ts' },
    '.safeword/hooks/prompt-questions.ts': { template: 'hooks/prompt-questions.ts' },
    '.safeword/hooks/post-tool-lint.ts': { template: 'hooks/post-tool-lint.ts' },
    '.safeword/hooks/stop-quality.ts': { template: 'hooks/stop-quality.ts' },

    // Guides (11 files)
    '.safeword/guides/architecture-guide.md': { template: 'guides/architecture-guide.md' },
    '.safeword/guides/cli-reference.md': { template: 'guides/cli-reference.md' },
    '.safeword/guides/code-philosophy.md': { template: 'guides/code-philosophy.md' },
    '.safeword/guides/context-files-guide.md': { template: 'guides/context-files-guide.md' },
    '.safeword/guides/data-architecture-guide.md': {
      template: 'guides/data-architecture-guide.md',
    },
    '.safeword/guides/design-doc-guide.md': { template: 'guides/design-doc-guide.md' },
    '.safeword/guides/learning-extraction.md': { template: 'guides/learning-extraction.md' },
    '.safeword/guides/llm-guide.md': { template: 'guides/llm-guide.md' },
    '.safeword/guides/planning-guide.md': { template: 'guides/planning-guide.md' },
    '.safeword/guides/testing-guide.md': { template: 'guides/testing-guide.md' },
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
    '.safeword/scripts/cleanup-zombies.sh': { template: 'scripts/cleanup-zombies.sh' },

    // Claude skills and commands (9 files)
    '.claude/skills/safeword-brainstorming/SKILL.md': {
      template: 'skills/safeword-brainstorming/SKILL.md',
    },
    '.claude/skills/safeword-debugging/SKILL.md': {
      template: 'skills/safeword-debugging/SKILL.md',
    },
    '.claude/skills/safeword-enforcing-tdd/SKILL.md': {
      template: 'skills/safeword-enforcing-tdd/SKILL.md',
    },
    '.claude/skills/safeword-quality-reviewing/SKILL.md': {
      template: 'skills/safeword-quality-reviewing/SKILL.md',
    },
    '.claude/skills/safeword-refactoring/SKILL.md': {
      template: 'skills/safeword-refactoring/SKILL.md',
    },
    '.claude/skills/safeword-writing-plans/SKILL.md': {
      template: 'skills/safeword-writing-plans/SKILL.md',
    },
    '.claude/commands/architecture.md': { template: 'commands/architecture.md' },
    '.claude/commands/audit.md': { template: 'commands/audit.md' },
    '.claude/commands/cleanup-zombies.md': { template: 'commands/cleanup-zombies.md' },
    '.claude/commands/lint.md': { template: 'commands/lint.md' },
    '.claude/commands/quality-review.md': { template: 'commands/quality-review.md' },

    // Cursor rules (7 files)
    '.cursor/rules/safeword-core.mdc': { template: 'cursor/rules/safeword-core.mdc' },
    '.cursor/rules/safeword-brainstorming.mdc': {
      template: 'cursor/rules/safeword-brainstorming.mdc',
    },
    '.cursor/rules/safeword-debugging.mdc': {
      template: 'cursor/rules/safeword-debugging.mdc',
    },
    '.cursor/rules/safeword-enforcing-tdd.mdc': {
      template: 'cursor/rules/safeword-enforcing-tdd.mdc',
    },
    '.cursor/rules/safeword-quality-reviewing.mdc': {
      template: 'cursor/rules/safeword-quality-reviewing.mdc',
    },
    '.cursor/rules/safeword-refactoring.mdc': {
      template: 'cursor/rules/safeword-refactoring.mdc',
    },
    '.cursor/rules/safeword-writing-plans.mdc': {
      template: 'cursor/rules/safeword-writing-plans.mdc',
    },

    // Cursor commands (5 files - same as Claude)
    '.cursor/commands/architecture.md': { template: 'commands/architecture.md' },
    '.cursor/commands/audit.md': { template: 'commands/audit.md' },
    '.cursor/commands/cleanup-zombies.md': { template: 'commands/cleanup-zombies.md' },
    '.cursor/commands/lint.md': { template: 'commands/lint.md' },
    '.cursor/commands/quality-review.md': { template: 'commands/quality-review.md' },

    // Cursor hooks adapters (2 files) - TypeScript with Bun runtime
    '.safeword/hooks/cursor/after-file-edit.ts': { template: 'hooks/cursor/after-file-edit.ts' },
    '.safeword/hooks/cursor/stop.ts': { template: 'hooks/cursor/stop.ts' },
  },

  // Files created if missing, updated only if content matches current template
  managedFiles: {
    'eslint.config.mjs': {
      generator: ctx =>
        ctx.languages?.javascript ? getEslintConfig(ctx.projectType.existingFormatter) : null,
    },
    // Minimal tsconfig for ESLint type-checked linting (only if missing)
    'tsconfig.json': {
      generator: ctx => {
        // Skip for non-JS projects (Python-only)
        if (!ctx.languages?.javascript) return null;
        // Only create for TypeScript projects
        if (!ctx.developmentDeps.typescript && !ctx.developmentDeps['typescript-eslint']) {
          return null;
        }
        return JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              module: 'NodeNext',
              moduleResolution: 'NodeNext',
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              noEmit: true,
            },
            include: ['**/*.ts', '**/*.tsx'],
            exclude: ['node_modules', 'dist', 'build'],
          },
          undefined,
          2,
        );
      },
    },
    // Knip config for dead code detection (used by /audit)
    'knip.json': {
      generator: ctx =>
        ctx.languages?.javascript
          ? JSON.stringify(
              {
                ignore: ['.safeword/**'],
                ignoreDependencies: ['eslint-plugin-safeword'],
              },
              undefined,
              2,
            )
          : null,
    },
  },

  // JSON files where we merge specific keys
  jsonMerges: {
    'package.json': {
      keys: ['scripts.lint', 'scripts.format', 'scripts.format:check', 'scripts.knip'],
      skipIfMissing: true, // Don't create for Python-only projects (no JS tooling)
      conditionalKeys: {
        existingLinter: ['scripts.lint:eslint'], // Projects with existing linter get separate ESLint script
        publishableLibrary: ['scripts.publint'],
        shell: ['scripts.lint:sh'],
      },
      merge: (existing, ctx) => {
        const scripts = { ...(existing.scripts as Record<string, string>) };
        const result = { ...existing };

        if (ctx.projectType.existingLinter) {
          // Project with existing linter: add lint:eslint for safeword-specific rules
          if (!scripts['lint:eslint']) scripts['lint:eslint'] = 'eslint .';
          // Don't touch their existing lint script
        } else {
          // No existing linter: ESLint is the primary linter
          if (!scripts.lint) scripts.lint = 'eslint .';
        }

        if (!ctx.projectType.existingFormatter) {
          // No existing formatter: add Prettier
          if (!scripts.format) scripts.format = 'prettier --write .';
          if (!scripts['format:check']) scripts['format:check'] = 'prettier --check .';
        }

        // Always add knip for dead code detection
        if (!scripts.knip) scripts.knip = 'knip';

        // Conditional: publint for publishable libraries
        if (ctx.projectType.publishableLibrary && !scripts.publint) {
          scripts.publint = 'publint';
        }

        // Conditional: lint:sh for projects with shell scripts
        if (ctx.projectType.shell && !scripts['lint:sh']) {
          scripts['lint:sh'] = 'shellcheck **/*.sh';
        }

        result.scripts = scripts;

        return result;
      },
      unmerge: existing => {
        const result = { ...existing };
        const scripts = { ...(existing.scripts as Record<string, string>) };

        // Remove safeword-specific scripts but preserve lint/format (useful standalone)
        delete scripts['lint:eslint']; // Biome hybrid mode
        delete scripts['lint:sh'];
        delete scripts['format:check'];
        delete scripts.knip;
        delete scripts.publint;

        if (Object.keys(scripts).length > 0) {
          result.scripts = scripts;
        } else {
          delete result.scripts;
        }

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
          const eventHooks = mergedHooks[event] ?? [];
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
          const nonSafewordHooks = filterOutSafewordHooks(eventHooks);
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

    '.prettierrc': {
      keys: ['plugins'],
      merge: (existing, ctx) => {
        const result = { ...existing } as Record<string, unknown>;

        // Set defaults for styling options (only if not present)
        // User customizations are preserved
        if (result.semi === undefined) result.semi = true;
        if (result.singleQuote === undefined) result.singleQuote = true;
        if (result.tabWidth === undefined) result.tabWidth = 2;
        if (result.trailingComma === undefined) result.trailingComma = 'all';
        if (result.printWidth === undefined) result.printWidth = 100;
        if (result.endOfLine === undefined) result.endOfLine = 'lf';
        if (result.useTabs === undefined) result.useTabs = false;
        if (result.bracketSpacing === undefined) result.bracketSpacing = true;
        if (result.arrowParens === undefined) result.arrowParens = 'avoid';

        // Always update plugins based on project type (safeword owns this)
        const plugins: string[] = [];
        if (ctx.projectType.astro) plugins.push('prettier-plugin-astro');
        if (ctx.projectType.shell) plugins.push('prettier-plugin-sh');
        // Tailwind must be last for proper class sorting
        if (ctx.projectType.tailwind) plugins.push('prettier-plugin-tailwindcss');

        if (plugins.length > 0) {
          result.plugins = plugins;
        } else {
          delete result.plugins;
        }

        return result;
      },
      unmerge: existing => {
        const result = { ...existing } as Record<string, unknown>;
        // Only remove plugins (safeword-owned), keep user styling preferences
        delete result.plugins;
        return result;
      },
    },

    // Biome excludes - add safeword files so they don't get linted by Biome/Ultracite
    // Biome v2 uses `includes` with `!` prefix for exclusions (not a separate `ignore` key)
    // Support both biome.json and biome.jsonc
    'biome.json': BIOME_JSON_MERGE,
    'biome.jsonc': BIOME_JSON_MERGE,
  },

  // Text files where we patch specific content
  textPatches: {
    'AGENTS.md': {
      operation: 'prepend',
      content: AGENTS_MD_LINK,
      marker: '.safeword/SAFEWORD.md',
      createIfMissing: true,
    },
    'CLAUDE.md': {
      operation: 'prepend',
      content: AGENTS_MD_LINK,
      marker: '.safeword/SAFEWORD.md',
      createIfMissing: false, // Only patch if exists, don't create (AGENTS.md is primary)
    },
  },

  // NPM packages to install
  packages: {
    base: [
      // Core tools (always needed)
      'eslint',
      // Safeword plugin (bundles eslint-config-prettier + all ESLint plugins)
      'eslint-plugin-safeword',
      // Architecture and dead code tools (used by /audit)
      'dependency-cruiser',
      'knip',
    ],
    conditional: {
      // Prettier (only for projects without existing formatter)
      standard: ['prettier'], // "standard" = !existingFormatter
      // Prettier plugins (only for projects without existing formatter that need them)
      astro: ['prettier-plugin-astro'],
      tailwind: ['prettier-plugin-tailwindcss'],
      shell: ['prettier-plugin-sh'],
      // Non-ESLint tools
      publishableLibrary: ['publint'],
      shellcheck: ['shellcheck'], // Renamed from shell to avoid conflict with prettier-plugin-sh
    },
  },
};
