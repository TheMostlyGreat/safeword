/**
 * Test Suite 10: Diff
 *
 * Tests for `safeword diff` command.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTempDir,
  removeTempDir,
  createTypeScriptPackageJson,
  createConfiguredProject,
  runCli,
  writeTestFile,
} from '../helpers';

describe('Test Suite 10: Diff', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('Test 10.1: Shows summary by default', () => {
    it('should show file counts without full diff', async () => {
      await createConfiguredProject(tempDir);

      // Modify version to create differences
      writeTestFile(tempDir, '.safeword/version', '0.0.1');

      const result = await runCli(['diff'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);

      // Should show counts
      expect(result.stdout).toMatch(/\d+/);

      // Should NOT show full diff markers by default
      expect(result.stdout).not.toMatch(/^[+-]{3}/m);
      expect(result.stdout).not.toMatch(/^@@/m);
    });
  });

  describe('Test 10.2: Lists files by category', () => {
    it('should categorize files as Added, Modified, or Unchanged', async () => {
      await createConfiguredProject(tempDir);

      // Create a difference
      writeTestFile(tempDir, '.safeword/version', '0.0.1');

      const result = await runCli(['diff'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);

      // Should have some categorization
      const output = result.stdout.toLowerCase();
      expect(output).toMatch(/add|modif|chang|updat|unchanged/i);
    });
  });

  describe('Test 10.3: Shows version transition', () => {
    it('should show from/to versions', async () => {
      await createConfiguredProject(tempDir);

      // Set older project version
      writeTestFile(tempDir, '.safeword/version', '1.0.0');

      const result = await runCli(['diff'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);

      // Should show version info
      expect(result.stdout).toContain('1.0.0');
      // Should show transition (→ or similar)
      expect(result.stdout).toMatch(/→|->|to|from/);
    });
  });

  describe('Test 10.4: --verbose shows full diff', () => {
    it('should show unified diff with --verbose', async () => {
      await createConfiguredProject(tempDir);

      // Create a modification
      writeTestFile(tempDir, '.safeword/SAFEWORD.md', '# Modified\n');

      const result = await runCli(['diff', '--verbose'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);

      // Should show unified diff format
      // --- file
      // +++ file
      // @@ line numbers @@
      expect(result.stdout).toMatch(/^---/m);
      expect(result.stdout).toMatch(/^\+\+\+/m);
      expect(result.stdout).toMatch(/^@@.*@@/m);
    });
  });

  describe('Test 10.5: Unconfigured project error', () => {
    it('should error on unconfigured project', async () => {
      createTypeScriptPackageJson(tempDir);
      // No setup

      const result = await runCli(['diff'], { cwd: tempDir });

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toContain('not configured');
    });
  });
});
