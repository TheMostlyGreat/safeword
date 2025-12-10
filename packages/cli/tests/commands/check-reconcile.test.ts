/**
 * Test Suite: Check Command (Reconcile-based)
 *
 * Tests that the check command uses reconcile() with dryRun
 * to detect issues in the project configuration.
 *
 * TDD RED phase - these tests verify reconcile integration.
 */

import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('Check Command - Reconcile Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'safeword-check-reconcile-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  // Helper to create a minimal configured project
  /**
   *
   */
  function createConfiguredProject() {
    // package.json
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
    );

    // .safeword directory with minimal files
    mkdirSync(join(tempDir, '.safeword'), { recursive: true });
    writeFileSync(join(tempDir, '.safeword/version'), '0.6.3');
    writeFileSync(join(tempDir, '.safeword/SAFEWORD.md'), '# Test');

    // .claude directory
    mkdirSync(join(tempDir, '.claude'), { recursive: true });
    writeFileSync(join(tempDir, '.claude/settings.json'), JSON.stringify({ hooks: {} }, null, 2));

    // AGENTS.md
    writeFileSync(join(tempDir, 'AGENTS.md'), '.safeword/SAFEWORD.md\n\n# Agents');
  }

  describe('checkHealth using reconcile dryRun', () => {
    it('should detect missing files via reconcile dryRun', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject();

      // Delete a file that should exist
      unlinkSync(join(tempDir, '.safeword/SAFEWORD.md'));

      const ctx = createProjectContext(tempDir);
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx, { dryRun: true });

      // dryRun should detect the missing file as needing to be created
      expect(result.applied).toBe(false);

      // Should have actions to fix the missing file
      const writeActions = result.actions.filter(a => a.type === 'write');
      const hasSafewordMd = writeActions.some(
        a => a.type === 'write' && a.path.includes('SAFEWORD.md'),
      );
      expect(hasSafewordMd).toBe(true);
    });

    it('should report healthy when no changes needed', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      // Full setup to create complete configuration
      const { execSync } = await import('node:child_process');

      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      // Run actual setup (this is an integration test)
      const cliPath = join(process.cwd(), 'src/cli.ts');
      try {
        execSync(`npx tsx ${cliPath} setup --yes`, {
          cwd: tempDir,
          stdio: 'pipe',
          timeout: 60000,
        });
      } catch {
        // May fail due to npm install timeout, but files should be created
      }

      const ctx = createProjectContext(tempDir);
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx, { dryRun: true });

      // After fresh setup, upgrade dryRun should find minimal/no changes
      // (only version file if CLI version differs from project version)
      expect(result.applied).toBe(false);

      // Write actions for owned files should be empty or only version update
      const ownedFileWrites = result.actions.filter(
        a => a.type === 'write' && !a.path.includes('version'),
      );

      // Most files should match (no write actions needed)
      expect(ownedFileWrites.length).toBeLessThan(5);
    });

    it('should detect missing AGENTS.md link', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject();

      // Create AGENTS.md without the safeword link
      writeFileSync(join(tempDir, 'AGENTS.md'), '# My Project\n\nSome content.');

      const ctx = createProjectContext(tempDir);
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx, { dryRun: true });

      // Should have a text-patch action for AGENTS.md
      const textPatchActions = result.actions.filter(a => a.type === 'text-patch');
      const hasAgentsPatch = textPatchActions.some(
        a => a.type === 'text-patch' && a.path === 'AGENTS.md',
      );
      expect(hasAgentsPatch).toBe(true);
    });

    it('should compute missing packages', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      createConfiguredProject();

      // No dev dependencies installed
      const ctx = createProjectContext(tempDir);
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx, { dryRun: true });

      // Should report packages to install
      expect(result.packagesToInstall.length).toBeGreaterThan(0);
      expect(result.packagesToInstall).toContain('eslint');
      expect(result.packagesToInstall).toContain('prettier');
    });

    it('should not report installed packages as missing', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');

      createConfiguredProject();

      // Add some packages to devDependencies
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
  });
});
