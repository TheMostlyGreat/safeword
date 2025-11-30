/**
 * Test Suite 7: Git Repository Handling
 *
 * Tests for git detection and Husky/lint-staged setup.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTempDir,
  removeTempDir,
  createTypeScriptPackageJson,
  runCli,
  readTestFile,
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

  describe('Test 7.1: Warns when no .git directory', () => {
    it('should warn about skipped Husky setup', async () => {
      createTypeScriptPackageJson(tempDir);
      // No git init

      const result = await runCli(['setup', '--yes'], { cwd: tempDir });

      // Output should mention skipped Husky
      const output = result.stdout + result.stderr;
      expect(output.toLowerCase()).toMatch(/skip.*husky|husky.*skip|no.*git/i);
    });
  });

  describe('Test 7.2: Works with existing git repository', () => {
    it('should complete setup with existing git repository', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      const result = await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(fileExists(tempDir, '.git')).toBe(true);
    });
  });

  describe('Test 7.3: Skips git init in non-interactive mode', () => {
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

  describe('Test 7.4: Sets up Husky and lint-staged', () => {
    it('should create .husky/pre-commit with lint-staged', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, '.husky/pre-commit')).toBe(true);

      const content = readTestFile(tempDir, '.husky/pre-commit');
      expect(content).toContain('lint-staged');
    });

    it('should add lint-staged config to package.json', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const packageJson = JSON.parse(readTestFile(tempDir, 'package.json'));
      expect(packageJson['lint-staged']).toBeDefined();
      expect(packageJson['lint-staged']['*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}']).toBeDefined();
    });

    it('should add prepare script for Husky', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const packageJson = JSON.parse(readTestFile(tempDir, 'package.json'));
      expect(packageJson.scripts?.prepare).toBe('husky || true');
    });
  });

  describe('Test 7.5: Preserves existing scripts and config', () => {
    it('should not overwrite existing prepare script', async () => {
      createTypeScriptPackageJson(tempDir, {
        scripts: {
          prepare: 'npm run build',
        },
      });
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const packageJson = JSON.parse(readTestFile(tempDir, 'package.json'));
      // Original prepare script should be preserved
      expect(packageJson.scripts?.prepare).toBe('npm run build');
    });

    it('should not overwrite existing lint-staged config', async () => {
      createTypeScriptPackageJson(tempDir, {
        'lint-staged': {
          '*.ts': ['custom-linter'],
        },
      });
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const packageJson = JSON.parse(readTestFile(tempDir, 'package.json'));
      // Original lint-staged config should be preserved
      expect(packageJson['lint-staged']['*.ts']).toEqual(['custom-linter']);
    });
  });
});
