/**
 * Test Suite: Setup - Architecture Integration
 *
 * Tests for automatic architecture detection and depcruise config generation during setup.
 * See: .safeword/planning/test-definitions/feature-architecture-audit.md
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTemporaryDirectory,
  createTypeScriptPackageJson,
  fileExists,
  initGitRepo,
  readTestFile,
  removeTemporaryDirectory,
  runCli,
  writeTestFile,
} from "../helpers";

describe("Setup - Architecture Integration", () => {
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = createTemporaryDirectory();
  });

  afterEach(() => {
    removeTemporaryDirectory(temporaryDirectory);
  });

  describe("Test 6.1: Generates depcruise config when architecture detected", () => {
    it("should create depcruise configs when src/utils exists", async () => {
      createTypeScriptPackageJson(temporaryDirectory);
      initGitRepo(temporaryDirectory);

      // Create architecture directory
      writeTestFile(
        temporaryDirectory,
        "src/utils/helper.ts",
        "export const x = 1;",
      );

      const result = await runCli(["setup"], {
        cwd: temporaryDirectory,
      });

      expect(result.exitCode).toBe(0);

      // Should create depcruise configs
      expect(
        fileExists(temporaryDirectory, ".safeword/depcruise-config.cjs"),
      ).toBe(true);
      expect(fileExists(temporaryDirectory, ".dependency-cruiser.cjs")).toBe(
        true,
      );

      // Generated config should have rules
      const config = readTestFile(
        temporaryDirectory,
        ".safeword/depcruise-config.cjs",
      );
      expect(config).toContain("module.exports");
      expect(config).toContain("forbidden");
      expect(config).toContain("no-circular");
    });

    it("should create depcruise configs when monorepo detected", async () => {
      createTypeScriptPackageJson(temporaryDirectory);
      initGitRepo(temporaryDirectory);

      // Create monorepo structure
      writeTestFile(
        temporaryDirectory,
        "packages/core/index.ts",
        "export const x = 1;",
      );
      writeTestFile(
        temporaryDirectory,
        "packages/ui/index.ts",
        "export const y = 1;",
      );

      const result = await runCli(["setup"], {
        cwd: temporaryDirectory,
      });

      expect(result.exitCode).toBe(0);

      // Should create depcruise configs
      expect(
        fileExists(temporaryDirectory, ".safeword/depcruise-config.cjs"),
      ).toBe(true);
      expect(fileExists(temporaryDirectory, ".dependency-cruiser.cjs")).toBe(
        true,
      );
    });
  });

  describe("Test 6.2: Skips depcruise config when no architecture", () => {
    it("should not create depcruise configs for simple project", async () => {
      createTypeScriptPackageJson(temporaryDirectory);
      initGitRepo(temporaryDirectory);

      // Create simple project without architecture directories
      writeTestFile(temporaryDirectory, "index.ts", 'console.log("hello");');

      const result = await runCli(["setup"], {
        cwd: temporaryDirectory,
      });

      expect(result.exitCode).toBe(0);

      // Should NOT create depcruise configs (no architecture detected)
      expect(
        fileExists(temporaryDirectory, ".safeword/depcruise-config.cjs"),
      ).toBe(false);
      expect(fileExists(temporaryDirectory, ".dependency-cruiser.cjs")).toBe(
        false,
      );
    });
  });

  describe("Test 6.3: Logs detected architecture", () => {
    it("should output detected architecture during setup", async () => {
      createTypeScriptPackageJson(temporaryDirectory);
      initGitRepo(temporaryDirectory);

      // Create architecture directories
      writeTestFile(
        temporaryDirectory,
        "src/utils/helper.ts",
        "export const x = 1;",
      );
      writeTestFile(
        temporaryDirectory,
        "src/components/Button.tsx",
        "export const Button = () => null;",
      );

      const result = await runCli(["setup"], {
        cwd: temporaryDirectory,
      });

      expect(result.exitCode).toBe(0);

      // Should log what was detected
      expect(result.stdout).toMatch(/architecture detected/i);
    });
  });

  describe("Test 6.4: Includes arch files in setup summary", () => {
    it("should list depcruise files in created files summary", async () => {
      createTypeScriptPackageJson(temporaryDirectory);
      initGitRepo(temporaryDirectory);

      // Create architecture directory
      writeTestFile(
        temporaryDirectory,
        "src/utils/helper.ts",
        "export const x = 1;",
      );

      const result = await runCli(["setup"], {
        cwd: temporaryDirectory,
      });

      expect(result.exitCode).toBe(0);

      // Should mention depcruise files in output
      expect(result.stdout).toContain(".dependency-cruiser.cjs");
    });
  });
});
