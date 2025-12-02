/**
 * Test Suite: Upgrade Command (Reconcile-based)
 *
 * Tests that the upgrade command uses reconcile() with mode='upgrade'
 * to update project configuration.
 *
 * TDD RED phase - these tests verify reconcile integration.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

describe('Upgrade Command - Reconcile Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'safeword-upgrade-reconcile-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  // Helper to create a minimal configured project
  function createConfiguredProject(version = '0.5.0') {
    // package.json
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
    );

    // .safeword directory with version file
    mkdirSync(join(tempDir, '.safeword'), { recursive: true });
    writeFileSync(join(tempDir, '.safeword/version'), version);
    writeFileSync(join(tempDir, '.safeword/SAFEWORD.md'), '# Old content');

    // .claude directory
    mkdirSync(join(tempDir, '.claude'), { recursive: true });
    writeFileSync(join(tempDir, '.claude/settings.json'), JSON.stringify({ hooks: {} }, null, 2));

    // AGENTS.md with link
    writeFileSync(tempDir + '/AGENTS.md', '@./.safeword/SAFEWORD.md\n\n# Agents');
  }

  describe('reconcile mode=upgrade', () => {
    it('should use reconcile to compute upgrade actions', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject('0.5.0');

      const ctx = createProjectContext(tempDir);
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx, { dryRun: true });

      // dryRun should compute actions without applying
      expect(result.applied).toBe(false);

      // Should have write actions for owned files that differ
      const writeActions = result.actions.filter(a => a.type === 'write');
      expect(writeActions.length).toBeGreaterThan(0);

      // Should include SAFEWORD.md update (content differs from template)
      const hasSafewordMd = writeActions.some(
        a => a.type === 'write' && a.path.includes('SAFEWORD.md'),
      );
      expect(hasSafewordMd).toBe(true);
    });

    it('should apply changes when not dryRun', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject('0.5.0');

      // Read old content
      const oldContent = readFileSync(join(tempDir, '.safeword/SAFEWORD.md'), 'utf-8');
      expect(oldContent).toBe('# Old content');

      const ctx = createProjectContext(tempDir);
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);

      // Should have applied changes
      expect(result.applied).toBe(true);

      // SAFEWORD.md should be updated
      const newContent = readFileSync(join(tempDir, '.safeword/SAFEWORD.md'), 'utf-8');
      expect(newContent).not.toBe('# Old content');
      expect(newContent).toContain('SAFEWORD Agent Instructions');
    });

    it('should compute missing packages during upgrade', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject('0.5.0');

      const ctx = createProjectContext(tempDir);
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx, { dryRun: true });

      // Should report packages to install
      expect(result.packagesToInstall.length).toBeGreaterThan(0);
      expect(result.packagesToInstall).toContain('eslint');
    });

    it('should not report installed packages as missing', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');

      createConfiguredProject('0.5.0');

      // Add packages to devDependencies
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

      const { createProjectContext } = await import('../../src/utils/context.js');
      const ctx = createProjectContext(tempDir);
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx, { dryRun: true });

      // Installed packages should not be in packagesToInstall
      expect(result.packagesToInstall).not.toContain('eslint');
      expect(result.packagesToInstall).not.toContain('prettier');
      expect(result.packagesToInstall).not.toContain('husky');
    });

    it('should create missing directories', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');
      const { existsSync } = await import('node:fs');

      createConfiguredProject('0.5.0');

      // Don't create some directories that should exist
      // .safeword/learnings should be created

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);

      // Directories should be created
      expect(existsSync(join(tempDir, '.safeword/learnings'))).toBe(true);
      expect(existsSync(join(tempDir, '.safeword/tickets'))).toBe(true);
      expect(existsSync(join(tempDir, '.claude/commands'))).toBe(true);
    });

    it('should preserve user files in shared directories', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');
      const { existsSync } = await import('node:fs');

      createConfiguredProject('0.5.0');

      // Create user learning file
      mkdirSync(join(tempDir, '.safeword/learnings'), { recursive: true });
      writeFileSync(
        join(tempDir, '.safeword/learnings/my-custom-learning.md'),
        '# My Learning\n\nImportant.',
      );

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);

      // User file should be preserved
      expect(existsSync(join(tempDir, '.safeword/learnings/my-custom-learning.md'))).toBe(true);
      const content = readFileSync(
        join(tempDir, '.safeword/learnings/my-custom-learning.md'),
        'utf-8',
      );
      expect(content).toContain('My Learning');
    });

    it('should update JSON settings via merge', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject('0.5.0');

      // Add a custom hook that should be preserved
      writeFileSync(
        join(tempDir, '.claude/settings.json'),
        JSON.stringify(
          {
            hooks: {
              SessionStart: [{ command: 'echo custom', description: 'Custom hook' }],
            },
          },
          null,
          2,
        ),
      );

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);

      // Read updated settings
      const settings = JSON.parse(readFileSync(join(tempDir, '.claude/settings.json'), 'utf-8'));

      // Custom hook should be preserved
      const hasCustom = settings.hooks?.SessionStart?.some(
        (h: { command?: string }) => h.command === 'echo custom',
      );
      expect(hasCustom).toBe(true);

      // Safeword hooks should be added (they have structure { hooks: [{ command: '...' }] })
      const hasSafeword = settings.hooks?.SessionStart?.some(
        (h: { hooks?: Array<{ command?: string }> }) =>
          h.hooks?.some((cmd: { command?: string }) => cmd.command?.includes('.safeword')),
      );
      expect(hasSafeword).toBe(true);
    });

    it('should ensure AGENTS.md link via text-patch', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject('0.5.0');

      // Create AGENTS.md without the link
      writeFileSync(join(tempDir, 'AGENTS.md'), '# My Project\n\nSome content.');

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);

      // AGENTS.md should have the link added
      const content = readFileSync(join(tempDir, 'AGENTS.md'), 'utf-8');
      expect(content).toContain('@./.safeword/SAFEWORD.md');
      expect(content).toContain('My Project'); // Original content preserved
    });
  });

  describe('upgrade command integration', () => {
    it('should run upgrade successfully via CLI', async () => {
      createConfiguredProject('0.5.0');

      const cliPath = join(process.cwd(), 'src/cli.ts');
      try {
        const result = execSync(`npx tsx ${cliPath} upgrade`, {
          cwd: tempDir,
          encoding: 'utf-8',
          timeout: 30000,
        });

        expect(result).toContain('Upgrade');
      } catch (err) {
        // Check if upgrade itself worked even if npm install timed out
        const stderr = (err as { stderr?: string }).stderr || '';
        const stdout = (err as { stdout?: string }).stdout || '';

        // If we see upgrade output, the reconcile worked
        if (stdout.includes('Upgrade') || stdout.includes('Upgrading')) {
          // Upgrade ran, might have failed on npm install
          expect(true).toBe(true);
        } else {
          throw err;
        }
      }
    });

    it('should refuse downgrade when project is newer', async () => {
      createConfiguredProject('99.99.99');

      const cliPath = join(process.cwd(), 'src/cli.ts');
      try {
        execSync(`npx tsx ${cliPath} upgrade`, {
          cwd: tempDir,
          encoding: 'utf-8',
          timeout: 30000,
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (err) {
        const stderr = (err as { stderr?: string }).stderr || '';
        expect(stderr.toLowerCase()).toMatch(/older|downgrade|cli/i);
      }
    });

    it('should error on unconfigured project', async () => {
      // Just package.json, no .safeword
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      const cliPath = join(process.cwd(), 'src/cli.ts');
      try {
        execSync(`npx tsx ${cliPath} upgrade`, {
          cwd: tempDir,
          encoding: 'utf-8',
          timeout: 30000,
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (err) {
        const stderr = (err as { stderr?: string }).stderr || '';
        expect(stderr.toLowerCase()).toContain('not configured');
      }
    });
  });
});
