/**
 * Test Suite: Conditional Setup for Go Projects
 * Tests for setup behavior for Go-only projects.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createGoProject,
  createTemporaryDirectory,
  fileExists,
  initGitRepo,
  readTestFile,
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
 * Helper to create a polyglot project (JS + Go)
 */
function createJsGoProject(dir: string): void {
  // Create package.json
  writeTestFile(
    dir,
    'package.json',
    JSON.stringify(
      {
        name: 'test-js-go',
        version: '1.0.0',
        devDependencies: {
          typescript: '^5.0.0',
        },
      },
      undefined,
      2,
    ),
  );

  // Create go.mod
  createGoProject(dir);
}

describe('Test Suite: Conditional Setup for Go Projects', () => {
  describe('Test: Skips ESLint install for Go-only projects', () => {
    it(
      'should not install eslint in node_modules for Go-only project',
      async () => {
        createGoProject(projectDirectory);
        initGitRepo(projectDirectory);

        await runCli(['setup'], { cwd: projectDirectory });

        // Should NOT have node_modules with eslint
        expect(fileExists(projectDirectory, 'node_modules/eslint')).toBe(false);
        expect(fileExists(projectDirectory, 'node_modules/prettier')).toBe(false);
      },
      TIMEOUT_SETUP,
    );
  });

  describe('Test: Skips package.json creation for Go-only', () => {
    it(
      'should not create package.json for pure Go project',
      async () => {
        createGoProject(projectDirectory);
        initGitRepo(projectDirectory);

        await runCli(['setup'], { cwd: projectDirectory });

        // package.json should NOT be created
        expect(fileExists(projectDirectory, 'package.json')).toBe(false);
      },
      TIMEOUT_SETUP,
    );
  });

  describe('Test: Creates .golangci.yml for Go project', () => {
    it(
      'should create golangci-lint config for Go project',
      async () => {
        createGoProject(projectDirectory);
        initGitRepo(projectDirectory);

        await runCli(['setup'], { cwd: projectDirectory });

        // .golangci.yml should be created
        expect(fileExists(projectDirectory, '.golangci.yml')).toBe(true);

        const config = readTestFile(projectDirectory, '.golangci.yml');
        expect(config).toContain('version: "2"');
        expect(config).toContain('linters:');
      },
      TIMEOUT_SETUP,
    );
  });

  describe('Test: Shows Go-appropriate next steps', () => {
    it(
      'should mention golangci-lint in output instead of npm/eslint',
      async () => {
        createGoProject(projectDirectory);
        initGitRepo(projectDirectory);

        const result = await runCli(['setup'], {
          cwd: projectDirectory,
        });

        // Should mention Go tooling
        expect(result.stdout).toMatch(/golangci-lint/i);
        // Should NOT mention npm install for dependencies
        expect(result.stdout).not.toMatch(/npm install.*eslint/i);
      },
      TIMEOUT_SETUP,
    );
  });

  describe('Test: Still creates .safeword directory', () => {
    it(
      'should create .safeword with guides for Go project',
      async () => {
        createGoProject(projectDirectory);
        initGitRepo(projectDirectory);

        await runCli(['setup'], { cwd: projectDirectory });

        // .safeword directory should exist
        expect(fileExists(projectDirectory, '.safeword')).toBe(true);
        expect(fileExists(projectDirectory, '.safeword/SAFEWORD.md')).toBe(true);
        expect(fileExists(projectDirectory, '.safeword/guides')).toBe(true);
      },
      TIMEOUT_SETUP,
    );
  });

  describe('Test: Still creates Claude hooks', () => {
    it(
      'should create hooks for Go project',
      async () => {
        createGoProject(projectDirectory);
        initGitRepo(projectDirectory);

        await runCli(['setup'], { cwd: projectDirectory });

        // Hooks should exist
        expect(fileExists(projectDirectory, '.safeword/hooks')).toBe(true);
        expect(fileExists(projectDirectory, '.safeword/hooks/post-tool-lint.ts')).toBe(true);
      },
      TIMEOUT_SETUP,
    );
  });

  describe('Test: Installs both toolchains for polyglot projects', () => {
    it(
      'should configure ESLint AND create .golangci.yml for JS+Go project',
      async () => {
        createJsGoProject(projectDirectory);
        initGitRepo(projectDirectory);

        await runCli(['setup'], { cwd: projectDirectory });

        // Should have ESLint configured (JS tooling)
        expect(fileExists(projectDirectory, 'eslint.config.mjs')).toBe(true);

        // Should have golangci-lint configured (Go tooling)
        expect(fileExists(projectDirectory, '.golangci.yml')).toBe(true);
      },
      TIMEOUT_BUN_INSTALL,
    );
  });

  describe('Test: Preserves existing .golangci.yml', () => {
    it(
      'should not overwrite existing golangci-lint config',
      async () => {
        createGoProject(projectDirectory);
        initGitRepo(projectDirectory);

        // Create custom config before setup
        const customConfig = `# My custom config
version: "2"
linters:
  enable:
    - customlinter
`;
        writeTestFile(projectDirectory, '.golangci.yml', customConfig);

        await runCli(['setup'], { cwd: projectDirectory });

        // Should preserve custom config
        const config = readTestFile(projectDirectory, '.golangci.yml');
        expect(config).toContain('customlinter');
        expect(config).not.toContain('Generated by safeword');
      },
      TIMEOUT_SETUP,
    );
  });
});
