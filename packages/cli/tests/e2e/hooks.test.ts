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

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import {
  createTempDir,
  removeTempDir,
  createTypeScriptPackageJson,
  initGitRepo,
  runCli,
  readTestFile,
  writeTestFile,
  fileExists,
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
      expect(content).toContain('@./.safeword/SAFEWORD.md');
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
      expect(content).toContain('@./.safeword/SAFEWORD.md');
      expect(content).toContain('My Project'); // Original content preserved
    });

    it('does nothing if link already present', () => {
      // Ensure link is present
      const originalContent = readTestFile(projectDir, 'AGENTS.md');
      expect(originalContent).toContain('@./.safeword/SAFEWORD.md');

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
      // Check for Unix timestamp (10 digits)
      expect(output).toMatch(/\d{10}/);
      // Check for ISO format
      expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
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

  describe('stop-quality.sh', () => {
    it('returns valid JSON with review message when files are staged', () => {
      // Create and stage a file
      writeTestFile(projectDir, 'src/test-file.ts', 'export const test = true;\n');
      execSync('git add src/test-file.ts', { cwd: projectDir });

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

    it('returns JSON without message when no files are modified', () => {
      // Use a fresh temp directory with committed baseline to ensure clean state
      const cleanDir = createTempDir();
      try {
        // Initialize fresh git repo with initial commit
        execSync('git init', { cwd: cleanDir, stdio: 'pipe' });
        execSync('git config user.email "test@test.com"', { cwd: cleanDir, stdio: 'pipe' });
        execSync('git config user.name "Test User"', { cwd: cleanDir, stdio: 'pipe' });
        writeTestFile(cleanDir, '.safeword/version', '0.0.0');
        execSync('git add -A && git commit -m "initial"', { cwd: cleanDir, stdio: 'pipe' });

        // Copy stop hook from projectDir
        const hookContent = readTestFile(projectDir, '.safeword/hooks/stop-quality.sh');
        writeTestFile(cleanDir, '.safeword/hooks/stop-quality.sh', hookContent);
        execSync('chmod +x .safeword/hooks/stop-quality.sh', { cwd: cleanDir });

        // Now run stop hook - should see no modified files
        const output = execSync('bash .safeword/hooks/stop-quality.sh', {
          cwd: cleanDir,
          env: { ...process.env, CLAUDE_PROJECT_DIR: cleanDir },
          encoding: 'utf-8',
        });

        // Should return valid JSON without message
        const json = JSON.parse(output);
        expect(json).not.toHaveProperty('message');
      } finally {
        removeTempDir(cleanDir);
      }
    });

    it('detects unstaged modified files', () => {
      // Create a modified but unstaged file
      writeTestFile(projectDir, 'src/unstaged.ts', 'export const unstaged = true;\n');

      const output = execSync('bash .safeword/hooks/stop-quality.sh', {
        cwd: projectDir,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
        encoding: 'utf-8',
      });

      // Should return valid JSON with message about modified files
      const json = JSON.parse(output);
      expect(json).toHaveProperty('message');
      expect(json.message).toContain('/quality-review');
    });
  });
});
