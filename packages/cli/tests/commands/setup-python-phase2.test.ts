/**
 * Test Suite: Python Tooling Parity (Phase 2)
 * Tests for Phase 2 components - Ruff config, import-linter, deadcode, jscpd, mypy
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
  isUvInstalled,
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
  return readFileSync(nodePath.join(__dirname, '../../templates/commands/audit.md'), 'utf8');
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
// Test Suite 2: Architecture Validation (import-linter)
// =============================================================================

describe('Suite 2: Architecture Validation', () => {
  it(
    'Test 2.1: Generates import-linter config',
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
    'Test 2.1b: Does not generate import-linter without layer structure',
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
// Test Suite 3: Dead Code Detection
// =============================================================================

describe('Suite 3: Dead Code Detection', () => {
  it('Test 3.1: /audit template includes deadcode for Python', () => {
    // Assert: audit.md template contains deadcode command
    const auditTemplate = readAuditTemplate();
    expect(auditTemplate).toContain('deadcode');
    // Should detect Python projects
    expect(auditTemplate).toMatch(/pyproject\.toml|requirements\.txt/);
  });
});

// =============================================================================
// Test Suite 4: Copy/Paste Detection
// =============================================================================

describe('Suite 4: Copy/Paste Detection', () => {
  it('Test 4.1: /audit template includes jscpd', () => {
    // Assert: audit.md template contains jscpd command
    const auditTemplate = readAuditTemplate();
    expect(auditTemplate).toContain('jscpd');
  });

  it('Test 4.2: jscpd uses --gitignore flag', () => {
    const auditTemplate = readAuditTemplate();
    expect(auditTemplate).toContain('--gitignore');
  });

  it('Test 4.3: jscpd uses --min-lines 10', () => {
    const auditTemplate = readAuditTemplate();
    expect(auditTemplate).toMatch(/--min-lines\s+10/);
  });
});

// =============================================================================
// Test Suite 5: mypy Configuration
// =============================================================================

describe('Suite 5: mypy Configuration', () => {
  it(
    'Test 5.1: Generates [tool.mypy] section',
    async () => {
      // Arrange
      createPythonProject(projectDirectory);
      initGitRepo(projectDirectory);

      // Act
      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });

      // Assert
      const pyprojectContent = readPyprojectToml(projectDirectory);
      expect(pyprojectContent).toContain('[tool.mypy]');
      expect(pyprojectContent).toContain('ignore_missing_imports = true');
      expect(pyprojectContent).toContain('show_error_codes = true');
      expect(pyprojectContent).toContain('pretty = true');
    },
    TIMEOUT_SETUP,
  );

  it(
    'Test 5.2: Does not overwrite existing [tool.mypy]',
    async () => {
      // Arrange
      writeTestFile(
        projectDirectory,
        'pyproject.toml',
        `[project]
name = "test"

[tool.mypy]
strict = true
`,
      );
      initGitRepo(projectDirectory);

      // Act
      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });

      // Assert
      const pyprojectContent = readPyprojectToml(projectDirectory);
      // Should preserve user's strict setting
      expect(pyprojectContent).toContain('strict = true');
      // Should NOT add our defaults
      expect(pyprojectContent).not.toContain('ignore_missing_imports');
    },
    TIMEOUT_SETUP,
  );
});

// =============================================================================
// Test Suite 6: Auto-Install Python Tools
// =============================================================================

const UV_AVAILABLE = isUvInstalled();

describe('Suite 6: Auto-Install Python Tools', () => {
  it(
    'Test 6.1: Shows install message for pip projects (no auto-install)',
    async () => {
      // Arrange - pip project (default, no lockfile)
      createPythonProject(projectDirectory);
      initGitRepo(projectDirectory);

      // Act
      const result = await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });

      // Assert - should show manual install instruction
      expect(result.stdout).toContain('Install Python tools');
      expect(result.stdout).toContain('pip install');
    },
    TIMEOUT_SETUP,
  );

  it.skipIf(!UV_AVAILABLE)(
    'Test 6.2: Auto-installs tools for uv projects',
    async () => {
      // Arrange - uv project with uv.lock
      createPythonProject(projectDirectory, { manager: 'uv' });
      initGitRepo(projectDirectory);

      // Act
      const result = await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });

      // Assert - should show success message, not manual install
      expect(result.stdout).toContain('Installing Python tools');
      expect(result.stdout).toContain('Python tools installed');
      expect(result.stdout).not.toContain('Install Python tools:'); // No manual instruction

      // Verify ruff was added to pyproject.toml
      const pyproject = readTestFile(projectDirectory, 'pyproject.toml');
      expect(pyproject).toContain('ruff');
    },
    TIMEOUT_SETUP,
  );

  it(
    'Test 6.3: Skips install if ruff already in dependencies',
    async () => {
      // Arrange - project with ruff already declared
      writeTestFile(
        projectDirectory,
        'pyproject.toml',
        `[project]
name = "test"
version = "0.1.0"

[project.optional-dependencies]
dev = ["ruff>=0.8.0"]
`,
      );
      initGitRepo(projectDirectory);

      // Act
      const result = await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });

      // Assert - should NOT show install message (already has ruff)
      expect(result.stdout).not.toContain('Installing Python tools');
      expect(result.stdout).not.toContain('Install Python tools:');
    },
    TIMEOUT_SETUP,
  );

  it(
    'Test 6.4: Shows poetry install command for poetry projects',
    async () => {
      // Arrange - poetry project (pip fallback to show message)
      writeTestFile(
        projectDirectory,
        'pyproject.toml',
        `[project]
name = "test"
version = "0.1.0"

[tool.poetry]
name = "test"
`,
      );
      // Note: No poetry.lock, so install will fail and show fallback message
      initGitRepo(projectDirectory);

      // Act
      const result = await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });

      // Assert - Poetry project detected, shows poetry command in fallback
      // (install fails without poetry.lock, so fallback shown)
      expect(result.stdout).toMatch(/poetry add/);
    },
    TIMEOUT_SETUP,
  );

  it(
    'Test 6.5: Shows pipenv install command for pipenv projects',
    async () => {
      // Arrange - pipenv project
      createPythonProject(projectDirectory, { manager: 'pipenv' });
      initGitRepo(projectDirectory);

      // Act
      const result = await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });

      // Assert - Pipenv project detected
      expect(result.stdout).toMatch(/pipenv install/);
    },
    TIMEOUT_SETUP,
  );
});
