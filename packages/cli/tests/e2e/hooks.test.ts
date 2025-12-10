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

import { afterAll,beforeAll, describe, expect, it } from 'vitest';

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

describe('E2E: SessionStart Hooks', () => {
  let projectDir: string;

  beforeAll(async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);
    await runCli(['setup', '--yes'], { cwd: projectDir });
  }, 180000);

  afterAll(() => {
    if (projectDir) {
      removeTempDir(projectDir);
    }
  });

  describe('session-version.sh', () => {
    it('outputs version message for safeword project', () => {
      const output = execSync('bash .safeword/hooks/session-version.sh', {
        cwd: projectDir,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
        encoding: 'utf-8',
      });

      expect(output).toContain('SAFE WORD');
      expect(output).toContain('installed');
      expect(output).toMatch(/v\d+\.\d+\.\d+/); // Version format
    });

    it('exits silently for non-safeword project', () => {
      const nonSafewordDir = createTempDir();
      try {
        // Run in a directory without .safeword
        const output = execSync('bash .safeword/hooks/session-version.sh', {
          cwd: projectDir, // Script is here
          env: { ...process.env, CLAUDE_PROJECT_DIR: nonSafewordDir }, // But points to non-safeword dir
          encoding: 'utf-8',
        });

        // Should output nothing (silent exit)
        expect(output.trim()).toBe('');
      } finally {
        removeTempDir(nonSafewordDir);
      }
    });
  });

  describe('session-verify-agents.sh', () => {
    it('creates AGENTS.md if missing', () => {
      // Remove AGENTS.md
      execSync('rm -f AGENTS.md', { cwd: projectDir });
      expect(fileExists(projectDir, 'AGENTS.md')).toBe(false);

      const output = execSync('bash .safeword/hooks/session-verify-agents.sh', {
        cwd: projectDir,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
        encoding: 'utf-8',
      });

      expect(fileExists(projectDir, 'AGENTS.md')).toBe(true);
      expect(output).toContain('Created AGENTS.md');

      const content = readTestFile(projectDir, 'AGENTS.md');
      expect(content).toContain('.safeword/SAFEWORD.md');
    });

    it('restores link if removed from AGENTS.md', () => {
      // Overwrite AGENTS.md without the link
      writeTestFile(projectDir, 'AGENTS.md', '# My Project\n\nSome content\n');

      const output = execSync('bash .safeword/hooks/session-verify-agents.sh', {
        cwd: projectDir,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
        encoding: 'utf-8',
      });

      expect(output).toContain('Restored AGENTS.md link');

      const content = readTestFile(projectDir, 'AGENTS.md');
      expect(content).toContain('.safeword/SAFEWORD.md');
      expect(content).toContain('My Project'); // Original content preserved
    });

    it('does nothing if link already present', () => {
      // Ensure link is present
      const originalContent = readTestFile(projectDir, 'AGENTS.md');
      expect(originalContent).toContain('.safeword/SAFEWORD.md');

      const output = execSync('bash .safeword/hooks/session-verify-agents.sh', {
        cwd: projectDir,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
        encoding: 'utf-8',
      });

      // Should be silent (no action needed)
      expect(output.trim()).toBe('');

      // Content unchanged
      const newContent = readTestFile(projectDir, 'AGENTS.md');
      expect(newContent).toBe(originalContent);
    });

    it('exits silently for non-safeword project', () => {
      const nonSafewordDir = createTempDir();
      try {
        const output = execSync('bash .safeword/hooks/session-verify-agents.sh', {
          cwd: projectDir,
          env: { ...process.env, CLAUDE_PROJECT_DIR: nonSafewordDir },
          encoding: 'utf-8',
        });

        expect(output.trim()).toBe('');
      } finally {
        removeTempDir(nonSafewordDir);
      }
    });
  });

  describe('session-lint-check.sh', () => {
    it('outputs no warnings when lint configs exist', () => {
      // Project should have eslint and prettier after setup
      expect(fileExists(projectDir, 'eslint.config.mjs')).toBe(true);
      expect(fileExists(projectDir, '.prettierrc')).toBe(true);

      const output = execSync('bash .safeword/hooks/session-lint-check.sh', {
        cwd: projectDir,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
        encoding: 'utf-8',
      });

      // Should not contain warnings
      expect(output).not.toContain('⚠️');
    });

    it('warns when ESLint config is missing', () => {
      // Temporarily remove ESLint config
      execSync('mv eslint.config.mjs eslint.config.mjs.bak', { cwd: projectDir });

      try {
        const output = execSync('bash .safeword/hooks/session-lint-check.sh', {
          cwd: projectDir,
          env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
          encoding: 'utf-8',
        });

        expect(output).toContain('ESLint config not found');
      } finally {
        // Restore ESLint config
        execSync('mv eslint.config.mjs.bak eslint.config.mjs', { cwd: projectDir });
      }
    });

    it('warns when Prettier config is missing', () => {
      // Temporarily remove Prettier config
      execSync('mv .prettierrc .prettierrc.bak', { cwd: projectDir });

      try {
        const output = execSync('bash .safeword/hooks/session-lint-check.sh', {
          cwd: projectDir,
          env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
          encoding: 'utf-8',
        });

        expect(output).toContain('Prettier config not found');
      } finally {
        // Restore Prettier config
        execSync('mv .prettierrc.bak .prettierrc', { cwd: projectDir });
      }
    });

    it('exits silently for non-safeword project', () => {
      const nonSafewordDir = createTempDir();
      try {
        const output = execSync('bash .safeword/hooks/session-lint-check.sh', {
          cwd: projectDir,
          env: { ...process.env, CLAUDE_PROJECT_DIR: nonSafewordDir },
          encoding: 'utf-8',
        });

        expect(output.trim()).toBe('');
      } finally {
        removeTempDir(nonSafewordDir);
      }
    });
  });
});

