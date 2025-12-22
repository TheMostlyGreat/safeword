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

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createTemporaryDirectory,
  createTypeScriptPackageJson,
  fileExists,
  initGitRepo,
  readTestFile,
  removeTemporaryDirectory,
  runCli,
  writeTestFile,
} from '../helpers';

// Single setup for all hook tests - sharing avoids 3 separate npm installs (~9 min → 9 sec)
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

    it('uses last valid JSON blob when multiple exist', () => {
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
  });
});
