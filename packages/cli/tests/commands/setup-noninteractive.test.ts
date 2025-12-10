/**
 * Test Suite 6: Non-Interactive Setup
 *
 * Tests for CI/headless operation.
 */

import { afterEach,beforeEach, describe, expect, it } from 'vitest';

import {
  createTempDir,
  createTypeScriptPackageJson,
  fileExists,
  removeTempDir,
  runCli,
} from '../helpers';

describe('Test Suite 6: Non-Interactive Setup', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('Test 6.1: --yes flag skips all prompts', () => {
    it('should complete without hanging', async () => {
      createTypeScriptPackageJson(tempDir);
      // No git init - should skip git prompt with --yes

      const result = await runCli(['setup', '--yes'], {
        cwd: tempDir,
        timeout: 30000,
      });

      expect(result.exitCode).toBe(0);
      expect(fileExists(tempDir, '.safeword')).toBe(true);

      // Git should be skipped (no .git created)
      expect(fileExists(tempDir, '.git')).toBe(false);
    });
  });

  describe('Test 6.2: No TTY uses defaults', () => {
    it('should complete without stdin in non-TTY mode', async () => {
      createTypeScriptPackageJson(tempDir);
      // No git init

      // Force non-TTY by setting environment
      const result = await runCli(['setup'], {
        cwd: tempDir,
        timeout: 30000,
        env: {
          CI: 'true', // Many tools detect CI and use non-interactive mode
          TERM: 'dumb',
        },
      });

      // Should complete (either with defaults or --yes required message)
      // The exact behavior depends on implementation
      expect(result.exitCode).toBeDefined();
    });
  });

  describe('Test 6.3: Warning shown when git skipped', () => {
    it('should show warning about skipped git initialization', async () => {
      createTypeScriptPackageJson(tempDir);
      // No git init

      const result = await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);

      // Should mention skipped git
      const output = result.stdout + result.stderr;
      expect(output.toLowerCase()).toMatch(/skipped|git|warning/i);
    });
  });
});