describe('E2E: UserPromptSubmit Hooks', () => {
  let projectDir: string;

  beforeAll(async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);
    await runCli(['setup', '--yes'], { cwd: projectDir });
  }, 180000);

  afterAll(() => {
    if (projectDir) {
      removeTempDir(projectDir);
    }
  });

  describe('prompt-timestamp.sh', () => {
    it('outputs current timestamp in expected format', () => {
      const output = execSync('bash .safeword/hooks/prompt-timestamp.sh', {
        cwd: projectDir,
        encoding: 'utf-8',
      });

      expect(output).toContain('Current time:');
      // Check for natural language format (day of week, month, date, year)
      expect(output).toMatch(/\w+, \w+ \d{2}, \d{4}/);
      // Check for ISO format
      expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
      // Check for local time
      expect(output).toMatch(/Local: \d{2}:\d{2}/);
    });
  });

  describe('prompt-questions.sh', () => {
    it('outputs question protocol for substantial prompts', () => {
      // Pipe a substantial prompt (>20 chars)
      const output = execSync(
        'echo "Help me implement a new feature for user authentication" | bash .safeword/hooks/prompt-questions.sh',
        {
          cwd: projectDir,
          env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
          encoding: 'utf-8',
        },
      );

      expect(output).toContain('Question Protocol');
      expect(output).toContain('clarifying questions');
      expect(output).toContain('Scope boundaries');
      expect(output).toContain('Technical constraints');
      expect(output).toContain('Success criteria');
    });

    it('outputs nothing for short prompts', () => {
      // Pipe a short prompt (<20 chars)
      const output = execSync('echo "fix bug" | bash .safeword/hooks/prompt-questions.sh', {
        cwd: projectDir,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
        encoding: 'utf-8',
      });

      // Should be silent for short prompts
      expect(output.trim()).toBe('');
    });

    it('exits silently for non-safeword project', () => {
      const nonSafewordDir = createTempDir();
      try {
        const output = execSync(
          'echo "Help me implement a new feature for user authentication" | bash .safeword/hooks/prompt-questions.sh',
          {
            cwd: projectDir,
            env: { ...process.env, CLAUDE_PROJECT_DIR: nonSafewordDir },
            encoding: 'utf-8',
          },
        );

        expect(output.trim()).toBe('');
      } finally {
        removeTempDir(nonSafewordDir);
      }
    });
  });
});

