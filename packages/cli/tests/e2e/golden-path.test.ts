/**
 * E2E Test: Golden Path
 *
 * Verifies that a safeword-configured project actually works:
 * - ESLint config runs and catches issues
 * - Hook scripts execute correctly
 * - Git pre-commit hook triggers lint-staged
 *
 * Uses a single project setup (expensive) shared across all tests.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import {
  createTempDir,
  removeTempDir,
  createTypeScriptPackageJson,
  initGitRepo,
  runCli,
  readTestFile,
  writeTestFile,
} from '../helpers';

describe('E2E: Golden Path', () => {
  let projectDir: string;

  beforeAll(async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);
    await runCli(['setup', '--yes'], { cwd: projectDir });
  }, 180000); // 3 min timeout for npm install

  afterAll(() => {
    if (projectDir) {
      removeTempDir(projectDir);
    }
  });

  it('eslint config is valid and runs', () => {
    writeTestFile(projectDir, 'src/valid.ts', 'export const x = 1;\n');

    // Should not throw - config is valid
    execSync('npx eslint src/valid.ts', { cwd: projectDir, encoding: 'utf-8' });
  });

  it('eslint detects violations', () => {
    // Use 'var' which is flagged by recommended rules
    writeTestFile(projectDir, 'src/bad.ts', 'var unused = 1;\n');

    // Should throw because of lint errors
    expect(() => {
      execSync('npx eslint src/bad.ts', { cwd: projectDir, encoding: 'utf-8' });
    }).toThrow();
  });

  it('prettier formats files', () => {
    writeTestFile(projectDir, 'src/ugly.ts', 'const x=1;const y=2;\n');

    execSync('npx prettier --write src/ugly.ts', { cwd: projectDir });

    const formatted = readTestFile(projectDir, 'src/ugly.ts');
    // Prettier adds spaces and may split lines
    expect(formatted).toContain('const x = 1');
  });

  it('post-tool-lint hook processes files', () => {
    const filePath = join(projectDir, 'src/hook-test.ts');
    writeTestFile(projectDir, 'src/hook-test.ts', 'const x=1\n');

    // Simulate Claude Code PostToolUse hook input
    // Note: Only tool_input.file_path is used by the hook
    const hookInput = JSON.stringify({
      session_id: 'test-session',
      hook_event_name: 'PostToolUse',
      tool_name: 'Write',
      tool_input: { file_path: filePath },
    });

    // Run the hook
    execSync(`echo '${hookInput}' | bash .safeword/hooks/post-tool-lint.sh`, {
      cwd: projectDir,
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
      encoding: 'utf-8',
    });

    // File should be formatted (Prettier adds semicolon and spaces)
    const result = readTestFile(projectDir, 'src/hook-test.ts');
    expect(result.trim()).toBe('const x = 1;');
  });

  it('stop-quality hook returns valid JSON with message', () => {
    // Create a modified file
    writeTestFile(projectDir, 'src/modified.ts', 'export const modified = true;\n');
    execSync('git add src/modified.ts', { cwd: projectDir });

    // Run stop hook
    const output = execSync('bash .safeword/hooks/stop-quality.sh', {
      cwd: projectDir,
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
      encoding: 'utf-8',
    });

    // Should return valid JSON
    const json = JSON.parse(output);
    expect(json).toHaveProperty('message');
    expect(json.message).toContain('/quality-review');
  });

  it('git commit succeeds with husky pre-commit hook', () => {
    // Create a valid file
    writeTestFile(projectDir, 'src/commit-test.ts', 'export const commitTest = 1;\n');

    // Stage and commit - pre-commit hook (lint-staged) should run and pass
    execSync('git add src/commit-test.ts', { cwd: projectDir });
    execSync('git commit -m "test commit"', { cwd: projectDir, encoding: 'utf-8' });

    // Verify commit was made (proves pre-commit hook passed)
    const log = execSync('git log --oneline -1', { cwd: projectDir, encoding: 'utf-8' });
    expect(log).toContain('test commit');
  });
});
