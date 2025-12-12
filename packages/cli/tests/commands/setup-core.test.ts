/**
 * Test Suite 2: Setup - Core Files
 *
 * Tests for .safeword/ directory creation and AGENTS.md handling.
 */

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

describe('Test Suite 2: Setup - Core Files', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('Test 2.1: Creates .safeword directory structure', () => {
    it('should create complete .safeword/ directory', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      const result = await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);

      // Core structure
      expect(fileExists(tempDir, '.safeword')).toBe(true);
      expect(fileExists(tempDir, '.safeword/SAFEWORD.md')).toBe(true);
      expect(fileExists(tempDir, '.safeword/version')).toBe(true);

      // Subdirectories
      expect(fileExists(tempDir, '.safeword/guides')).toBe(true);
      expect(fileExists(tempDir, '.safeword/templates')).toBe(true);
      expect(fileExists(tempDir, '.safeword/hooks')).toBe(true);
    });

    it('should write CLI version to .safeword/version', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const version = readTestFile(tempDir, '.safeword/version').trim();
      // Should be semver format
      expect(version).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
    });
  });

  describe('Test 2.2: Creates AGENTS.md if missing', () => {
    it('should create AGENTS.md with safeword link', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, 'AGENTS.md')).toBe(true);

      const content = readTestFile(tempDir, 'AGENTS.md');
      expect(content).toContain('.safeword/SAFEWORD.md');
    });
  });

  describe('Test 2.3: Prepends link to existing AGENTS.md', () => {
    it('should prepend link without losing content', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      // Create existing AGENTS.md
      const existingContent = '# My Project\n\nExisting content here.\n';
      writeTestFile(tempDir, 'AGENTS.md', existingContent);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const content = readTestFile(tempDir, 'AGENTS.md');

      // Link should be first
      const lines = content.split('\n');
      expect(lines[0]).toContain('.safeword/SAFEWORD.md');

      // Original content preserved
      expect(content).toContain('# My Project');
      expect(content).toContain('Existing content here.');
    });
  });

  describe('Test 2.4: No duplicate links in AGENTS.md on upgrade', () => {
    it('should not add duplicate link on upgrade', async () => {
      // First setup
      await createConfiguredProject(tempDir);

      // Verify link exists
      const contentBefore = readTestFile(tempDir, 'AGENTS.md');
      const linkCount = (contentBefore.match(/\.safeword\/SAFEWORD\.md/g) || []).length;
      expect(linkCount).toBe(1);

      // Run upgrade
      await runCli(['upgrade'], { cwd: tempDir });

      // Count links after
      const contentAfter = readTestFile(tempDir, 'AGENTS.md');
      const linkCountAfter = (contentAfter.match(/\.safeword\/SAFEWORD\.md/g) || []).length;

      expect(linkCountAfter).toBe(1);
    });
  });

  describe('Test 2.5: Prints summary of created files', () => {
    it('should output summary of created files', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      const result = await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);

      // Should mention what was created
      expect(result.stdout).toMatch(/created|Created/i);
      expect(result.stdout).toMatch(/\.safeword|safeword/i);
    });
  });
});