describe('E2E: Stop Hook', () => {
  let projectDir: string;

  beforeAll(async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);
    await runCli(['setup', '--yes'], { cwd: projectDir });
  }, 180000);

  afterAll(() => {
    if (projectDir) {
      removeTempDir(projectDir);
    }
  });

  // Helper to create a mock transcript with an assistant message
  function createMockTranscript(projectDir: string, assistantText: string): string {
    const transcriptPath = `${projectDir}/.safeword/test-transcript.jsonl`;
    const message = {
      role: 'assistant',
      message: {
        content: [{ type: 'text', text: assistantText }],
      },
    };
    writeTestFile(projectDir, '.safeword/test-transcript.jsonl', JSON.stringify(message));
    return transcriptPath;
  }

  // Helper to run stop hook with mock transcript
  function runStopHook(
    projectDir: string,
    transcriptPath: string,
  ): { stdout: string; stderr: string; exitCode: number } {
    const input = JSON.stringify({ transcript_path: transcriptPath });
    try {
      const result = spawnSync(
        'bash',
        ['-c', `echo '${input}' | bash .safeword/hooks/stop-quality.sh`],
        {
          cwd: projectDir,
          env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
          encoding: 'utf-8',
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

  describe('stop-quality.sh', () => {
    it('triggers quality review when madeChanges is true', () => {
      const text =
        'I made some edits.\n\n{"proposedChanges": false, "madeChanges": true, "askedQuestion": false}';
      const transcriptPath = createMockTranscript(projectDir, text);

      const result = runStopHook(projectDir, transcriptPath);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Quality Review');
      expect(result.stderr).toContain("Assume you've never seen it before");
      expect(result.stderr).toContain('Is it correct?');
    });

    it('triggers quality review when proposedChanges is true', () => {
      const text =
        'I propose these changes.\n\n{"proposedChanges": true, "madeChanges": false, "askedQuestion": false}';
      const transcriptPath = createMockTranscript(projectDir, text);

      const result = runStopHook(projectDir, transcriptPath);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Quality Review');
    });

    it('skips review when askedQuestion is true', () => {
      const text =
        'What approach do you prefer?\n\n{"proposedChanges": true, "madeChanges": true, "askedQuestion": true}';
      const transcriptPath = createMockTranscript(projectDir, text);

      const result = runStopHook(projectDir, transcriptPath);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).not.toContain('Quality Review');
    });

    it('handles JSON fields in different order', () => {
      const text =
        'Done.\n\n{"madeChanges": true, "askedQuestion": false, "proposedChanges": false}';
      const transcriptPath = createMockTranscript(projectDir, text);

      const result = runStopHook(projectDir, transcriptPath);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Quality Review');
    });

    it('blocks when JSON blob is missing', () => {
      const text = 'I made some changes but forgot the JSON summary.';
      const transcriptPath = createMockTranscript(projectDir, text);

      const result = runStopHook(projectDir, transcriptPath);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('missing required JSON summary');
    });

    it('blocks when JSON blob has missing field', () => {
      const text = 'Partial JSON.\n\n{"proposedChanges": true, "madeChanges": false}';
      const transcriptPath = createMockTranscript(projectDir, text);

      const result = runStopHook(projectDir, transcriptPath);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('missing required JSON summary');
    });

    it('exits silently when no changes made or proposed', () => {
      const text =
        'Just answered a question.\n\n{"proposedChanges": false, "madeChanges": false, "askedQuestion": false}';
      const transcriptPath = createMockTranscript(projectDir, text);

      const result = runStopHook(projectDir, transcriptPath);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
    });

    it('exits silently for non-safeword project', () => {
      const nonSafewordDir = createTempDir();
      try {
        const input = JSON.stringify({ transcript_path: '/tmp/fake.jsonl' });
        const output = execSync(`echo '${input}' | bash .safeword/hooks/stop-quality.sh`, {
          cwd: projectDir,
          env: { ...process.env, CLAUDE_PROJECT_DIR: nonSafewordDir },
          encoding: 'utf-8',
        });

        expect(output.trim()).toBe('');
      } finally {
        removeTempDir(nonSafewordDir);
      }
    });

    it('uses last valid JSON blob when multiple exist', () => {
      // First blob says no changes, second says changes made - should use second
      const text =
        'First update: {"proposedChanges": false, "madeChanges": false, "askedQuestion": false}\n\n' +
        'Then I made edits: {"proposedChanges": false, "madeChanges": true, "askedQuestion": false}';
      const transcriptPath = createMockTranscript(projectDir, text);

      const result = runStopHook(projectDir, transcriptPath);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Quality Review');
    });
  });
});
