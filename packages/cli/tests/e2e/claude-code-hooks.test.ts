/**
 * E2E Test: Claude Code Hook Execution
 *
 * Tests that safeword hooks fire when Claude Code runs in headless mode.
 *
 * Requires:
 * - Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)
 * - ANTHROPIC_API_KEY environment variable set
 *
 * Run with: bun run test:e2e
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createTemporaryDirectory,
  createTypeScriptPackageJson,
  initGitRepo,
  removeTemporaryDirectory,
  runCli,
} from '../helpers';

function isClaudeCodeInstalled(): boolean {
  try {
    execSync('claude --version', { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getSkipReason(): string | null {
  if (!isClaudeCodeInstalled()) {
    return 'Claude Code CLI not installed (npm i -g @anthropic-ai/claude-code)';
  }
  if (!hasApiKey()) {
    return 'ANTHROPIC_API_KEY not set';
  }
  return null;
}

describe('E2E: Claude Code Hook Execution', () => {
  const skipReason = getSkipReason();

  if (skipReason) {
    it.skip(`skipped: ${skipReason}`, () => {});
    return;
  }

  let projectDir: string;
  let markerFile: string;

  beforeAll(async () => {
    projectDir = createTemporaryDirectory();
    markerFile = join(projectDir, '.hook-executed');

    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);
    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Inject a marker hook that creates a file when PostToolUse fires
    // NOTE: matcher must be a string, not an object
    const settingsPath = join(projectDir, '.claude/settings.json');
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));

    const testHook = {
      matcher: 'Write', // String, not {tool_name: "Write"}
      hooks: [{ type: 'command', command: `touch "${markerFile}"` }],
    };

    settings.hooks = settings.hooks || {};
    settings.hooks.PostToolUse = settings.hooks.PostToolUse || [];
    settings.hooks.PostToolUse.unshift(testHook);

    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }, 180_000);

  afterAll(() => {
    if (projectDir) removeTemporaryDirectory(projectDir);
  });

  it('PostToolUse hook fires when Claude writes a file', () => {
    expect(existsSync(markerFile)).toBe(false);

    const result = spawnSync(
      'claude',
      ['-p', 'Create hello.txt with "test"', '--allowedTools', 'Write', '--dangerously-skip-permissions'],
      { cwd: projectDir, env: { ...process.env }, encoding: 'utf8', timeout: 120_000 },
    );

    if (result.status !== 0) {
      console.log('stdout:', result.stdout);
      console.log('stderr:', result.stderr);
    }

    expect(result.status).toBe(0);
    expect(existsSync(join(projectDir, 'hello.txt'))).toBe(true);
    expect(existsSync(markerFile)).toBe(true);
  }, 180_000);
});
