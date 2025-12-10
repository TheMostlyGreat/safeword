/**
 * Test Suite 3: Setup - Hooks and Skills
 *
 * Tests for Claude Code hook registration and skill copying.
 */

import { chmodSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach,beforeEach, describe, expect, it } from 'vitest';

import {
  createTempDir,
  createTypeScriptPackageJson,
  fileExists,
  initGitRepo,
  readTestFile,
  removeTempDir,
  runCli,
  writeTestFile,
} from '../helpers';

interface HookCommand {
  command?: string;
}

interface HookEntry {
  hooks?: HookCommand[];
}

/** Check if hook entry contains command matching pattern */
function hasHookCommand(entry: HookEntry, pattern: string): boolean {
  return entry.hooks?.some(h => h.command?.includes(pattern)) ?? false;
}

describe('Test Suite 3: Setup - Hooks and Skills', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('Test 3.1: Registers hooks in settings.json', () => {
    it('should create .claude/settings.json with hooks', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, '.claude/settings.json')).toBe(true);

      const settings = JSON.parse(readTestFile(tempDir, '.claude/settings.json'));

      expect(settings.hooks).toBeDefined();
      expect(settings.hooks.SessionStart).toBeDefined();
      expect(Array.isArray(settings.hooks.SessionStart)).toBe(true);
      expect(settings.hooks.UserPromptSubmit).toBeDefined();
      expect(Array.isArray(settings.hooks.UserPromptSubmit)).toBe(true);
      expect(settings.hooks.PostToolUse).toBeDefined();
      expect(Array.isArray(settings.hooks.PostToolUse)).toBe(true);
    });

    it('should reference .safeword/hooks paths', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const settings = JSON.parse(readTestFile(tempDir, '.claude/settings.json'));
      const settingsStr = JSON.stringify(settings);

      // At least one hook should reference .safeword/hooks
      expect(settingsStr).toContain('.safeword/hooks');
    });
  });

  describe('Test 3.2: Copies skills to .claude/skills', () => {
    it('should create skills directory with safeword skills', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, '.claude/skills')).toBe(true);

      // Check for safeword skill directory
      // Should match pattern safeword-* (e.g., safeword-quality-reviewer)
      expect(fileExists(tempDir, '.claude/skills/safeword-quality-reviewer')).toBe(true);

      // The skill should contain a SKILL.md file
      expect(fileExists(tempDir, '.claude/skills/safeword-quality-reviewer/SKILL.md')).toBe(true);

      const skillContent = readTestFile(
        tempDir,
        '.claude/skills/safeword-quality-reviewer/SKILL.md',
      );
      expect(skillContent).toContain('Quality Reviewer');
    });
  });

  describe('Test 3.3: Preserves existing hooks', () => {
    it('should append to existing hooks without replacing', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      // Create existing settings with custom hook
      const existingSettings = {
        hooks: {
          SessionStart: [
            {
              command: 'echo "My custom hook"',
              description: 'Custom SessionStart hook',
            },
          ],
        },
      };
      writeTestFile(tempDir, '.claude/settings.json', JSON.stringify(existingSettings, null, 2));

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const settings = JSON.parse(readTestFile(tempDir, '.claude/settings.json'));

      // Custom hook should still be present
      const hasCustomHook = settings.hooks.SessionStart.some(
        (hook: { command?: string }) => hook.command === 'echo "My custom hook"',
      );
      expect(hasCustomHook).toBe(true);

      // Safeword hooks should be added
      expect(settings.hooks.SessionStart.length).toBeGreaterThan(1);
    });
  });

  describe('Test 3.4: Includes SessionStart hook for AGENTS.md', () => {
    it('should include AGENTS.md verification hook', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const settings = JSON.parse(readTestFile(tempDir, '.claude/settings.json'));

      // Find hook entry that references AGENTS.md check (new nested format)
      const agentsHookEntry = settings.hooks.SessionStart.find(
        (entry: HookEntry) => hasHookCommand(entry, 'AGENTS') || hasHookCommand(entry, 'agents'),
      );

      expect(agentsHookEntry).toBeDefined();

      // Hook script should exist
      const agentsCommand = agentsHookEntry?.hooks?.[0]?.command;
      if (agentsCommand) {
        // Extract script path from command if it's a bash script
        const scriptMatch = agentsCommand.match(/bash\s+([^\s]+)/);
        if (scriptMatch) {
          expect(fileExists(tempDir, scriptMatch[1])).toBe(true);
        }
      }
    });
  });

  describe('Test 3.6: Includes UserPromptSubmit hook for timestamp injection', () => {
    it('should include timestamp injection hook', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const settings = JSON.parse(readTestFile(tempDir, '.claude/settings.json'));

      // Find hook entry that references timestamp injection (new nested format)
      const timestampHookEntry = settings.hooks.UserPromptSubmit.find((entry: HookEntry) =>
        hasHookCommand(entry, 'prompt-timestamp'),
      );

      expect(timestampHookEntry).toBeDefined();

      // Hook script should exist
      expect(fileExists(tempDir, '.safeword/hooks/prompt-timestamp.sh')).toBe(true);

      // Script should contain timestamp output
      const scriptContent = readTestFile(tempDir, '.safeword/hooks/prompt-timestamp.sh');
      expect(scriptContent).toContain('date');
    });
  });

  describe('Test 3.5: Exit 1 if hook registration fails', () => {
    it('should fail with exit 1 when settings.json is not writable', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      // Create .claude directory with read-only settings.json
      writeTestFile(tempDir, '.claude/settings.json', '{}');
      chmodSync(join(tempDir, '.claude/settings.json'), 0o444);

      const result = await runCli(['setup', '--yes'], { cwd: tempDir });

      // Restore permissions for cleanup
      chmodSync(join(tempDir, '.claude/settings.json'), 0o644);

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toMatch(/hook|permission|write|failed/i);
    });
  });

  describe('Test 3.7: Installs lib scripts', () => {
    it('should install shared library scripts to .safeword/lib/', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      // Lib directory should exist with shell scripts
      expect(fileExists(tempDir, '.safeword/lib')).toBe(true);

      const libDir = join(tempDir, '.safeword/lib');
      const shFiles = readdirSync(libDir).filter(f => f.endsWith('.sh'));
      expect(shFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Test 3.8: Sets up MCP servers', () => {
    it('should create .mcp.json with context7 and playwright', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, '.mcp.json')).toBe(true);

      const mcpConfig = JSON.parse(readTestFile(tempDir, '.mcp.json'));
      expect(mcpConfig.mcpServers).toBeDefined();
      expect(mcpConfig.mcpServers.context7).toBeDefined();
      expect(mcpConfig.mcpServers.playwright).toBeDefined();
    });
  });

  describe('Test 3.9: Preserves existing MCP servers', () => {
    it('should preserve user MCP servers when adding safeword servers', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      // Create existing .mcp.json with custom server
      const existingMcp = {
        mcpServers: {
          'my-custom-server': {
            command: 'my-server',
            args: ['--port', '3000'],
          },
        },
      };
      writeTestFile(tempDir, '.mcp.json', JSON.stringify(existingMcp, null, 2));

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const mcpConfig = JSON.parse(readTestFile(tempDir, '.mcp.json'));

      // Custom server should be preserved
      expect(mcpConfig.mcpServers['my-custom-server']).toBeDefined();
      expect(mcpConfig.mcpServers['my-custom-server'].command).toBe('my-server');

      // Safeword servers should be added
      expect(mcpConfig.mcpServers.context7).toBeDefined();
      expect(mcpConfig.mcpServers.playwright).toBeDefined();
    });
  });

  describe('Test 3.10: Installs slash commands', () => {
    it('should install slash commands to .claude/commands/', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      // Commands directory should exist
      expect(fileExists(tempDir, '.claude/commands')).toBe(true);

      // Should contain markdown command files
      const commandsDir = join(tempDir, '.claude/commands');
      const mdFiles = readdirSync(commandsDir).filter(f => f.endsWith('.md'));
      expect(mdFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Test 3.11: MCP servers work out of the box', () => {
    it('should configure context7 with correct npx command', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      expect(fileExists(tempDir, '.mcp.json')).toBe(true);

      const mcpConfig = JSON.parse(readTestFile(tempDir, '.mcp.json'));

      // Context7 should use npx with the correct package
      expect(mcpConfig.mcpServers.context7).toBeDefined();
      expect(mcpConfig.mcpServers.context7.command).toBe('npx');
      expect(mcpConfig.mcpServers.context7.args).toContain('@upstash/context7-mcp@latest');
    });

    it('should configure playwright with correct npx command', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      await runCli(['setup', '--yes'], { cwd: tempDir });

      const mcpConfig = JSON.parse(readTestFile(tempDir, '.mcp.json'));

      // Playwright should use npx with the correct package
      expect(mcpConfig.mcpServers.playwright).toBeDefined();
      expect(mcpConfig.mcpServers.playwright.command).toBe('npx');
      expect(mcpConfig.mcpServers.playwright.args).toEqual(
        expect.arrayContaining([expect.stringContaining('@playwright/mcp')]),
      );
    });

    it('should have MCP packages that can be resolved by npx', async () => {
      // Verify the packages exist on npm (can be resolved)
      // This is a lightweight check - just verify npm can find the packages
      const { execSync } = await import('node:child_process');

      // Check context7 package exists
      try {
        execSync('npm view @upstash/context7-mcp version', {
          encoding: 'utf-8',
          timeout: 10000,
        });
      } catch {
        expect.fail('@upstash/context7-mcp package not found on npm');
      }

      // Check playwright package exists
      try {
        execSync('npm view @playwright/mcp version', {
          encoding: 'utf-8',
          timeout: 10000,
        });
      } catch {
        expect.fail('@playwright/mcp package not found on npm');
      }
    });
  });
});
