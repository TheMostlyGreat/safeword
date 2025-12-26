/**
 * Test Suite: Python Tooling Parity (Phase 2)
 * Tests for Phase 2 components - Ruff config, pre-commit, import-linter, deadcode, jscpd
 *
 * Test Definitions: .safeword/planning/test-definitions/phase2-python-tooling.md
 */

import { readFileSync } from 'node:fs';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createPythonProject,
  createTemporaryDirectory,
  fileExists,
  initGitRepo,
  readTestFile,
  removeTemporaryDirectory,
  runCli,
  TIMEOUT_SETUP,
  writeTestFile,
} from '../helpers';

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));

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
 * Helper to create a Python project with layer structure
 * Mirrors ARCHITECTURE_LAYERS pattern from boundaries.ts
 */
function createPythonProjectWithLayers(dir: string): void {
  createPythonProject(dir);
  // Create recognizable layer structure (domain → services → api hierarchy)
  writeTestFile(dir, 'src/domain/__init__.py', '# Domain layer - entities, models');
  writeTestFile(dir, 'src/services/__init__.py', '# Services layer - business logic');
  writeTestFile(dir, 'src/api/__init__.py', '# API layer - routes, handlers');
}

/**
 * Helper to read pyproject.toml content
 */
function readPyprojectToml(dir: string): string {
  return readTestFile(dir, 'pyproject.toml');
}

/**
 * Helper to read the audit.md template content
 */
function readAuditTemplate(): string {
  return readFileSync(nodePath.join(__dirname, '../../templates/commands/audit.md'), 'utf-8');
}

// =============================================================================
// Test Suite 1: Ruff Config Generation
// =============================================================================

describe('Suite 1: Ruff Config Generation', () => {
  it(
    'Test 1.1: Generates [tool.ruff] section',
    async () => {
      // Arrange
      createPythonProject(projectDirectory);
      initGitRepo(projectDirectory);

      // Act
      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });

      // Assert
      const pyprojectContent = readPyprojectToml(projectDirectory);
      expect(pyprojectContent).toContain('[tool.ruff]');
      expect(pyprojectContent).toContain('[tool.ruff.lint]');
      expect(pyprojectContent).toContain('select = [');
      // Verify specific rules from spec
      expect(pyprojectContent).toMatch(/"E"/); // pycodestyle errors
      expect(pyprojectContent).toMatch(/"F"/); // pyflakes
      expect(pyprojectContent).toMatch(/"B"/); // bugbear
    },
    TIMEOUT_SETUP,
  );

  it(
    'Test 1.1b: Preserves existing pyproject.toml content',
    async () => {
      // Arrange
      writeTestFile(
        projectDirectory,
        'pyproject.toml',
        `[project]
name = "existing-project"
version = "2.0.0"
description = "An existing project"

[tool.pytest.ini_options]
testpaths = ["tests"]
`,
      );
      initGitRepo(projectDirectory);

      // Act
      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });

      // Assert
      const pyprojectContent = readPyprojectToml(projectDirectory);
      // Original content preserved
      expect(pyprojectContent).toContain('name = "existing-project"');
      expect(pyprojectContent).toContain('description = "An existing project"');
      expect(pyprojectContent).toContain('[tool.pytest.ini_options]');
      // New content added
      expect(pyprojectContent).toContain('[tool.ruff]');
    },
    TIMEOUT_SETUP,
  );
});

// =============================================================================
// Test Suite 2: Pre-commit Integration
// =============================================================================

describe('Suite 2: Pre-commit Integration', () => {
  it(
    'Test 2.1: Generates .pre-commit-config.yaml',
    async () => {
      // Arrange
      createPythonProject(projectDirectory);
      initGitRepo(projectDirectory);

      // Act
      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });

      // Assert
      expect(fileExists(projectDirectory, '.pre-commit-config.yaml')).toBe(true);
      const preCommitContent = readTestFile(projectDirectory, '.pre-commit-config.yaml');
      expect(preCommitContent).toContain('ruff-pre-commit');
      expect(preCommitContent).toContain('ruff-check');
      expect(preCommitContent).toContain('ruff-format');
    },
    TIMEOUT_SETUP,
  );

  it(
    'Test 2.1b: Does not create pre-commit config without git',
    async () => {
      // Arrange
      createPythonProject(projectDirectory);
      // Note: NOT initializing git

      // Act
      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });

      // Assert
      expect(fileExists(projectDirectory, '.pre-commit-config.yaml')).toBe(false);
    },
    TIMEOUT_SETUP,
  );
});

// =============================================================================
// Test Suite 3: Architecture Validation (import-linter)
// =============================================================================

describe('Suite 3: Architecture Validation', () => {
  it(
    'Test 3.1: Generates import-linter config',
    async () => {
      // Arrange
      createPythonProjectWithLayers(projectDirectory);
      initGitRepo(projectDirectory);

      // Act
      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });

      // Assert
      const pyprojectContent = readPyprojectToml(projectDirectory);
      expect(pyprojectContent).toContain('[tool.importlinter]');
      // Should have layer contracts
      expect(pyprojectContent).toMatch(/\[tool\.importlinter\.contracts/);
    },
    TIMEOUT_SETUP,
  );

  it(
    'Test 3.1b: Does not generate import-linter without layer structure',
    async () => {
      // Arrange
      createPythonProject(projectDirectory); // No layers
      initGitRepo(projectDirectory);

      // Act
      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });

      // Assert
      const pyprojectContent = readPyprojectToml(projectDirectory);
      expect(pyprojectContent).not.toContain('[tool.importlinter]');
    },
    TIMEOUT_SETUP,
  );
});

// =============================================================================
// Test Suite 4: Dead Code Detection
// =============================================================================

describe('Suite 4: Dead Code Detection', () => {
  it('Test 4.1: /audit template includes deadcode for Python', () => {
    // Assert: audit.md template contains deadcode command
    const auditTemplate = readAuditTemplate();
    expect(auditTemplate).toContain('deadcode');
    // Should detect Python projects
    expect(auditTemplate).toMatch(/pyproject\.toml|requirements\.txt/);
  });
});

// =============================================================================
// Test Suite 5: Copy/Paste Detection
// =============================================================================

describe('Suite 5: Copy/Paste Detection', () => {
  it('Test 5.1: /audit template includes jscpd', () => {
    // Assert: audit.md template contains jscpd command
    const auditTemplate = readAuditTemplate();
    expect(auditTemplate).toContain('jscpd');
  });
});
