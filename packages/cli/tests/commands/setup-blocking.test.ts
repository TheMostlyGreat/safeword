/**
 * Test Suite 5: Setup Blocks on Existing
 *
 * Tests for setup error when already configured.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  createTempDir,
  removeTempDir,
  createTypeScriptPackageJson,
  runCli,
  readTestFile,
  writeTestFile,
  fileExists,
} from '../helpers';

describe('Test Suite 5: Setup Blocks on Existing', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('Test 5.1: Error when .safeword exists', () => {
    it('should error with exit 1 when .safeword/ already exists', async () => {
      createTypeScriptPackageJson(tempDir);

      // Create existing .safeword directory
      mkdirSync(join(tempDir, '.safeword'));

      const result = await runCli(['setup'], { cwd: tempDir });

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toContain('already configured');
      expect(result.stderr.toLowerCase()).toContain('upgrade');
    });
  });

  describe('Test 5.2: No files modified on error', () => {
    it('should not modify files when erroring', async () => {
      createTypeScriptPackageJson(tempDir);

      // Create existing .safeword directory
      mkdirSync(join(tempDir, '.safeword'));

      // Create AGENTS.md with known content
      const originalContent = '# Original AGENTS.md\n\nThis should not change.\n';
      writeTestFile(tempDir, 'AGENTS.md', originalContent);

      const result = await runCli(['setup'], { cwd: tempDir });

      expect(result.exitCode).toBe(1);

      // AGENTS.md should be unchanged
      const content = readTestFile(tempDir, 'AGENTS.md');
      expect(content).toBe(originalContent);

      // No new files should be created
      expect(fileExists(tempDir, '.claude')).toBe(false);
      expect(fileExists(tempDir, 'eslint.config.mjs')).toBe(false);
      expect(fileExists(tempDir, '.prettierrc')).toBe(false);
    });
  });
});
