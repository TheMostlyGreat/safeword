/**
 * Test Suite 8: Health Check
 *
 * Tests for `safeword check` command.
 */

import { unlinkSync } from 'node:fs';
import nodePath from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createConfiguredProject,
  createTemporaryDirectory,
  createTypeScriptPackageJson,
  readTestFile,
  removeTemporaryDirectory,
  runCli,
  TIMEOUT_QUICK,
  writeTestFile,
} from '../helpers';

describe('Test Suite 8: Health Check', () => {
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = createTemporaryDirectory();
  });

  afterEach(() => {
    removeTemporaryDirectory(temporaryDirectory);
  });

  describe('Test 8.1: Shows CLI version', () => {
    it('should display CLI version', async () => {
      await createConfiguredProject(temporaryDirectory);

      const result = await runCli(['check'], { cwd: temporaryDirectory });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toMatch(/cli|safeword/i);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // semver pattern
    });
  });

  describe('Test 8.2: Shows project config version', () => {
    it('should display version from .safeword/version', async () => {
      await createConfiguredProject(temporaryDirectory);

      const result = await runCli(['check'], { cwd: temporaryDirectory });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toMatch(/project|config/i);

      // Should show the version from .safeword/version
      const projectVersion = readTestFile(temporaryDirectory, '.safeword/version').trim();
      expect(result.stdout).toContain(projectVersion);
    });
  });

  describe('Test 8.3: Shows update available', () => {
    it('should indicate when update is available', async () => {
      await createConfiguredProject(temporaryDirectory);

      // Write an older version
      writeTestFile(temporaryDirectory, '.safeword/version', '0.0.1');

      const result = await runCli(['check'], { cwd: temporaryDirectory });

      expect(result.exitCode).toBe(0);
      // Should mention available update or version difference
      expect(result.stdout.toLowerCase()).toMatch(/update|available|upgrade|newer/i);
    });
  });

  describe('Test 8.4: Unconfigured project message', () => {
    it('should show not configured message', async () => {
      createTypeScriptPackageJson(temporaryDirectory);
      // No setup run

      const result = await runCli(['check'], { cwd: temporaryDirectory });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toContain('not configured');
      expect(result.stdout.toLowerCase()).toContain('setup');
    });
  });

  describe('Test 8.5: Graceful timeout on version check', () => {
    it('should handle network timeout gracefully', async () => {
      await createConfiguredProject(temporaryDirectory);

      // This test verifies the check completes without hanging
      // Network mocking would be needed for full timeout simulation
      const result = await runCli(['check'], {
        cwd: temporaryDirectory,
        timeout: TIMEOUT_QUICK,
      });

      expect(result.exitCode).toBe(0);
      // Should either show version info or timeout message
    });
  });

  describe('Test 8.6: --offline skips version check', () => {
    it('should skip remote version check', async () => {
      await createConfiguredProject(temporaryDirectory);

      const result = await runCli(['check', '--offline'], { cwd: temporaryDirectory });

      expect(result.exitCode).toBe(0);
      // Should show local versions only
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('Test 8.7: Detects corrupted .safeword structure', () => {
    it('should detect missing critical files', async () => {
      await createConfiguredProject(temporaryDirectory);

      // Delete a critical file
      unlinkSync(nodePath.join(temporaryDirectory, '.safeword/SAFEWORD.md'));

      const result = await runCli(['check'], { cwd: temporaryDirectory });

      expect(result.exitCode).toBe(0); // Warning, not failure
      expect(result.stdout.toLowerCase()).toMatch(/missing|issue|repair|upgrade/i);
    });
  });

  // ==========================================================================
  // Language Packs Detection (Feature: Language Packs)
  // Test Definitions: .safeword/planning/test-definitions/feature-language-packs.md
  // ==========================================================================

  describe('Warns when detected language has no installed pack', () => {
    it.skip('should warn about missing Python pack', async () => {
      // Create Python project
      writeTestFile(temporaryDirectory, 'pyproject.toml', `[project]\nname = "test"\n`);

      // Write config with empty installedPacks
      writeTestFile(
        temporaryDirectory,
        '.safeword/config.json',
        JSON.stringify({ version: '0.15.0', installedPacks: [] }),
      );
      writeTestFile(temporaryDirectory, '.safeword/version', '0.15.0');

      const result = await runCli(['check'], { cwd: temporaryDirectory });

      // Should warn about missing pack
      expect(result.exitCode).not.toBe(0); // Non-zero for warnings
      expect(result.stdout).toMatch(/python.*pack.*not installed/i);
      expect(result.stdout).toMatch(/safeword upgrade/i);
    });
  });

  describe('Passes when all detected languages have packs', () => {
    it.skip('should pass when Python pack is installed', async () => {
      // Create Python project
      writeTestFile(temporaryDirectory, 'pyproject.toml', `[project]\nname = "test"\n`);

      // Write config with Python pack installed
      writeTestFile(
        temporaryDirectory,
        '.safeword/config.json',
        JSON.stringify({ version: '0.15.0', installedPacks: ['python'] }),
      );
      writeTestFile(temporaryDirectory, '.safeword/version', '0.15.0');

      const result = await runCli(['check'], { cwd: temporaryDirectory });

      // Should pass without pack warnings
      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toMatch(/pack.*not installed/i);
    });
  });
});
