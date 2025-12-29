/**
 * E2E Test: Claude Code Hooks
 *
 * Verifies that all safeword hooks work correctly:
 * - SessionStart hooks (version, verify-agents, lint-check)
 * - UserPromptSubmit hooks (timestamp, questions)
 * - Stop hook (quality review reminder)
 * - PostToolUse hook (auto-lint) - tested in golden-path.test.ts
 *
 * Uses a single project setup (expensive) shared across all tests.
 */

import { execSync, spawnSync } from 'node:child_process';
import { dirname } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createTemporaryDirectory,
  createTypeScriptPackageJson,
  fileExists,
  initGitRepo,
  isRuffInstalled,
  readTestFile,
  removeTemporaryDirectory,
  runCli,
  writeTestFile,
} from '../helpers';

const RUFF_AVAILABLE = isRuffInstalled();

// Single setup for all hook tests - sharing avoids 3 separate bun installs
// Tests must be idempotent or restore state after modification (see try/finally blocks)
let projectDirectory: string;

beforeAll(async () => {
  projectDirectory = createTemporaryDirectory();
  createTypeScriptPackageJson(projectDirectory);
  initGitRepo(projectDirectory);
  await runCli(['setup', '--yes'], { cwd: projectDirectory });
}, 180_000);

afterAll(() => {
  if (projectDirectory) {
    removeTemporaryDirectory(projectDirectory);
  }
});

