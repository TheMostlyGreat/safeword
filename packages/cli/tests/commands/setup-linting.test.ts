/**
 * Test Suite 4: Setup - Linting (Integration Tests)
 *
 * Tests for ESLint + Prettier configuration.
 *
 * Note: Unit tests for project type detection (Tests 4.1-4.3) are in
 * src/utils/project-detector.test.ts. This file contains only the
 * integration tests (Tests 4.4-4.8).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { chmodSync } from 'node:fs';
import { join } from 'node:path';
import {
  createTempDir,
  removeTempDir,
  createTypeScriptPackageJson,
  runCli,
  readTestFile,
  fileExists,
  initGitRepo,
} from '../helpers';

describe('Test Suite 4: Setup - Linting (Integration)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('Test 4.4: Creates eslint.config.mjs', () => {
    it('should create ESLint flat config', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, 'eslint.config.mjs')).toBe(true);

      const content = readTestFile(tempDir, 'eslint.config.mjs');
      // Should be a valid ESLint flat config
      expect(content).toContain('export');
    });

    it('should include TypeScript config when detected', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const content = readTestFile(tempDir, 'eslint.config.mjs');
      expect(content).toMatch(/typescript|@typescript-eslint/i);
    });
  });

  describe('Test 4.5: Creates .prettierrc', () => {
    it('should create Prettier config', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, '.prettierrc')).toBe(true);

      const content = readTestFile(tempDir, '.prettierrc');
      // Should be valid JSON
      expect(() => JSON.parse(content)).not.toThrow();
    });
  });

  describe('Test 4.6: Adds lint script to package.json', () => {
    it('should add lint script', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const packageJson = JSON.parse(readTestFile(tempDir, 'package.json'));
      expect(packageJson.scripts?.lint).toBe('eslint .');
    });

    it('should not overwrite existing lint script', async () => {
      createTypeScriptPackageJson(tempDir, {
        scripts: {
          lint: 'eslint src/',
        },
      });
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const packageJson = JSON.parse(readTestFile(tempDir, 'package.json'));
      // Original script should be preserved
      expect(packageJson.scripts?.lint).toBe('eslint src/');
    });
  });

  describe('Test 4.7: Adds format script to package.json', () => {
    it('should add format script', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const packageJson = JSON.parse(readTestFile(tempDir, 'package.json'));
      expect(packageJson.scripts?.format).toBe('prettier --write .');
    });

    it('should not overwrite existing format script', async () => {
      createTypeScriptPackageJson(tempDir, {
        scripts: {
          format: 'prettier --write src/',
        },
      });
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const packageJson = JSON.parse(readTestFile(tempDir, 'package.json'));
      // Original script should be preserved
      expect(packageJson.scripts?.format).toBe('prettier --write src/');
    });
  });

  describe('Test 4.8: Exit 1 if linting setup fails', () => {
    it('should fail with exit 1 when package.json is not writable', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      // Make package.json read-only
      chmodSync(join(tempDir, 'package.json'), 0o444);

      const result = await runCli(['setup', '--yes'], { cwd: tempDir });

      // Restore permissions for cleanup
      chmodSync(join(tempDir, 'package.json'), 0o644);

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toMatch(/lint|permission|write|failed|package/i);
    });
  });

  describe('Test 4.9: Creates markdownlint config', () => {
    it('should create .markdownlint.jsonc', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      // Implementation may place in .safeword/ or root
      const hasMarkdownlintConfig =
        fileExists(tempDir, '.markdownlint.jsonc') ||
        fileExists(tempDir, '.safeword/.markdownlint.jsonc');

      expect(hasMarkdownlintConfig).toBe(true);
    });
  });

  describe('Test 4.10: Adds lint:md script', () => {
    it('should add lint:md script to package.json', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const packageJson = JSON.parse(readTestFile(tempDir, 'package.json'));
      expect(packageJson.scripts?.['lint:md']).toBeDefined();
      expect(packageJson.scripts?.['lint:md']).toContain('markdownlint');
    });
  });

  describe('Test 4.11: Adds format:check script', () => {
    it('should add format:check script to package.json', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const packageJson = JSON.parse(readTestFile(tempDir, 'package.json'));
      expect(packageJson.scripts?.['format:check']).toBeDefined();
      expect(packageJson.scripts?.['format:check']).toContain('prettier');
      expect(packageJson.scripts?.['format:check']).toContain('--check');
    });
  });
});
