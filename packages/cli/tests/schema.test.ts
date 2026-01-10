/**
 * Test Suite: Schema Validation
 *
 * Tests that SAFEWORD_SCHEMA is the single source of truth.
 * Every template file must have a schema entry, no orphans.
 *
 * TDD RED phase - these tests should FAIL until src/schema.ts is implemented.
 */

import { readdirSync, statSync } from 'node:fs';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

// Type guard for filtering out undefined values
const isDefined = <T>(x: T | undefined): x is T => x !== undefined;

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

// This import will fail until schema.ts is created (RED phase)
// import { SAFEWORD_SCHEMA } from '../src/schema.js';

describe('Schema - Single Source of Truth', () => {
  // Helper to collect all files in templates/ directory
  /**
   *
   * @param dir
   * @param prefix
   */
  function collectTemplateFiles(dir: string, prefix = ''): string[] {
    const files: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const fullPath = nodePath.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip _shared directories - they contain include files, not installable templates
        if (entry.name.startsWith('_')) continue;
        files.push(...collectTemplateFiles(fullPath, relativePath));
      } else {
        files.push(relativePath);
      }
    }

    return files;
  }

  const templatesDirectory = nodePath.join(__dirname, '../templates');

  describe('ownedDirs', () => {
    it('should include all required .safeword subdirectories', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      const required = [
        '.safeword',
        '.safeword/hooks',
        '.safeword/hooks/cursor',
        '.safeword/hooks/lib',
        '.safeword/scripts',
        '.safeword/guides',
        '.safeword/templates',
        '.safeword/prompts',
        '.cursor',
        '.cursor/rules',
        '.cursor/commands',
      ];

      for (const dir of required) {
        expect(SAFEWORD_SCHEMA.ownedDirs).toContain(dir);
      }
    });

    it('should NOT include deprecated planning directories', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      const deprecated = [
        '.safeword/planning',
        '.safeword/planning/specs',
        '.safeword/planning/test-definitions',
        '.safeword/planning/design',
        '.safeword/planning/issues',
        '.safeword/planning/plans',
      ];

      for (const dir of deprecated) {
        expect(SAFEWORD_SCHEMA.ownedDirs).not.toContain(dir);
      }
    });
  });

  describe('sharedDirs', () => {
    it('should include .claude directories', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.sharedDirs).toContain('.claude');
      expect(SAFEWORD_SCHEMA.sharedDirs).toContain('.claude/skills');
      expect(SAFEWORD_SCHEMA.sharedDirs).toContain('.claude/commands');
    });
  });

  describe('preservedDirs', () => {
    it('should preserve user content directories', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.preservedDirs).toContain('.safeword/learnings');
      expect(SAFEWORD_SCHEMA.preservedDirs).toContain('.safeword/logs');
      expect(SAFEWORD_SCHEMA.preservedDirs).toContain('.safeword-project/tickets');
      expect(SAFEWORD_SCHEMA.preservedDirs).toContain('.safeword-project/tickets/completed');
      expect(SAFEWORD_SCHEMA.preservedDirs).toContain('.safeword-project/tmp');
    });

    it('should NOT include old .safeword/tickets paths', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.preservedDirs).not.toContain('.safeword/tickets');
      expect(SAFEWORD_SCHEMA.preservedDirs).not.toContain('.safeword/tickets/completed');
    });
  });

  describe('deprecatedDirs', () => {
    it('should include old planning and tickets directories', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.deprecatedDirs).toContain('.safeword/planning');
      expect(SAFEWORD_SCHEMA.deprecatedDirs).toContain('.safeword/tickets');
    });
  });

  describe('ownedFiles', () => {
    it('should have entry for every template file', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      const templateFiles = collectTemplateFiles(templatesDirectory);

      const schemaFiles = Object.keys(SAFEWORD_SCHEMA.ownedFiles);

      // Check every template file has a schema entry
      for (const templateFile of templateFiles) {
        const hasEntry = schemaFiles.some(
          schemaPath =>
            schemaPath.endsWith(templateFile) ||
            templateFile.includes(schemaPath.split('/').pop() || ''),
        );

        if (!hasEntry) {
          expect.fail(`Template file '${templateFile}' has no schema entry in ownedFiles`);
        }
      }
    });

    it('should not have orphan schema entries (files that do not exist)', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      // Files that are generated (not from templates)
      const generatedFiles = new Set(['.safeword/version']);

      for (const [path, definition] of Object.entries(SAFEWORD_SCHEMA.ownedFiles)) {
        if (generatedFiles.has(path)) continue;

        // If it has a template reference, verify template exists
        if (definition.template) {
          const templatePath = nodePath.join(templatesDirectory, definition.template);
          const exists = (() => {
            try {
              statSync(templatePath);
              return true;
            } catch {
              return false;
            }
          })();

          if (!exists) {
            expect.fail(
              `Schema entry '${path}' references template '${definition.template}' which does not exist`,
            );
          }
        }
      }
    });
  });

  describe('managedFiles', () => {
    it('should include eslint.config.mjs, tsconfig.json, knip.json, and .prettierrc', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      // Note: toHaveProperty interprets "." as nested path, use `in` operator instead
      expect('eslint.config.mjs' in SAFEWORD_SCHEMA.managedFiles).toBe(true);
      expect('tsconfig.json' in SAFEWORD_SCHEMA.managedFiles).toBe(true);
      expect('knip.json' in SAFEWORD_SCHEMA.managedFiles).toBe(true);
      expect('.prettierrc' in SAFEWORD_SCHEMA.managedFiles).toBe(true);
    });
  });

  describe('jsonMerges', () => {
    it('should include package.json, .claude/settings.json, .mcp.json, Cursor configs, and .prettierrc', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      // Note: toHaveProperty interprets "." and "/" as nested path, use `in` operator instead
      expect('package.json' in SAFEWORD_SCHEMA.jsonMerges).toBe(true);
      expect('.claude/settings.json' in SAFEWORD_SCHEMA.jsonMerges).toBe(true);
      expect('.mcp.json' in SAFEWORD_SCHEMA.jsonMerges).toBe(true);
      expect('.cursor/mcp.json' in SAFEWORD_SCHEMA.jsonMerges).toBe(true);
      expect('.cursor/hooks.json' in SAFEWORD_SCHEMA.jsonMerges).toBe(true);
      // .prettierrc is in jsonMerges for uninstall cleanup (removes plugins key)
      expect('.prettierrc' in SAFEWORD_SCHEMA.jsonMerges).toBe(true);
    });
  });

  describe('textPatches', () => {
    it('should include AGENTS.md patch (creates if missing)', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      // Note: toHaveProperty interprets "." as nested path, use `in` operator instead
      expect('AGENTS.md' in SAFEWORD_SCHEMA.textPatches).toBe(true);
      expect(SAFEWORD_SCHEMA.textPatches['AGENTS.md'].operation).toBe('prepend');
      expect(SAFEWORD_SCHEMA.textPatches['AGENTS.md'].createIfMissing).toBe(true);
    });

    it('should include CLAUDE.md patch (only if exists)', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      // Note: toHaveProperty interprets "." as nested path, use `in` operator instead
      expect('CLAUDE.md' in SAFEWORD_SCHEMA.textPatches).toBe(true);
      expect(SAFEWORD_SCHEMA.textPatches['CLAUDE.md'].operation).toBe('prepend');
      expect(SAFEWORD_SCHEMA.textPatches['CLAUDE.md'].createIfMissing).toBe(false);
    });
  });

  describe('packages', () => {
    it('should include all required base packages', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      const required = [
        'eslint',
        'safeword', // bundles eslint-config-prettier + all ESLint plugins
        'dependency-cruiser',
        'knip',
      ];

      for (const pkg of required) {
        expect(SAFEWORD_SCHEMA.packages.base).toContain(pkg);
      }
    });

    it('should have prettier in standard conditional (non-Biome projects)', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.packages.conditional).toHaveProperty('standard');
      expect(SAFEWORD_SCHEMA.packages.conditional.standard).toContain('prettier');
    });

    it('should have conditional packages for frameworks not in safeword plugin', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      // These frameworks are NOT in eslint-plugin-safeword (or need prettier plugins)
      const requiredConditions = [
        'astro', // prettier-plugin-astro (ESLint rules are in safeword)
        'tailwind', // prettier-plugin-tailwindcss
        'publishableLibrary', // publint
        'shellcheck', // shellcheck for shell scripts
      ];

      for (const condition of requiredConditions) {
        expect(SAFEWORD_SCHEMA.packages.conditional).toHaveProperty(condition);
      }
    });
  });

  describe('Claude/Cursor parity', () => {
    it('should have matching skills for Claude and Cursor (excluding core)', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      // Extract skill names from schema paths
      const claudeSkills = Object.keys(SAFEWORD_SCHEMA.ownedFiles)
        .filter(path => path.startsWith('.claude/skills/safeword-'))
        .map(path => /safeword-([^/]+)/.exec(path)?.[1])
        .filter(isDefined)
        .toSorted((a, b) => a.localeCompare(b));

      const cursorRules = Object.keys(SAFEWORD_SCHEMA.ownedFiles)
        .filter(path => path.startsWith('.cursor/rules/safeword-') && !path.includes('core'))
        .map(path => /safeword-([^.]+)/.exec(path)?.[1])
        .filter(isDefined)
        .toSorted((a, b) => a.localeCompare(b));

      // Both should have the same skills
      expect(cursorRules).toEqual(claudeSkills);
    });

    it('should have matching commands for Claude and Cursor', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      // Extract command names from schema paths
      const claudeCommands = Object.keys(SAFEWORD_SCHEMA.ownedFiles)
        .filter(path => path.startsWith('.claude/commands/'))
        .map(path => path.split('/').pop())
        .filter(isDefined)
        .toSorted((a, b) => a.localeCompare(b));

      const cursorCommands = Object.keys(SAFEWORD_SCHEMA.ownedFiles)
        .filter(path => path.startsWith('.cursor/commands/'))
        .map(path => path.split('/').pop())
        .filter(isDefined)
        .toSorted((a, b) => a.localeCompare(b));

      // Both should have the same commands
      expect(cursorCommands).toEqual(claudeCommands);
    });
  });
});