describe('E2E: SessionStart Hooks', () => {
  describe('session-version.ts', () => {
    it('outputs version message for safeword project', () => {
      const output = execSync('bun .safeword/hooks/session-version.ts', {
        cwd: projectDirectory,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
        encoding: 'utf8',
      });

      expect(output).toContain('SAFE WORD');
      expect(output).toContain('installed');
      expect(output).toMatch(/v\d+\.\d+\.\d+/); // Version format
    });

    it('exits silently for non-safeword project', () => {
      const nonSafewordDirectory = createTemporaryDirectory();
      try {
        // Run in a directory without .safeword
        const output = execSync('bun .safeword/hooks/session-version.ts', {
          cwd: projectDirectory, // Script is here
          env: { ...process.env, CLAUDE_PROJECT_DIR: nonSafewordDirectory }, // But points to non-safeword dir
          encoding: 'utf8',
        });

        // Should output nothing (silent exit)
        expect(output.trim()).toBe('');
      } finally {
        removeTemporaryDirectory(nonSafewordDirectory);
      }
    });
  });

  describe('session-verify-agents.ts', () => {
    it('creates AGENTS.md if missing', () => {
      // Remove AGENTS.md
      execSync('rm -f AGENTS.md', { cwd: projectDirectory });
      expect(fileExists(projectDirectory, 'AGENTS.md')).toBe(false);

      const output = execSync('bun .safeword/hooks/session-verify-agents.ts', {
        cwd: projectDirectory,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
        encoding: 'utf8',
      });

      expect(fileExists(projectDirectory, 'AGENTS.md')).toBe(true);
      expect(output).toContain('Created AGENTS.md');

      const content = readTestFile(projectDirectory, 'AGENTS.md');
      expect(content).toContain('.safeword/SAFEWORD.md');
    });

    it('restores link if removed from AGENTS.md', () => {
      // Overwrite AGENTS.md without the link
      writeTestFile(projectDirectory, 'AGENTS.md', '# My Project\n\nSome content\n');

      const output = execSync('bun .safeword/hooks/session-verify-agents.ts', {
        cwd: projectDirectory,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
        encoding: 'utf8',
      });

      expect(output).toContain('Restored AGENTS.md link');

      const content = readTestFile(projectDirectory, 'AGENTS.md');
      expect(content).toContain('.safeword/SAFEWORD.md');
      expect(content).toContain('My Project'); // Original content preserved
    });

    it('does nothing if link already present', () => {
      // Ensure link is present
      const originalContent = readTestFile(projectDirectory, 'AGENTS.md');
      expect(originalContent).toContain('.safeword/SAFEWORD.md');

      const output = execSync('bun .safeword/hooks/session-verify-agents.ts', {
        cwd: projectDirectory,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
        encoding: 'utf8',
      });

      // Should be silent (no action needed)
      expect(output.trim()).toBe('');

      // Content unchanged
      const newContent = readTestFile(projectDirectory, 'AGENTS.md');
      expect(newContent).toBe(originalContent);
    });

    it('exits silently for non-safeword project', () => {
      const nonSafewordDirectory = createTemporaryDirectory();
      try {
        const output = execSync('bun .safeword/hooks/session-verify-agents.ts', {
          cwd: projectDirectory,
          env: { ...process.env, CLAUDE_PROJECT_DIR: nonSafewordDirectory },
          encoding: 'utf8',
        });

        expect(output.trim()).toBe('');
      } finally {
        removeTemporaryDirectory(nonSafewordDirectory);
      }
    });
  });

  describe('session-lint-check.ts', () => {
    it('outputs no warnings when lint configs exist', () => {
      // Project should have eslint and prettier after setup
      expect(fileExists(projectDirectory, 'eslint.config.mjs')).toBe(true);
      expect(fileExists(projectDirectory, '.prettierrc')).toBe(true);

      const output = execSync('bun .safeword/hooks/session-lint-check.ts', {
        cwd: projectDirectory,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
        encoding: 'utf8',
      });

      // Should not contain warnings
      expect(output).not.toContain('⚠️');
    });

    it('warns when ESLint config is missing', () => {
      // Temporarily remove ESLint config
      execSync('mv eslint.config.mjs eslint.config.mjs.bak', { cwd: projectDirectory });

      try {
        const output = execSync('bun .safeword/hooks/session-lint-check.ts', {
          cwd: projectDirectory,
          env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
          encoding: 'utf8',
        });

        expect(output).toContain('ESLint config not found');
      } finally {
        // Restore ESLint config
        execSync('mv eslint.config.mjs.bak eslint.config.mjs', { cwd: projectDirectory });
      }
    });

    it('warns when Prettier config is missing', () => {
      // Temporarily remove Prettier config
      execSync('mv .prettierrc .prettierrc.bak', { cwd: projectDirectory });

      try {
        const output = execSync('bun .safeword/hooks/session-lint-check.ts', {
          cwd: projectDirectory,
          env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
          encoding: 'utf8',
        });

        expect(output).toContain('Prettier config not found');
      } finally {
        // Restore Prettier config
        execSync('mv .prettierrc.bak .prettierrc', { cwd: projectDirectory });
      }
    });

    it('exits silently for non-safeword project', () => {
      const nonSafewordDirectory = createTemporaryDirectory();
      try {
        const output = execSync('bun .safeword/hooks/session-lint-check.ts', {
          cwd: projectDirectory,
          env: { ...process.env, CLAUDE_PROJECT_DIR: nonSafewordDirectory },
          encoding: 'utf8',
        });

        expect(output.trim()).toBe('');
      } finally {
        removeTemporaryDirectory(nonSafewordDirectory);
      }
    });
  });
});

describe('E2E: UserPromptSubmit Hooks', () => {
  describe('prompt-timestamp.ts', () => {
    it('outputs current timestamp in expected format', () => {
      const output = execSync('bun .safeword/hooks/prompt-timestamp.ts', {
        cwd: projectDirectory,
        encoding: 'utf8',
      });

      expect(output).toContain('Current time:');
      // Check for natural language format (day of week, month, date, year)
      expect(output).toMatch(/\w+, \w+ \d{2}, \d{4}/);
      // Check for ISO format (with milliseconds)
      expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
      // Check for local time
      expect(output).toMatch(/Local: \d{2}:\d{2}/);
    });
  });

  describe('prompt-questions.ts', () => {
    it('outputs question guidance for prompts', () => {
      const output = execSync(
        'echo "Help me implement a new feature for user authentication" | bun .safeword/hooks/prompt-questions.ts',
        {
          cwd: projectDirectory,
          env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
          encoding: 'utf8',
        },
      );

      expect(output).toContain('SAFEWORD');
      expect(output).toContain('Research before asking');
      expect(output).toContain('1-5 targeted questions');
      expect(output).toContain('scope');
      expect(output).toContain('constraints');
    });

    it('exits silently for non-safeword project', () => {
      const nonSafewordDirectory = createTemporaryDirectory();
      try {
        const output = execSync(
          'echo "Help me implement a new feature for user authentication" | bun .safeword/hooks/prompt-questions.ts',
          {
            cwd: projectDirectory,
            env: { ...process.env, CLAUDE_PROJECT_DIR: nonSafewordDirectory },
            encoding: 'utf8',
          },
        );

        expect(output.trim()).toBe('');
      } finally {
        removeTemporaryDirectory(nonSafewordDirectory);
      }
    });
  });
});

