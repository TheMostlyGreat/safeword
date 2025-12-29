/**
 * E2E Test: Go Golden Path
 *
 * Verifies that a Go project with safeword works correctly:
 * - golangci-lint config (.golangci.yml) is created
 * - golangci-lint runs and catches issues (when installed)
 * - golangci-lint fmt formats Go files (when installed)
 * - Post-tool lint hook processes Go files (when golangci-lint installed)
 *
 * Note: Tests requiring golangci-lint are skipped if not installed.
 * Uses a single project setup (expensive) shared across all tests.
 */

import { execSync, spawnSync } from 'node:child_process';
import nodePath from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createGoProject,
  createTemporaryDirectory,
  fileExists,
  initGitRepo,
  isGolangciLintInstalled,
  readTestFile,
  removeTemporaryDirectory,
  runCli,
  writeTestFile,
} from '../helpers';

const GOLANGCI_LINT_AVAILABLE = isGolangciLintInstalled();

describe('E2E: Go Golden Path', () => {
  let projectDirectory: string;

  beforeAll(async () => {
    projectDirectory = createTemporaryDirectory();
    createGoProject(projectDirectory);
    initGitRepo(projectDirectory);
    await runCli(['setup', '--yes'], { cwd: projectDirectory });
  }, 180_000); // 3 min timeout for setup

  afterAll(() => {
    if (projectDirectory) {
      removeTemporaryDirectory(projectDirectory);
    }
  });

  it('creates .golangci.yml config', () => {
    expect(fileExists(projectDirectory, '.golangci.yml')).toBe(true);

    const config = readTestFile(projectDirectory, '.golangci.yml');

    // Check essential golangci-lint v2 settings
    expect(config).toContain('version: "2"');
    expect(config).toContain('linters:');
    expect(config).toContain('default: all'); // Use all linters for maximum strictness
    expect(config).toContain('formatters:');
    expect(config).toContain('gofumpt');
  });

  it.skipIf(!GOLANGCI_LINT_AVAILABLE)('golangci-lint config is valid', () => {
    // golangci-lint config verify checks if config is valid
    const result = spawnSync('golangci-lint', ['config', 'verify'], {
      cwd: projectDirectory,
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
  });

  it.skipIf(!GOLANGCI_LINT_AVAILABLE)('golangci-lint runs on valid code', () => {
    // main.go from createGoProject should be valid
    const result = spawnSync('golangci-lint', ['run', 'main.go'], {
      cwd: projectDirectory,
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
  });

  it.skipIf(!GOLANGCI_LINT_AVAILABLE)('golangci-lint detects violations', () => {
    // Create a file with an unused import (caught by 'unused' linter in standard set)
    writeTestFile(
      projectDirectory,
      'bad.go',
      `package main

import "fmt" // unused import - will trigger unused linter

func bad() {
	println("not using fmt")
}
`,
    );

    const result = spawnSync('golangci-lint', ['run', 'bad.go'], {
      cwd: projectDirectory,
      encoding: 'utf8',
    });

    // Should fail due to unused import
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toMatch(/unused|import/i);
  });

  it.skipIf(!GOLANGCI_LINT_AVAILABLE)('golangci-lint fmt formats files', () => {
    // Create a badly formatted Go file
    writeTestFile(projectDirectory, 'ugly.go', `package main
func main(){println("no spaces")}`);

    // Run golangci-lint fmt
    execSync('golangci-lint fmt ugly.go', { cwd: projectDirectory });

    const formatted = readTestFile(projectDirectory, 'ugly.go');
    // gofumpt adds proper spacing
    expect(formatted).toContain('func main() {');
  });

  it.skipIf(!GOLANGCI_LINT_AVAILABLE)('post-tool-lint hook processes Go files', () => {
    const filePath = nodePath.join(projectDirectory, 'hook-test.go');
    // Intentionally badly formatted
    writeTestFile(projectDirectory, 'hook-test.go', `package main
func hookTest(){println("test")}`);

    // Simulate Claude Code PostToolUse hook input
    const hookInput = JSON.stringify({
      session_id: 'test-session',
      hook_event_name: 'PostToolUse',
      tool_name: 'Write',
      tool_input: { file_path: filePath },
    });

    // Run the hook
    execSync(`echo '${hookInput}' | bun .safeword/hooks/post-tool-lint.ts`, {
      cwd: projectDirectory,
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
      encoding: 'utf8',
    });

    // File should be formatted by golangci-lint fmt
    const result = readTestFile(projectDirectory, 'hook-test.go');
    expect(result).toContain('func hookTest() {');
  });
});
