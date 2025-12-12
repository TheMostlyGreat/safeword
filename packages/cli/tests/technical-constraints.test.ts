/**
 * Test Suite 0: Technical Constraints
 *
 * Tests for non-functional requirements that apply across all commands.
 * These tests verify performance, compatibility, and quality requirements.
 */

import { afterEach,beforeEach, describe, expect, it } from 'vitest';

import {
  createTempDir,
  createTypeScriptPackageJson,
  initGitRepo,
  measureTime,
  removeTempDir,
  runCli,
  runCliSync,
} from './helpers';

describe('Test Suite 0: Technical Constraints', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('Test 0.1: CLI startup time under 500ms', () => {
    it('should start quickly with average under 500ms', async () => {
      const runs = 10;
      const times: number[] = [];

      for (let i = 0; i < runs; i++) {
        const { timeMs } = await measureTime(async () => {
          return runCliSync(['--version']);
        });
        times.push(timeMs);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(500);
      expect(maxTime).toBeLessThan(750);
    });
  });

  describe('Test 0.2: Setup completes under 30s', () => {
    it('should complete setup in under 30 seconds', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      const { result, timeMs } = await measureTime(async () => {
        return runCli(['setup', '--yes'], { cwd: tempDir, timeout: 60000 });
      });

      expect(result.exitCode).toBe(0);
      expect(timeMs).toBeLessThan(30000);
    });
  });

  describe('Test 0.3: Node.js version check', () => {
    it.skip('should exit with error on Node.js < 18 (requires CI container)', async () => {
      // This test requires running with Node.js < 18, which needs:
      // - A Docker container with older Node, OR
      // - nvm switching in CI
      //
      // The implementation should check process.version at startup
      // and exit with code 1 if version < 18.
      //
      // Expected behavior:
      // - Exit code 1
      // - stderr contains "Node.js version" and "18"
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Test 0.4: Works with different package managers', () => {
    it('should work with npm', async () => {
      createTypeScriptPackageJson(tempDir);
      initGitRepo(tempDir);

      const result = await runCli(['setup', '--yes'], {
        cwd: tempDir,
        timeout: 60000,
      });

      expect(result.exitCode).toBe(0);
    });

    // Note: pnpm and yarn tests should be in separate CI jobs
    // to ensure proper package manager isolation
  });
});
