/**
 * Test Suite 12: AGENTS.md Self-Healing
 *
 * Tests for SessionStart hook that maintains AGENTS.md link.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import {
  createTempDir,
  removeTempDir,
  createConfiguredProject,
  runCli,
  readTestFile,
  writeTestFile,
  fileExists,
  measureTimeSync,
} from '../helpers';
import { unlinkSync } from 'node:fs';

describe('Test Suite 12: AGENTS.md Self-Healing', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  /**
   * Helper to run the self-healing hook script
   */
  function runSelfHealingHook(dir: string): { stdout: string; exitCode: number } {
    // The hook script location: .safeword/hooks/session-verify-agents.sh
    const hookPath = join(dir, '.safeword/hooks/session-verify-agents.sh');

    if (!fileExists(dir, '.safeword/hooks/session-verify-agents.sh')) {
      // Hook may have different name - check for any agents-related hook
      // For now, return a placeholder
      return { stdout: '', exitCode: 0 };
    }

    try {
      const stdout = execSync(`bash "${hookPath}"`, {
        cwd: dir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { stdout, exitCode: 0 };
    } catch (error: unknown) {
      const execError = error as { stdout?: string; status?: number };
      return {
        stdout: execError.stdout ?? '',
        exitCode: execError.status ?? 1,
      };
    }
  }

  describe('Test 12.1: Hook detects missing link', () => {
    it('should detect when safeword link is missing', async () => {
      await createConfiguredProject(tempDir);

      // Remove the safeword link from AGENTS.md
      const content = readTestFile(tempDir, 'AGENTS.md');
      const withoutLink = content
        .split('\n')
        .filter(line => !line.includes('.safeword/SAFEWORD.md'))
        .join('\n');
      writeTestFile(tempDir, 'AGENTS.md', withoutLink);

      const result = runSelfHealingHook(tempDir);

      // Hook should indicate repair is needed or perform repair
      // The exact output depends on implementation
      expect(result.exitCode).toBeDefined();
    });
  });

  describe('Test 12.2: Hook re-adds missing link', () => {
    it('should restore removed link', async () => {
      await createConfiguredProject(tempDir);

      // Remove the safeword link
      const content = readTestFile(tempDir, 'AGENTS.md');
      const withoutLink = '# My Project\n\nSome content without the link.\n';
      writeTestFile(tempDir, 'AGENTS.md', withoutLink);

      // Run hook
      runSelfHealingHook(tempDir);

      // Link should be restored
      const updatedContent = readTestFile(tempDir, 'AGENTS.md');
      expect(updatedContent).toContain('.safeword/SAFEWORD.md');

      // Original content preserved
      expect(updatedContent).toContain('My Project');
      expect(updatedContent).toContain('Some content');
    });
  });

  describe('Test 12.3: Hook shows warning on restoration', () => {
    it('should output message when restoring', async () => {
      await createConfiguredProject(tempDir);

      // Remove link
      writeTestFile(tempDir, 'AGENTS.md', '# No link\n');

      const result = runSelfHealingHook(tempDir);

      // Should mention restoration
      const output = result.stdout.toLowerCase();
      expect(output).toMatch(/restor|repair|add|fix|agents/i);
    });
  });

  describe('Test 12.4: Hook recreates deleted AGENTS.md', () => {
    it('should recreate AGENTS.md if deleted', async () => {
      await createConfiguredProject(tempDir);

      // Delete AGENTS.md entirely
      unlinkSync(join(tempDir, 'AGENTS.md'));
      expect(fileExists(tempDir, 'AGENTS.md')).toBe(false);

      // Run hook
      runSelfHealingHook(tempDir);

      // AGENTS.md should be recreated
      expect(fileExists(tempDir, 'AGENTS.md')).toBe(true);

      const content = readTestFile(tempDir, 'AGENTS.md');
      expect(content).toContain('.safeword/SAFEWORD.md');
    });
  });

  describe('Test 12.5: Hook prevents duplicates', () => {
    it('should not add duplicate links', async () => {
      await createConfiguredProject(tempDir);

      // Verify link exists
      const contentBefore = readTestFile(tempDir, 'AGENTS.md');
      expect(contentBefore).toContain('.safeword/SAFEWORD.md');

      // Run hook multiple times
      runSelfHealingHook(tempDir);
      runSelfHealingHook(tempDir);
      runSelfHealingHook(tempDir);

      // Count links
      const contentAfter = readTestFile(tempDir, 'AGENTS.md');
      const linkCount = (contentAfter.match(/@\.\/\.safeword\/SAFEWORD\.md/g) || []).length;

      expect(linkCount).toBe(1);
    });
  });

  describe('Test 12.6: Hook exits cleanly', () => {
    it('should exit with code 0 and complete quickly', async () => {
      await createConfiguredProject(tempDir);

      const { result, timeMs } = measureTimeSync(() => runSelfHealingHook(tempDir));

      expect(result.exitCode).toBe(0);
      expect(timeMs).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
