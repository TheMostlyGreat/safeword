/**
 * Test Suite: Setup - Cursor IDE Support
 *
 * Tests for Cursor IDE configuration (rules, commands, hooks, MCP).
 */

import { afterEach,beforeEach, describe, expect, it } from 'vitest';

import {
  createTempDir,
  createTypeScriptPackageJson,
  fileExists,
  initGitRepo,
  readTestFile,
  removeTempDir,
  runCli,
} from '../helpers';

describe('Test Suite: Setup - Cursor IDE Support', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('Cursor Rules', () => {
    it('should create .cursor/rules/safeword-core.mdc', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, '.cursor/rules/safeword-core.mdc')).toBe(true);

      const content = readTestFile(tempDir, '.cursor/rules/safeword-core.mdc');
      expect(content).toContain('alwaysApply: true');
      expect(content).toContain('@.safeword/SAFEWORD.md');
    });
  });

  describe('Cursor Commands', () => {
    it('should create .cursor/commands/ directory with command files', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, '.cursor/commands')).toBe(true);
      expect(fileExists(tempDir, '.cursor/commands/lint.md')).toBe(true);
      expect(fileExists(tempDir, '.cursor/commands/quality-review.md')).toBe(true);
      expect(fileExists(tempDir, '.cursor/commands/architecture.md')).toBe(true);
    });

    it('should have same content as Claude commands', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const claudeLint = readTestFile(tempDir, '.claude/commands/lint.md');
      const cursorLint = readTestFile(tempDir, '.cursor/commands/lint.md');
      expect(cursorLint).toBe(claudeLint);
    });
  });

  describe('Cursor Hooks', () => {
    it('should create .cursor/hooks.json with version and hooks', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, '.cursor/hooks.json')).toBe(true);

      const hooksConfig = JSON.parse(readTestFile(tempDir, '.cursor/hooks.json'));
      expect(hooksConfig.version).toBe(1);
      expect(hooksConfig.hooks).toBeDefined();
      expect(hooksConfig.hooks.afterFileEdit).toBeDefined();
      expect(hooksConfig.hooks.stop).toBeDefined();
    });

    it('should create Cursor hook scripts in .safeword/hooks/cursor/', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, '.safeword/hooks/cursor/after-file-edit.sh')).toBe(true);
      expect(fileExists(tempDir, '.safeword/hooks/cursor/stop.sh')).toBe(true);
    });

    it('should reference correct hook script paths in hooks.json', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const hooksConfig = JSON.parse(readTestFile(tempDir, '.cursor/hooks.json'));
      expect(hooksConfig.hooks.afterFileEdit[0].command).toBe(
        './.safeword/hooks/cursor/after-file-edit.sh',
      );
      expect(hooksConfig.hooks.stop[0].command).toBe('./.safeword/hooks/cursor/stop.sh');
    });
  });

  describe('Cursor MCP Configuration', () => {
    it('should create .cursor/mcp.json with same servers as .mcp.json', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, '.cursor/mcp.json')).toBe(true);

      const cursorMcp = JSON.parse(readTestFile(tempDir, '.cursor/mcp.json'));
      const claudeMcp = JSON.parse(readTestFile(tempDir, '.mcp.json'));

      expect(cursorMcp.mcpServers.context7).toEqual(claudeMcp.mcpServers.context7);
      expect(cursorMcp.mcpServers.playwright).toEqual(claudeMcp.mcpServers.playwright);
    });
  });

  describe('Reset removes Cursor files', () => {
    it('should remove .cursor directory on reset', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });
      expect(fileExists(tempDir, '.cursor')).toBe(true);

      await runCli(['reset', '--yes'], { cwd: tempDir });
      expect(fileExists(tempDir, '.cursor')).toBe(false);
    });

    it('should remove .safeword/hooks/cursor/ on reset', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });
      expect(fileExists(tempDir, '.safeword/hooks/cursor')).toBe(true);

      await runCli(['reset', '--yes'], { cwd: tempDir });
      expect(fileExists(tempDir, '.safeword/hooks/cursor')).toBe(false);
    });
  });
});
