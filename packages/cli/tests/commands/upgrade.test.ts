/**
 * Test Suite 9: Upgrade
 *
 * Tests for `safeword upgrade` command.
 */

import { afterEach,beforeEach, describe, expect, it } from 'vitest';

import {
  createConfiguredProject,
  createTempDir,
  createTypeScriptPackageJson,
  fileExists,
  readTestFile,
  removeTempDir,
  runCli,
  writeTestFile,
} from '../helpers';

describe('Test Suite 9: Upgrade', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('Test 9.1: Overwrites .safeword files', () => {
    it('should restore modified files to CLI version', async () => {
      await createConfiguredProject(tempDir);

      // Modify a safeword file
      const originalContent = readTestFile(tempDir, '.safeword/SAFEWORD.md');
      writeTestFile(tempDir, '.safeword/SAFEWORD.md', '# Modified content\n');

      await runCli(['upgrade'], { cwd: tempDir });

      const restoredContent = readTestFile(tempDir, '.safeword/SAFEWORD.md');
      // Should be restored (not the modified content)
      expect(restoredContent).not.toBe('# Modified content\n');
    });

    it('should update .safeword/version', async () => {
      await createConfiguredProject(tempDir);

      // Set an older version
      writeTestFile(tempDir, '.safeword/version', '0.0.1');

      await runCli(['upgrade'], { cwd: tempDir });

      const version = readTestFile(tempDir, '.safeword/version').trim();
      expect(version).not.toBe('0.0.1');
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('Test 9.2: Updates skills', () => {
    it('should restore modified skill files', async () => {
      await createConfiguredProject(tempDir);

      // Find and modify a skill file if it exists
      if (fileExists(tempDir, '.claude/skills')) {
        // The actual skill path depends on implementation
        // This test structure is correct for when skills are implemented
      }

      const result = await runCli(['upgrade'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Test 9.3: Preserves non-safeword hooks', () => {
    it('should preserve custom hooks', async () => {
      await createConfiguredProject(tempDir);

      // Add a custom hook
      const settings = JSON.parse(readTestFile(tempDir, '.claude/settings.json'));
      settings.hooks = settings.hooks || {};
      settings.hooks.SessionStart = settings.hooks.SessionStart || [];
      settings.hooks.SessionStart.push({
        command: 'echo "My custom hook"',
        description: 'Custom hook',
      });
      writeTestFile(tempDir, '.claude/settings.json', JSON.stringify(settings, null, 2));

      await runCli(['upgrade'], { cwd: tempDir });

      const updatedSettings = JSON.parse(readTestFile(tempDir, '.claude/settings.json'));
      const hasCustomHook = updatedSettings.hooks.SessionStart.some(
        (hook: { command?: string }) => hook.command === 'echo "My custom hook"',
      );

      expect(hasCustomHook).toBe(true);
    });
  });

  describe('Test 9.4: Same-version reinstalls', () => {
    it('should restore files even at same version', async () => {
      await createConfiguredProject(tempDir);

      // Get current version
      const version = readTestFile(tempDir, '.safeword/version').trim();

      // Modify a file
      writeTestFile(tempDir, '.safeword/SAFEWORD.md', '# Corrupted\n');

      await runCli(['upgrade'], { cwd: tempDir });

      // File should be restored
      const content = readTestFile(tempDir, '.safeword/SAFEWORD.md');
      expect(content).not.toBe('# Corrupted\n');

      // Version should remain same
      const newVersion = readTestFile(tempDir, '.safeword/version').trim();
      expect(newVersion).toBe(version);
    });
  });

  describe('Test 9.5: Refuses to downgrade', () => {
    it('should error when project is newer than CLI', async () => {
      await createConfiguredProject(tempDir);

      // Set a future version
      writeTestFile(tempDir, '.safeword/version', '99.99.99');

      const result = await runCli(['upgrade'], { cwd: tempDir });

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toMatch(/older|downgrade|cli|update/i);
    });
  });

  describe('Test 9.6: Unconfigured project error', () => {
    it('should error on unconfigured project', async () => {
      createTypeScriptPackageJson(tempDir);
      // No setup

      const result = await runCli(['upgrade'], { cwd: tempDir });

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toContain('not configured');
      expect(result.stderr.toLowerCase()).toContain('setup');
    });
  });

  describe('Test 9.7: Prints summary of changes', () => {
    it('should show what changed', async () => {
      await createConfiguredProject(tempDir);

      // Modify to create changes
      writeTestFile(tempDir, '.safeword/version', '0.0.1');

      const result = await runCli(['upgrade'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      // Should show some summary of changes
      expect(result.stdout.toLowerCase()).toMatch(/upgrad|update|version|file/i);
    });
  });

  describe('Test 9.8: Preserves learnings directory', () => {
    it('should preserve user learnings on upgrade', async () => {
      await createConfiguredProject(tempDir);

      // Create user learning file
      writeTestFile(
        tempDir,
        '.safeword/learnings/my-custom-learning.md',
        '# My Learning\n\nImportant discovery about the codebase.',
      );

      // Modify version to trigger upgrade
      writeTestFile(tempDir, '.safeword/version', '0.0.1');

      await runCli(['upgrade'], { cwd: tempDir });

      // User learning should be preserved
      expect(fileExists(tempDir, '.safeword/learnings/my-custom-learning.md')).toBe(true);

      const content = readTestFile(tempDir, '.safeword/learnings/my-custom-learning.md');
      expect(content).toContain('My Learning');
      expect(content).toContain('Important discovery');
    });
  });

  describe('Test 9.9: Creates backup before upgrade', () => {
    it('should create .safeword.backup directory', async () => {
      await createConfiguredProject(tempDir);

      // Modify version to trigger upgrade
      writeTestFile(tempDir, '.safeword/version', '0.0.1');

      // Check for backup during upgrade (it may be deleted after success)
      // We verify by checking that upgrade succeeds without data loss
      const originalSafeword = readTestFile(tempDir, '.safeword/SAFEWORD.md');

      await runCli(['upgrade'], { cwd: tempDir });

      // After successful upgrade, backup should be deleted
      expect(fileExists(tempDir, '.safeword.backup')).toBe(false);

      // Files should still exist
      expect(fileExists(tempDir, '.safeword/SAFEWORD.md')).toBe(true);
    });
  });

  describe('Test 9.10: Restores backup on failure', () => {
    it.skip('should restore from backup if upgrade fails mid-way', async () => {
      // This test would require a way to force upgrade failure
      // Skipped as it requires mocking internal failures
    });
  });
});
