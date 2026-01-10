/**
 * E2E Test: Python Golden Path
 *
 * Verifies that a Python project with safeword works correctly:
 * - Ruff config is created in pyproject.toml
 * - Ruff runs and catches issues (when installed)
 * - Ruff formats Python files (when installed)
 * - Post-tool lint hook processes Python files (when Ruff installed)
 *
 * Note: Tests requiring Ruff are skipped if Ruff is not installed.
 * Uses a single project setup (expensive) shared across all tests.
 */

import { execSync, spawnSync } from "node:child_process";
import nodePath from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createPythonProject,
  createTemporaryDirectory,
  initGitRepo,
  isRuffInstalled,
  readTestFile,
  removeTemporaryDirectory,
  runCli,
  runLintHook,
  writeTestFile,
} from "../helpers";

const RUFF_AVAILABLE = isRuffInstalled();

describe("E2E: Python Golden Path", () => {
  let projectDirectory: string;

  beforeAll(async () => {
    projectDirectory = createTemporaryDirectory();
    createPythonProject(projectDirectory);
    initGitRepo(projectDirectory);
    await runCli(["setup", "--yes"], { cwd: projectDirectory });
  }, 180_000); // 3 min timeout for setup

  afterAll(() => {
    if (projectDirectory) {
      removeTemporaryDirectory(projectDirectory);
    }
  });

  it("creates Ruff config via extend pattern", () => {
    const ruffToml = readTestFile(projectDirectory, "ruff.toml");
    const safewordRuff = readTestFile(projectDirectory, ".safeword/ruff.toml");

    // Project-level ruff.toml extends .safeword/ruff.toml
    expect(ruffToml).toContain('extend = ".safeword/ruff.toml"');

    // Actual strict rules are in .safeword/ruff.toml
    expect(safewordRuff).toContain("line-length");
    expect(safewordRuff).toContain("[lint]");
    expect(safewordRuff).toContain("select");
  });

  it.skipIf(!RUFF_AVAILABLE)("ruff config is valid and runs", () => {
    writeTestFile(projectDirectory, "src/valid.py", "x = 1\n");

    // Should not throw - ruff check runs successfully
    const result = spawnSync("ruff", ["check", "src/valid.py"], {
      cwd: projectDirectory,
      encoding: "utf8",
    });

    // Exit 0 means no errors
    expect(result.status).toBe(0);
  });

  it.skipIf(!RUFF_AVAILABLE)("ruff detects violations", () => {
    // Unused import, which is flagged by Ruff
    writeTestFile(projectDirectory, "src/bad.py", "import os\nx = 1\n");

    const result = spawnSync("ruff", ["check", "src/bad.py"], {
      cwd: projectDirectory,
      encoding: "utf8",
    });

    // Should fail because of unused import
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain("F401"); // unused import
  });

  it.skipIf(!RUFF_AVAILABLE)("ruff formats files", () => {
    // Badly formatted Python - extra spaces, missing newline
    writeTestFile(projectDirectory, "src/ugly.py", "x=1;y=2");

    execSync("ruff format src/ugly.py", { cwd: projectDirectory });

    const formatted = readTestFile(projectDirectory, "src/ugly.py");
    // Ruff format adds spaces around = and newlines
    expect(formatted).toContain("x = 1");
    expect(formatted).toContain("y = 2");
  });

  it.skipIf(!RUFF_AVAILABLE)(
    "post-tool-lint hook processes Python files",
    () => {
      const filePath = nodePath.join(projectDirectory, "src/hook-test.py");
      // Intentionally badly formatted
      writeTestFile(projectDirectory, "src/hook-test.py", "x=1;y=2");

      // Run the lint hook
      runLintHook(projectDirectory, filePath);

      // File should be formatted by Ruff
      const result = readTestFile(projectDirectory, "src/hook-test.py");
      expect(result).toContain("x = 1");
      expect(result).toContain("y = 2");
    },
  );
});