describe('E2E: Stop Hook', () => {
  // Helper to create a mock transcript with an assistant message
  function createMockTranscript(targetDirectory: string, assistantText: string): string {
    const transcriptPath = `${targetDirectory}/.safeword/test-transcript.jsonl`;
    // Use 'type' at top level to match actual Claude Code transcript format
    const message = {
      type: 'assistant',
      message: {
        content: [{ type: 'text', text: assistantText }],
      },
    };
    writeTestFile(targetDirectory, '.safeword/test-transcript.jsonl', JSON.stringify(message));
    return transcriptPath;
  }

  // Helper to create a multi-message transcript (JSONL format)
  function createMultiMessageTranscript(
    targetDirectory: string,
    messages: { text?: string; toolUse?: string }[],
  ): string {
    const transcriptPath = `${targetDirectory}/.safeword/test-transcript.jsonl`;
    const lines = messages.map(message => {
      const content: { type: string; text?: string; name?: string }[] = [];
      if (message.text) {
        content.push({ type: 'text', text: message.text });
      }
      if (message.toolUse) {
        content.push({ type: 'tool_use', name: message.toolUse });
      }
      return JSON.stringify({
        type: 'assistant',
        message: { content },
      });
    });
    writeTestFile(targetDirectory, '.safeword/test-transcript.jsonl', lines.join('\n'));
    return transcriptPath;
  }

  // Helper to run stop hook with mock transcript
  function runStopHook(
    targetDirectory: string,
    transcriptPath: string,
  ): { stdout: string; stderr: string; exitCode: number } {
    const input = JSON.stringify({ transcript_path: transcriptPath });
    try {
      const result = spawnSync(
        'bash',
        ['-c', `echo '${input}' | bun .safeword/hooks/stop-quality.ts`],
        {
          cwd: targetDirectory,
          env: { ...process.env, CLAUDE_PROJECT_DIR: targetDirectory },
          encoding: 'utf8',
        },
      );
      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exitCode: result.status || 0,
      };
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; status?: number };
      return {
        stdout: execError.stdout || '',
        stderr: execError.stderr || '',
        exitCode: execError.status || 1,
      };
    }
  }

  // Helper to parse JSON output from stop hook (new format: exit 0 + JSON stdout)
  function parseStopOutput(result: {
    stdout: string;
    stderr: string;
    exitCode: number;
  }): { decision?: string; reason?: string } {
    try {
      return JSON.parse(result.stdout.trim());
    } catch {
      return {};
    }
  }

  describe('stop-quality.ts', () => {
    it('triggers quality review when madeChanges is true', () => {
      const text =
        'I made some edits.\n\n{"proposedChanges": false, "madeChanges": true}';
      const transcriptPath = createMockTranscript(projectDirectory, text);

      const result = runStopHook(projectDirectory, transcriptPath);
      const output = parseStopOutput(result);

      expect(result.exitCode).toBe(0);
      expect(output.decision).toBe('block');
      expect(output.reason).toContain('Quality Review');
      expect(output.reason).toContain("Assume you've never seen it before");
      expect(output.reason).toContain('Is it correct?');
    });

    it('triggers quality review when proposedChanges is true', () => {
      const text =
        'I propose these changes.\n\n{"proposedChanges": true, "madeChanges": false}';
      const transcriptPath = createMockTranscript(projectDirectory, text);

      const result = runStopHook(projectDirectory, transcriptPath);
      const output = parseStopOutput(result);

      expect(result.exitCode).toBe(0);
      expect(output.decision).toBe('block');
      expect(output.reason).toContain('Quality Review');
    });

    it('handles JSON fields in different order', () => {
      const text = 'Done.\n\n{"madeChanges": true, "proposedChanges": false}';
      const transcriptPath = createMockTranscript(projectDirectory, text);

      const result = runStopHook(projectDirectory, transcriptPath);
      const output = parseStopOutput(result);

      expect(result.exitCode).toBe(0);
      expect(output.decision).toBe('block');
      expect(output.reason).toContain('Quality Review');
    });

    it('blocks when JSON blob is missing', () => {
      const text = 'I made some changes but forgot the JSON summary.';
      const transcriptPath = createMockTranscript(projectDirectory, text);

      const result = runStopHook(projectDirectory, transcriptPath);
      const output = parseStopOutput(result);

      expect(result.exitCode).toBe(0);
      expect(output.decision).toBe('block');
      expect(output.reason).toContain('missing required JSON summary');
    });

    it('blocks when JSON blob has missing field', () => {
      // Only has proposedChanges, missing madeChanges
      const text = 'Partial JSON.\n\n{"proposedChanges": true}';
      const transcriptPath = createMockTranscript(projectDirectory, text);

      const result = runStopHook(projectDirectory, transcriptPath);
      const output = parseStopOutput(result);

      expect(result.exitCode).toBe(0);
      expect(output.decision).toBe('block');
      expect(output.reason).toContain('missing required JSON summary');
    });

    it('exits silently when no changes made or proposed', () => {
      const text =
        'Just answered a question.\n\n{"proposedChanges": false, "madeChanges": false}';
      const transcriptPath = createMockTranscript(projectDirectory, text);

      const result = runStopHook(projectDirectory, transcriptPath);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('');
    });

    it('exits silently for non-safeword project', () => {
      const nonSafewordDirectory = createTemporaryDirectory();
      try {
        const input = JSON.stringify({ transcript_path: '/tmp/fake.jsonl' });
        const output = execSync(`echo '${input}' | bun .safeword/hooks/stop-quality.ts`, {
          cwd: projectDirectory,
          env: { ...process.env, CLAUDE_PROJECT_DIR: nonSafewordDirectory },
          encoding: 'utf8',
        });

        expect(output.trim()).toBe('');
      } finally {
        removeTemporaryDirectory(nonSafewordDirectory);
      }
    });

    it('uses last valid JSON blob when multiple exist in same message', () => {
      // First blob says no changes, second says changes made - should use second
      const text =
        'First update: {"proposedChanges": false, "madeChanges": false}\n\n' +
        'Then I made edits: {"proposedChanges": false, "madeChanges": true}';
      const transcriptPath = createMockTranscript(projectDirectory, text);

      const result = runStopHook(projectDirectory, transcriptPath);
      const output = parseStopOutput(result);

      expect(result.exitCode).toBe(0);
      expect(output.decision).toBe('block');
      expect(output.reason).toContain('Quality Review');
    });

    it('only uses JSON from the last assistant message, ignoring older messages', () => {
      // First message says changes made, but second (last) message says no changes
      // Should NOT trigger because only last message is checked
      const transcriptPath = createMultiMessageTranscript(projectDirectory, [
        { text: 'Made some edits.\n\n{"proposedChanges": false, "madeChanges": true}' },
        { text: 'Just a question.\n\n{"proposedChanges": false, "madeChanges": false}' },
      ]);

      const result = runStopHook(projectDirectory, transcriptPath);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe(''); // Silent exit, no block
    });

    it('detects edit tools from recent messages even without JSON summary', () => {
      // Edit tool in first message, no JSON in either message
      const transcriptPath = createMultiMessageTranscript(projectDirectory, [
        { text: 'Let me edit that file.', toolUse: 'Edit' },
        { text: 'Done with the changes.' },
      ]);

      const result = runStopHook(projectDirectory, transcriptPath);
      const output = parseStopOutput(result);

      expect(result.exitCode).toBe(0);
      expect(output.decision).toBe('block');
      expect(output.reason).toContain('edit tools were detected');
    });
  });
});

