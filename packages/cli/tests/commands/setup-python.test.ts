/**
 * Test Suite 3: Conditional Setup for Python Projects
 * Tests for Story 3 - setup behavior for Python-only projects.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createPythonProject,
  createTemporaryDirectory,
  fileExists,
  initGitRepo,
  removeTemporaryDirectory,
  runCli,
  TIMEOUT_BUN_INSTALL,
  TIMEOUT_SETUP,
  writeTestFile,
} from '../helpers';

let projectDirectory: string;

beforeEach(() => {
  projectDirectory = createTemporaryDirectory();
});

afterEach(() => {
  if (projectDirectory) {
    removeTemporaryDirectory(projectDirectory);
  }
});

/**
 * Helper to create a polyglot project (JS + Python)
 */
function createPolyglotProject(dir: string): void {
  // Create package.json
  writeTestFile(dir, 'package.json', JSON.stringify({
    name: 'test-polyglot',
    version: '1.0.0',
    devDependencies: {
      typescript: '^5.0.0',
    },
  }, null, 2));

  // Create pyproject.toml
  createPythonProject(dir);
}

describe('Test Suite 3: Conditional Setup for Python Projects', () => {
  describe('Test 3.1: Skips ESLint install for Python-only projects', () => {
    it('should not install eslint in node_modules for Python-only project', async () => {
      createPythonProject(projectDirectory);
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory });

      // Should NOT have node_modules with eslint
      expect(fileExists(projectDirectory, 'node_modules/eslint')).toBe(false);
      expect(fileExists(projectDirectory, 'node_modules/prettier')).toBe(false);
    }, TIMEOUT_SETUP);
  });

  describe('Test 3.2: Skips package.json creation for Python-only', () => {
    it('should not create package.json for pure Python project', async () => {
      createPythonProject(projectDirectory);
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory });

      // package.json should NOT be created
      expect(fileExists(projectDirectory, 'package.json')).toBe(false);
    }, TIMEOUT_SETUP);
  });

  describe('Test 3.3: Shows Python-appropriate next steps', () => {
    it('should mention pip/ruff in output instead of npm/eslint', async () => {
      createPythonProject(projectDirectory);
      initGitRepo(projectDirectory);

      const result = await runCli(['setup', '--yes'], { cwd: projectDirectory });

      // Should mention Python tooling
      expect(result.stdout).toMatch(/pip install|ruff|mypy/i);
      // Should NOT mention npm install for dependencies
      expect(result.stdout).not.toMatch(/npm install.*eslint/i);
    }, TIMEOUT_SETUP);
  });

  describe('Test 3.4: Still creates .safeword directory', () => {
    it('should create .safeword with guides for Python project', async () => {
      createPythonProject(projectDirectory);
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory });

      // .safeword directory should exist
      expect(fileExists(projectDirectory, '.safeword')).toBe(true);
      expect(fileExists(projectDirectory, '.safeword/SAFEWORD.md')).toBe(true);
      expect(fileExists(projectDirectory, '.safeword/guides')).toBe(true);
    }, TIMEOUT_SETUP);
  });

  describe('Test 3.5: Still creates Claude hooks', () => {
    it('should create hooks for Python project', async () => {
      createPythonProject(projectDirectory);
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory });

      // Hooks should exist
      expect(fileExists(projectDirectory, '.safeword/hooks')).toBe(true);
    }, TIMEOUT_SETUP);
  });

  describe('Test 3.6: Installs both toolchains for polyglot projects', () => {
    it('should configure ESLint and mention Ruff for polyglot project', async () => {
      createPolyglotProject(projectDirectory);
      initGitRepo(projectDirectory);

      const result = await runCli(['setup', '--yes'], { cwd: projectDirectory });

      // Should have ESLint configured
      expect(fileExists(projectDirectory, 'eslint.config.mjs')).toBe(true);

      // Should mention Python tooling guidance
      expect(result.stdout).toMatch(/ruff|python/i);
    }, TIMEOUT_BUN_INSTALL);
  });
});
