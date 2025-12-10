/**
 * Test Suite 8: Health Check
 *
 * Tests for `safeword check` command.
 */

import { unlinkSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach,beforeEach, describe, expect, it } from 'vitest';

import {
  createConfiguredProject,
  createTempDir,
  createTypeScriptPackageJson,
  fileExists,
  initGitRepo,
  readTestFile,
  removeTempDir,
  runCli,
  writeTestFile,
} from '../helpers';

describe('Test Suite 8: Health Check', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('Test 8.1: Shows CLI version', () => {
    it('should display CLI version', async () => {
      await createConfiguredProject(tempDir);

      const result = await runCli(['check'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toMatch(/cli|safeword/i);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // semver pattern
    });
  });

  describe('Test 8.2: Shows project config version', () => {
    it('should display version from .safeword/version', async () => {
      await createConfiguredProject(tempDir);

      const result = await runCli(['check'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toMatch(/project|config/i);

      // Should show the version from .safeword/version
      const projectVersion = readTestFile(tempDir, '.safeword/version').trim();
      expect(result.stdout).toContain(projectVersion);
    });
  });

  describe('Test 8.3: Shows update available', () => {
    it('should indicate when update is available', async () => {
      await createConfiguredProject(tempDir);

      // Write an older version
      writeTestFile(tempDir, '.safeword/version', '0.0.1');

      const result = await runCli(['check'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      // Should mention available update or version difference
      expect(result.stdout.toLowerCase()).toMatch(/update|available|upgrade|newer/i);
    });
  });

  describe('Test 8.4: Unconfigured project message', () => {
    it('should show not configured message', async () => {
      createTypeScriptPackageJson(tempDir);
      // No setup run

      const result = await runCli(['check'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toContain('not configured');
      expect(result.stdout.toLowerCase()).toContain('setup');
    });
  });

  describe('Test 8.5: Graceful timeout on version check', () => {
    it('should handle network timeout gracefully', async () => {
      await createConfiguredProject(tempDir);

      // This test verifies the check completes without hanging
      // Network mocking would be needed for full timeout simulation
      const result = await runCli(['check'], {
        cwd: tempDir,
        timeout: 10000,
      });

      expect(result.exitCode).toBe(0);
      // Should either show version info or timeout message
    });
  });

  describe('Test 8.6: --offline skips version check', () => {
    it('should skip remote version check', async () => {
      await createConfiguredProject(tempDir);

      const result = await runCli(['check', '--offline'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      // Should show local versions only
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('Test 8.7: Detects corrupted .safeword structure', () => {
    it('should detect missing critical files', async () => {
      await createConfiguredProject(tempDir);

      // Delete a critical file
      unlinkSync(join(tempDir, '.safeword/SAFEWORD.md'));

      const result = await runCli(['check'], { cwd: tempDir });

      expect(result.exitCode).toBe(0); // Warning, not failure
      expect(result.stdout.toLowerCase()).toMatch(/missing|issue|repair|upgrade/i);
    });
  });
});