/**
 * Test Suite 2: Python-Aware Lint Hook
 * Tests for Story 2 - running Ruff on Python files in the post-tool lint hook.
 */
describe('E2E: Python Lint Hook', () => {
  /** Helper to run lint hook and return result */
  function runLintHook(filePath: string) {
    return spawnSync('bun', ['.safeword/hooks/lib/lint.ts', filePath], {
      cwd: projectDirectory,
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
      encoding: 'utf8',
    });
  }

  describe('Test 2.1: Routes .py files to Ruff', () => {
    it('should handle Python files without error', () => {
      writeTestFile(projectDirectory, 'test.py', 'x = 1\n');
      const result = runLintHook(`${projectDirectory}/test.py`);
      expect(result.status).toBe(0);
    });

    it('should handle .pyi stub files', () => {
      writeTestFile(projectDirectory, 'test.pyi', 'def foo() -> int: ...\n');
      const result = runLintHook(`${projectDirectory}/test.pyi`);
      expect(result.status).toBe(0);
    });
  });

  describe('Test 2.2: Continues running ESLint for JS/TS files', () => {
    it('should run ESLint for TypeScript files', () => {
      writeTestFile(projectDirectory, 'test.ts', 'const x = 1\n');
      const result = runLintHook(`${projectDirectory}/test.ts`);
      // ESLint runs and exits successfully
      expect(result.status).toBe(0);
    });
  });

  describe('Test 2.3: Skips Ruff gracefully if not installed', () => {
    it('should not error when Ruff is missing from PATH', () => {
      writeTestFile(projectDirectory, 'test.py', 'print("hello")\n');

      // Find actual bun path (process.execPath gives node when running via vitest)
      const bunPath = execSync('which bun', { encoding: 'utf8' }).trim();
      const bunDir = dirname(bunPath);

      // Run with PATH that has bun but likely not ruff
      const result = spawnSync(
        'bash',
        ['-c', `PATH=/bin:/usr/bin:${bunDir} bun .safeword/hooks/lib/lint.ts "${projectDirectory}/test.py"`],
        {
          cwd: projectDirectory,
          env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
          encoding: 'utf8',
        },
      );

      // Should exit 0 (graceful skip via .nothrow())
      expect(result.status).toBe(0);
    });
  });

  describe('Test 2.4: Ruff fixes Python files via lint hook', () => {
    /** Helper to run post-tool-lint hook via JSON input (actually executes the lint) */
    function runPostToolLint(filePath: string) {
      const hookInput = JSON.stringify({
        session_id: 'test-session',
        hook_event_name: 'PostToolUse',
        tool_name: 'Write',
        tool_input: { file_path: filePath },
      });

      return spawnSync(
        'bash',
        ['-c', `echo '${hookInput}' | bun .safeword/hooks/post-tool-lint.ts`],
        {
          cwd: projectDirectory,
          env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
          encoding: 'utf8',
        },
      );
    }

    it.skipIf(!RUFF_AVAILABLE)('should format Python files when run through lint hook', () => {
      // Create badly formatted Python file
      const badCode = 'x=1;y=2';
      writeTestFile(projectDirectory, 'format-test.py', badCode);

      // Run lint hook on the file
      const result = runPostToolLint(`${projectDirectory}/format-test.py`);
      expect(result.status).toBe(0);

      // File should now be formatted
      const formatted = readTestFile(projectDirectory, 'format-test.py');
      expect(formatted).toContain('x = 1');
      expect(formatted).toContain('y = 2');
    });

    it.skipIf(!RUFF_AVAILABLE)('should fix auto-fixable lint issues', () => {
      // Create file with unused import (auto-fixable with --fix)
      const codeWithUnusedImport = 'import os\nx = 1\n';
      writeTestFile(projectDirectory, 'fix-test.py', codeWithUnusedImport);

      // Run lint hook on the file
      const result = runPostToolLint(`${projectDirectory}/fix-test.py`);
      expect(result.status).toBe(0);

      // Unused import should be removed
      const fixed = readTestFile(projectDirectory, 'fix-test.py');
      expect(fixed).not.toContain('import os');
      expect(fixed).toContain('x = 1');
    });
  });
});
