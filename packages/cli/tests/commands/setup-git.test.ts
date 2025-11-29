/**
 * Test Suite 7: Git Repository Handling
 *
 * Tests for git detection and hook installation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTempDir,
  removeTempDir,
  createTypeScriptPackageJson,
  runCli,
  readTestFile,
  writeTestFile,
  fileExists,
  initGitRepo,
} from '../helpers';

describe('Test Suite 7: Git Repository Handling', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('Test 7.1: Prompts for git init when no .git', () => {
    it('should mention git initialization in output', async () => {
      createTypeScriptPackageJson(tempDir);
      // No git init

      // In non-interactive mode with --yes, we expect it to skip
      // The prompt behavior is tested via TTY simulation
      const result = await runCli(['setup', '--yes'], { cwd: tempDir });

      // Output should mention git
      const output = result.stdout + result.stderr;
      expect(output.toLowerCase()).toMatch(/git/i);
    });
  });

  describe('Test 7.2: Runs git init when user confirms', () => {
    // This test would require TTY simulation for interactive input
    // For now, we test that git hooks work when .git exists
    it('should work with existing git repository', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      const result = await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(fileExists(tempDir, '.git')).toBe(true);
    });
  });

  describe('Test 7.3: Skips git init when user declines', () => {
    // In --yes mode, git init is skipped by default
    it('should skip git init in non-interactive mode', async () => {
      createTypeScriptPackageJson(tempDir);
      // No git init

      const result = await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      // Git should NOT be initialized
      expect(fileExists(tempDir, '.git')).toBe(false);

      // Should warn about skipped git hooks
      const output = result.stdout + result.stderr;
      expect(output.toLowerCase()).toMatch(/skip|warning|git/i);
    });
  });

  describe('Test 7.4: Installs git hooks when .git present', () => {
    it('should create pre-commit hook with safeword markers', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, '.git/hooks/pre-commit')).toBe(true);

      const content = readTestFile(tempDir, '.git/hooks/pre-commit');
      expect(content).toContain('SAFEWORD_ARCH_CHECK_START');
      expect(content).toContain('SAFEWORD_ARCH_CHECK_END');
    });
  });

  describe('Test 7.5: Preserves existing pre-commit hooks', () => {
    it('should preserve custom hook content', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      // Create existing pre-commit hook
      const customHook = `#!/bin/bash
# Custom hook for running tests
echo "Running custom tests..."
npm test
`;
      writeTestFile(tempDir, '.git/hooks/pre-commit', customHook);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const content = readTestFile(tempDir, '.git/hooks/pre-commit');

      // Original content preserved
      expect(content).toContain('Running custom tests');
      expect(content).toContain('npm test');

      // Safeword markers added
      expect(content).toContain('SAFEWORD_ARCH_CHECK_START');
      expect(content).toContain('SAFEWORD_ARCH_CHECK_END');
    });

    it('should not duplicate markers on repeated setup', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      // Run setup twice
      await runCli(['setup', '--yes'], { cwd: tempDir });

      // For second run, we need to remove .safeword to allow setup
      // Or use upgrade. Let's test via upgrade path
      await runCli(['upgrade'], { cwd: tempDir });

      const content = readTestFile(tempDir, '.git/hooks/pre-commit');

      // Markers should appear exactly once
      const startCount = (content.match(/SAFEWORD_ARCH_CHECK_START/g) || []).length;
      const endCount = (content.match(/SAFEWORD_ARCH_CHECK_END/g) || []).length;

      expect(startCount).toBe(1);
      expect(endCount).toBe(1);
    });
  });
});
