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

const __filename = fileURLToPath(import.meta.url);
const __dirname = nodePath.dirname(__filename);

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
        files.push(...collectTemplateFiles(fullPath, relativePath));
      } else {
        files.push(relativePath);
      }
    }

    return files;
  }

  const templatesDirectory = nodePath.join(__dirname, '../templates');

  describe('ownedDirs', () => {
    it('should have exactly 17 owned directories', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.ownedDirs.length).toBe(17);
    });

    it('should include all required .safeword subdirectories', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      const required = [
        '.safeword',
        '.safeword/hooks',
        '.safeword/hooks/cursor',
        '.safeword/lib',
        '.safeword/scripts',
        '.safeword/guides',
        '.safeword/templates',
        '.safeword/prompts',
        '.safeword/planning',
        '.safeword/planning/specs',
        '.safeword/planning/test-definitions',
        '.safeword/planning/design',
        '.safeword/planning/issues',
        '.safeword/planning/plans',
        '.cursor',
        '.cursor/rules',
        '.cursor/commands',
      ];

      for (const dir of required) {
        expect(SAFEWORD_SCHEMA.ownedDirs).toContain(dir);
      }
    });
  });

  describe('sharedDirs', () => {
    it('should have exactly 3 shared directories', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.sharedDirs.length).toBe(3);
    });

    it('should include .claude directories', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.sharedDirs).toContain('.claude');
      expect(SAFEWORD_SCHEMA.sharedDirs).toContain('.claude/skills');
      expect(SAFEWORD_SCHEMA.sharedDirs).toContain('.claude/commands');
    });
  });

  describe('preservedDirs', () => {
    it('should have exactly 4 preserved directories', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.preservedDirs.length).toBe(4);
    });

    it('should preserve user content directories', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.preservedDirs).toContain('.safeword/learnings');
      expect(SAFEWORD_SCHEMA.preservedDirs).toContain('.safeword/tickets');
      expect(SAFEWORD_SCHEMA.preservedDirs).toContain('.safeword/tickets/completed');
      expect(SAFEWORD_SCHEMA.preservedDirs).toContain('.safeword/logs');
    });
  });

  describe('ownedFiles', () => {
    it('should have exactly 58 owned files', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(Object.keys(SAFEWORD_SCHEMA.ownedFiles).length).toBe(58);
    });

    it('should have entry for every template file', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      const templateFiles = collectTemplateFiles(templatesDirectory);

      // Exclude markdownlint-cli2.jsonc (it's a managedFile)
      const ownedTemplateFiles = templateFiles.filter(f => f !== 'markdownlint-cli2.jsonc');

      const schemaFiles = Object.keys(SAFEWORD_SCHEMA.ownedFiles);

      // Check every template file has a schema entry
      for (const templateFile of ownedTemplateFiles) {
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
    it('should have exactly 4 managed files', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(Object.keys(SAFEWORD_SCHEMA.managedFiles).length).toBe(4);
    });

    it('should include eslint.config.mjs, .prettierrc, .markdownlint-cli2.jsonc, tsconfig.json', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.managedFiles).toHaveProperty('eslint.config.mjs');
      expect(SAFEWORD_SCHEMA.managedFiles).toHaveProperty('.prettierrc');
      expect(SAFEWORD_SCHEMA.managedFiles).toHaveProperty('.markdownlint-cli2.jsonc');
      expect(SAFEWORD_SCHEMA.managedFiles).toHaveProperty('tsconfig.json');
    });
  });

  describe('jsonMerges', () => {
    it('should have exactly 5 json merge definitions', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(Object.keys(SAFEWORD_SCHEMA.jsonMerges).length).toBe(5);
    });

    it('should include package.json, .claude/settings.json, .mcp.json, and Cursor configs', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.jsonMerges).toHaveProperty('package.json');
      expect(SAFEWORD_SCHEMA.jsonMerges).toHaveProperty('.claude/settings.json');
      expect(SAFEWORD_SCHEMA.jsonMerges).toHaveProperty('.mcp.json');
      expect(SAFEWORD_SCHEMA.jsonMerges).toHaveProperty('.cursor/mcp.json');
      expect(SAFEWORD_SCHEMA.jsonMerges).toHaveProperty('.cursor/hooks.json');
    });
  });

  describe('textPatches', () => {
    it('should have exactly 2 text patches', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(Object.keys(SAFEWORD_SCHEMA.textPatches).length).toBe(2);
    });

    it('should include AGENTS.md patch (creates if missing)', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.textPatches).toHaveProperty('AGENTS.md');
      expect(SAFEWORD_SCHEMA.textPatches['AGENTS.md'].operation).toBe('prepend');
      expect(SAFEWORD_SCHEMA.textPatches['AGENTS.md'].createIfMissing).toBe(true);
    });

    it('should include CLAUDE.md patch (only if exists)', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.textPatches).toHaveProperty('CLAUDE.md');
      expect(SAFEWORD_SCHEMA.textPatches['CLAUDE.md'].operation).toBe('prepend');
      expect(SAFEWORD_SCHEMA.textPatches['CLAUDE.md'].createIfMissing).toBe(false);
    });
  });

  describe('packages', () => {
    it('should have 5 base packages', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.packages.base.length).toBe(5);
    });

    it('should include all required base packages', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      const required = [
        'eslint',
        'prettier',
        'eslint-plugin-safeword', // bundles eslint-config-prettier
        'markdownlint-cli2',
        'knip',
      ];

      for (const pkg of required) {
        expect(SAFEWORD_SCHEMA.packages.base).toContain(pkg);
      }
    });

    it('should have conditional packages for frameworks not in safeword plugin', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      // These frameworks are NOT in eslint-plugin-safeword (or need prettier plugins)
      const requiredConditions = [
        'astro', // prettier-plugin-astro (ESLint rules are in safeword)
        'tailwind', // prettier-plugin-tailwindcss
        'publishableLibrary', // publint
        'shell', // shellcheck + prettier-plugin-sh
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
        .filter(Boolean)
        .toSorted((a, b) => a.localeCompare(b));

      const cursorRules = Object.keys(SAFEWORD_SCHEMA.ownedFiles)
        .filter(path => path.startsWith('.cursor/rules/safeword-') && !path.includes('core'))
        .map(path => /safeword-([^.]+)/.exec(path)?.[1])
        .filter(Boolean)
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
        .filter(Boolean)
        .toSorted((a, b) => a.localeCompare(b));

      const cursorCommands = Object.keys(SAFEWORD_SCHEMA.ownedFiles)
        .filter(path => path.startsWith('.cursor/commands/'))
        .map(path => path.split('/').pop())
        .filter(Boolean)
        .toSorted((a, b) => a.localeCompare(b));

      // Both should have the same commands
      expect(cursorCommands).toEqual(claudeCommands);
    });
  });
});
