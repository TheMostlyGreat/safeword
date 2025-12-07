/**
 * Test Suite: Schema Validation
 *
 * Tests that SAFEWORD_SCHEMA is the single source of truth.
 * Every template file must have a schema entry, no orphans.
 *
 * TDD RED phase - these tests should FAIL until src/schema.ts is implemented.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// This import will fail until schema.ts is created (RED phase)
// import { SAFEWORD_SCHEMA } from '../src/schema.js';

describe('Schema - Single Source of Truth', () => {
  // Helper to collect all files in templates/ directory
  function collectTemplateFiles(dir: string, prefix = ''): string[] {
    const files: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...collectTemplateFiles(fullPath, relativePath));
      } else {
        files.push(relativePath);
      }
    }

    return files;
  }

  const templatesDir = join(__dirname, '../templates');

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
        '.husky',
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
    it('should have exactly 48 owned files', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(Object.keys(SAFEWORD_SCHEMA.ownedFiles).length).toBe(48);
    });

    it('should have entry for every template file', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      const templateFiles = collectTemplateFiles(templatesDir);

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
      const generatedFiles = new Set([
        '.safeword/version',
        '.safeword/eslint-boundaries.config.mjs',
        '.husky/pre-commit',
      ]);

      for (const [path, def] of Object.entries(SAFEWORD_SCHEMA.ownedFiles)) {
        if (generatedFiles.has(path)) continue;

        // If it has a template reference, verify template exists
        if (def.template) {
          const templatePath = join(templatesDir, def.template);
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
              `Schema entry '${path}' references template '${def.template}' which does not exist`,
            );
          }
        }
      }
    });
  });

  describe('managedFiles', () => {
    it('should have exactly 3 managed files', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(Object.keys(SAFEWORD_SCHEMA.managedFiles).length).toBe(3);
    });

    it('should include eslint.config.mjs, .prettierrc, .markdownlint-cli2.jsonc', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.managedFiles).toHaveProperty('eslint.config.mjs');
      expect(SAFEWORD_SCHEMA.managedFiles).toHaveProperty('.prettierrc');
      expect(SAFEWORD_SCHEMA.managedFiles).toHaveProperty('.markdownlint-cli2.jsonc');
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
    it('should have 15 base packages', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      expect(SAFEWORD_SCHEMA.packages.base.length).toBe(15);
    });

    describe('getBaseEslintPackages', () => {
      it('should return only ESLint-related packages from base', async () => {
        const { getBaseEslintPackages } = await import('../src/schema.js');
        const eslintPackages = getBaseEslintPackages();

        // Should include ESLint packages
        expect(eslintPackages).toContain('eslint');
        expect(eslintPackages).toContain('@eslint/js');
        expect(eslintPackages).toContain('eslint-plugin-sonarjs');
        expect(eslintPackages).toContain('eslint-plugin-unicorn');
        expect(eslintPackages).toContain('eslint-import-resolver-typescript');

        // Should NOT include non-ESLint packages
        expect(eslintPackages).not.toContain('prettier');
        expect(eslintPackages).not.toContain('husky');
        expect(eslintPackages).not.toContain('lint-staged');
        expect(eslintPackages).not.toContain('markdownlint-cli2');
        expect(eslintPackages).not.toContain('knip');
      });

      it('should return consistent results (single source of truth)', async () => {
        const { getBaseEslintPackages, SAFEWORD_SCHEMA } = await import('../src/schema.js');
        const eslintPackages = getBaseEslintPackages();

        // All returned packages should be in base
        for (const pkg of eslintPackages) {
          expect(SAFEWORD_SCHEMA.packages.base).toContain(pkg);
        }
      });
    });

    describe('getConditionalEslintPackages', () => {
      it('should return ESLint packages for react', async () => {
        const { getConditionalEslintPackages } = await import('../src/schema.js');
        const reactPackages = getConditionalEslintPackages('react');

        expect(reactPackages).toContain('eslint-plugin-react');
        expect(reactPackages).toContain('eslint-plugin-react-hooks');
      });

      it('should return ESLint packages for typescript', async () => {
        const { getConditionalEslintPackages } = await import('../src/schema.js');
        const tsPackages = getConditionalEslintPackages('typescript');

        expect(tsPackages).toContain('typescript-eslint');
      });

      it('should return ESLint packages for vitest', async () => {
        const { getConditionalEslintPackages } = await import('../src/schema.js');
        const vitestPackages = getConditionalEslintPackages('vitest');

        expect(vitestPackages).toContain('@vitest/eslint-plugin');
      });

      it('should return empty array for unknown key', async () => {
        const { getConditionalEslintPackages } = await import('../src/schema.js');
        const unknown = getConditionalEslintPackages('unknown-framework');

        expect(unknown).toEqual([]);
      });

      it('should filter out non-ESLint packages from conditional', async () => {
        const { getConditionalEslintPackages, SAFEWORD_SCHEMA } = await import('../src/schema.js');

        // tailwind conditional includes prettier-plugin-tailwindcss (not ESLint)
        const tailwindEslint = getConditionalEslintPackages('tailwind');
        const tailwindAll = SAFEWORD_SCHEMA.packages.conditional['tailwind'];

        // Should filter out non-ESLint packages
        expect(tailwindAll).toContain('prettier-plugin-tailwindcss');
        expect(tailwindEslint).not.toContain('prettier-plugin-tailwindcss');
      });
    });

    it('should include all required base packages', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      const required = [
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
      ];

      for (const pkg of required) {
        expect(SAFEWORD_SCHEMA.packages.base).toContain(pkg);
      }
    });

    it('should have conditional packages for all framework types', async () => {
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');
      const requiredConditions = [
        'typescript',
        'react',
        'nextjs',
        'astro',
        'vue',
        'svelte',
        'vitest',
        'tailwind',
        'publishableLibrary',
        'shell',
      ];

      for (const condition of requiredConditions) {
        expect(SAFEWORD_SCHEMA.packages.conditional).toHaveProperty(condition);
      }
    });
  });
});
