/**
 * Test Suite 5: Setup Blocks on Existing
 *
 * Tests for setup error when already configured.
 */

import { mkdirSync } from 'node:fs';
import nodePath from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createTemporaryDirectory,
  createTypeScriptPackageJson,
  fileExists,
  readTestFile,
  removeTemporaryDirectory,
  runCli,
  writeTestFile,
} from '../helpers';

describe('Test Suite 5: Setup Blocks on Existing', () => {
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = createTemporaryDirectory();
  });

  afterEach(() => {
    removeTemporaryDirectory(temporaryDirectory);
  });

  describe('Test 5.1: Error when .safeword exists', () => {
    it('should error with exit 1 when .safeword/ already exists', async () => {
      createTypeScriptPackageJson(temporaryDirectory);

      // Create existing .safeword directory
      mkdirSync(nodePath.join(temporaryDirectory, '.safeword'));

      const result = await runCli(['setup'], { cwd: temporaryDirectory });

      expect(result.exitCode).toBe(1);
      expect(result.stderr.toLowerCase()).toContain('already configured');
      expect(result.stderr.toLowerCase()).toContain('upgrade');
    });
  });

  describe('Test 5.2: No files modified on error', () => {
    it('should not modify files when erroring', async () => {
      createTypeScriptPackageJson(temporaryDirectory);

      // Create existing .safeword directory
      mkdirSync(nodePath.join(temporaryDirectory, '.safeword'));

      // Create AGENTS.md with known content
      const originalContent = '# Original AGENTS.md\n\nThis should not change.\n';
      writeTestFile(temporaryDirectory, 'AGENTS.md', originalContent);

      const result = await runCli(['setup'], { cwd: temporaryDirectory });

      expect(result.exitCode).toBe(1);

      // AGENTS.md should be unchanged
      const content = readTestFile(temporaryDirectory, 'AGENTS.md');
      expect(content).toBe(originalContent);

      // No new files should be created
      expect(fileExists(temporaryDirectory, '.claude')).toBe(false);
      expect(fileExists(temporaryDirectory, 'eslint.config.mjs')).toBe(false);
      expect(fileExists(temporaryDirectory, '.prettierrc')).toBe(false);
    });
  });
});
