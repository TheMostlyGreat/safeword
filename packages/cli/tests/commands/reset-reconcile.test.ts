/**
 * Test Suite: Reset Command (Reconcile-based)
 *
 * Tests that the reset command uses reconcile() with mode='uninstall' or 'uninstall-full'
 * to remove safeword configuration.
 *
 * TDD RED phase - these tests verify reconcile integration.
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('Reset Command - Reconcile Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'safeword-reset-reconcile-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  // Helper to create a configured project
  /**
   *
   */
  function createConfiguredProject() {
    // package.json
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify(
        {
          name: 'test',
          version: '1.0.0',
          scripts: {
            lint: 'eslint .',
            format: 'prettier --write .',
            prepare: 'husky || true',
          },
          'lint-staged': { '*.ts': ['eslint'] },
        },
        null,
        2,
      ),
    );

    // .safeword directory
    mkdirSync(join(tempDir, '.safeword/hooks'), { recursive: true });
    mkdirSync(join(tempDir, '.safeword/guides'), { recursive: true });
    mkdirSync(join(tempDir, '.safeword/tickets/completed'), { recursive: true });
    writeFileSync(join(tempDir, '.safeword/version'), '0.6.3');
    writeFileSync(join(tempDir, '.safeword/SAFEWORD.md'), '# Test');

    // .claude directory
    mkdirSync(join(tempDir, '.claude/commands'), { recursive: true });
    mkdirSync(join(tempDir, '.claude/skills/safeword-quality-reviewer'), { recursive: true });
    writeFileSync(
      join(tempDir, '.claude/settings.json'),
      JSON.stringify(
        {
          hooks: {
            SessionStart: [
              { hooks: [{ type: 'command', command: '.safeword/hooks/test.sh' }] },
              { command: 'echo custom', description: 'Custom' },
            ],
          },
        },
        null,
        2,
      ),
    );
    writeFileSync(join(tempDir, '.claude/commands/lint.md'), '# Lint');
    writeFileSync(join(tempDir, '.claude/skills/safeword-quality-reviewer/SKILL.md'), '# Skill');

    // .husky
    mkdirSync(join(tempDir, '.husky'), { recursive: true });
    writeFileSync(join(tempDir, '.husky/pre-commit'), 'npx lint-staged');

    // .mcp.json
    writeFileSync(
      join(tempDir, '.mcp.json'),
      JSON.stringify(
        {
          mcpServers: {
            context7: { command: 'npx' },
            playwright: { command: 'npx' },
            custom: { command: 'echo' },
          },
        },
        null,
        2,
      ),
    );

    // AGENTS.md
    writeFileSync(join(tempDir, 'AGENTS.md'), '.safeword/SAFEWORD.md\n\n# My Project');

    // Linting config
    writeFileSync(join(tempDir, 'eslint.config.mjs'), '// eslint config');
    writeFileSync(join(tempDir, '.prettierrc'), '{}');
  }

  describe('reconcile mode=uninstall', () => {
    it('should remove .claude owned files', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject();

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'uninstall', ctx);

      // .claude/commands/lint.md should be removed
      expect(existsSync(join(tempDir, '.claude/commands/lint.md'))).toBe(false);

      // .claude/skills/safeword-* should be removed
      expect(existsSync(join(tempDir, '.claude/skills/safeword-quality-reviewer'))).toBe(false);
    });

    it('should unmerge JSON settings (remove safeword hooks, keep custom)', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject();

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'uninstall', ctx);

      // Settings should still exist with custom hooks
      expect(existsSync(join(tempDir, '.claude/settings.json'))).toBe(true);
      const settings = JSON.parse(readFileSync(join(tempDir, '.claude/settings.json'), 'utf-8'));

      // Custom hook should be preserved
      const hasCustom = settings.hooks?.SessionStart?.some(
        (h: { command?: string }) => h.command === 'echo custom',
      );
      expect(hasCustom).toBe(true);
    });

    it('should remove safeword link from AGENTS.md via text-unpatch', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject();

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'uninstall', ctx);

      // AGENTS.md should no longer have the safeword link
      const content = readFileSync(join(tempDir, 'AGENTS.md'), 'utf-8');
      expect(content).not.toContain('.safeword/SAFEWORD.md');
      expect(content).toContain('My Project'); // Original content preserved
    });

    it('should remove owned directories (except preserved)', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject();

      // Add a user file to tickets/completed (preserved dir)
      writeFileSync(join(tempDir, '.safeword/tickets/completed/001-done.md'), '# Done ticket');

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'uninstall', ctx);

      // .safeword owned dirs should be removed
      expect(existsSync(join(tempDir, '.safeword/hooks'))).toBe(false);
      expect(existsSync(join(tempDir, '.safeword/guides'))).toBe(false);

      // .husky is a sharedDir, should NOT be removed (preserves user hooks)
      expect(existsSync(join(tempDir, '.husky'))).toBe(true);
    });

    it('should unmerge MCP servers', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject();

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'uninstall', ctx);

      // .mcp.json should exist with custom server
      expect(existsSync(join(tempDir, '.mcp.json'))).toBe(true);
      const mcp = JSON.parse(readFileSync(join(tempDir, '.mcp.json'), 'utf-8'));
      expect(mcp.mcpServers?.context7).toBeUndefined();
      expect(mcp.mcpServers?.playwright).toBeUndefined();
      expect(mcp.mcpServers?.custom).toBeDefined();
    });

    it('should preserve managed files (eslint, prettier)', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject();

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'uninstall', ctx);

      // Managed files should still exist
      expect(existsSync(join(tempDir, 'eslint.config.mjs'))).toBe(true);
      expect(existsSync(join(tempDir, '.prettierrc'))).toBe(true);
    });
  });

  describe('reconcile mode=uninstall-full', () => {
    it('should also remove managed files', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject();

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'uninstall-full', ctx);

      // Managed files should be removed
      expect(existsSync(join(tempDir, 'eslint.config.mjs'))).toBe(false);
      expect(existsSync(join(tempDir, '.prettierrc'))).toBe(false);
    });

    it('should compute packages to remove', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject();

      // Add devDependencies to check removal
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test',
            version: '1.0.0',
            devDependencies: {
              eslint: '^8.0.0',
              prettier: '^3.0.0',
              husky: '^9.0.0',
            },
          },
          null,
          2,
        ),
      );

      const ctx = createProjectContext(tempDir);
      const result = await reconcile(SAFEWORD_SCHEMA, 'uninstall-full', ctx, { dryRun: true });

      // Should report packages to remove
      expect(result.packagesToRemove.length).toBeGreaterThan(0);
      expect(result.packagesToRemove).toContain('eslint');
      expect(result.packagesToRemove).toContain('prettier');
    });
  });

  describe('reset command integration', () => {
    it('should run reset successfully via CLI', async () => {
      createConfiguredProject();

      const cliPath = join(process.cwd(), 'src/cli.ts');
      try {
        const result = execSync(`npx tsx ${cliPath} reset --yes`, {
          cwd: tempDir,
          encoding: 'utf-8',
          timeout: 30000,
        });

        expect(result).toContain('Reset');

        // .safeword should be removed
        expect(existsSync(join(tempDir, '.safeword'))).toBe(false);
      } catch (error) {
        const stdout = (error as { stdout?: string }).stdout || '';
        // If reset ran, check the output
        if (stdout.includes('Reset') || stdout.includes('Removed')) {
          expect(existsSync(join(tempDir, '.safeword'))).toBe(false);
        } else {
          throw error;
        }
      }
    });

    it('should do nothing on unconfigured project', async () => {
      // Just package.json, no .safeword
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      const cliPath = join(process.cwd(), 'src/cli.ts');
      const result = execSync(`npx tsx ${cliPath} reset --yes`, {
        cwd: tempDir,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(result.toLowerCase()).toContain('nothing to remove');
    });
  });
});
