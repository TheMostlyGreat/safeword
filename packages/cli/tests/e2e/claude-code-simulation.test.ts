/**
 * E2E Test: Claude Code Hook Path Resolution
 *
 * Simulates Claude Code executing hooks from a DIFFERENT working directory.
 * This catches the bug where relative paths fail because Claude Code's cwd
 * differs from the project root.
 *
 * Path format is tested in conditional-setup.test.ts.
 * Hook behavior is tested in hooks.test.ts.
 * This only tests that hooks are reachable from different cwd.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  createTempDir,
  removeTempDir,
  createTypeScriptPackageJson,
  initGitRepo,
  runCli,
  readTestFile,
} from '../helpers';

describe('E2E: Claude Code Hook Path Resolution', () => {
  let projectDir: string;
  let differentDir: string;

  beforeAll(async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);
    await runCli(['setup', '--yes'], { cwd: projectDir });
    differentDir = createTempDir();
  }, 180000);

  afterAll(() => {
    if (projectDir) removeTempDir(projectDir);
    if (differentDir) removeTempDir(differentDir);
  });

  it('all hooks execute without "not found" errors from different cwd', () => {
    const settings = JSON.parse(readTestFile(projectDir, '.claude/settings.json'));
    const commands: string[] = [];

    // Extract all hook commands
    for (const entries of Object.values(settings.hooks || {})) {
      for (const entry of entries as { hooks: { type: string; command: string }[] }[]) {
        for (const hook of entry.hooks) {
          if (hook.type === 'command') commands.push(hook.command);
        }
      }
    }

    expect(commands.length).toBeGreaterThan(0);

    const failures: string[] = [];
    for (const command of commands) {
      const result = spawnSync('/bin/sh', ['-c', command], {
        cwd: differentDir, // Simulates Claude Code running from different directory
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
        encoding: 'utf-8',
        timeout: 10000,
      });

      if (result.status === 127 || /not found|no such file/i.test(result.stderr + result.stdout)) {
        failures.push(`${command}\n  → ${result.stderr || result.stdout || 'exit 127'}`);
      }
    }

    if (failures.length > 0) {
      expect.fail(`Hooks not reachable from different cwd:\n\n${failures.join('\n\n')}`);
    }
  });
});
