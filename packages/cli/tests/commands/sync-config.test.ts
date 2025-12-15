/**
 * Test Suite: Sync Config Command
 *
 * Tests for `safeword sync-config` command.
 * See: .safeword/planning/test-definitions/feature-architecture-audit.md
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createConfiguredProject,
  createTemporaryDirectory,
  createTypeScriptPackageJson,
  fileExists,
  initGitRepo,
  readTestFile,
  removeTemporaryDirectory,
  runCli,
  writeTestFile,
} from '../helpers';

describe('Sync Config Command', () => {
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = createTemporaryDirectory();
  });

  afterEach(() => {
    removeTemporaryDirectory(temporaryDirectory);
  });

  describe('Test 2.1: Fails if .safeword directory missing', () => {
    it('should fail with error message when not configured', async () => {
      createTypeScriptPackageJson(temporaryDirectory);
      initGitRepo(temporaryDirectory);

      const result = await runCli(['sync-config'], { cwd: temporaryDirectory });

      expect(result.exitCode).not.toBe(0);
      expect(result.stdout + result.stderr).toMatch(/setup/i);
    });
  });
});
