/**
 * E2E Test: Golden Path
 *
 * Verifies that a safeword-configured project actually works:
 * - ESLint config runs and catches issues
 * - Prettier formats files correctly
 * - Claude Code hook scripts execute correctly
 *
 * Uses a single project setup (expensive) shared across all tests.
 */

import { execSync } from "node:child_process";
import nodePath from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createTemporaryDirectory,
  createTypeScriptPackageJson,
  initGitRepo,
  readTestFile,
  removeTemporaryDirectory,
  runCli,
  writeTestFile,
} from "../helpers";

describe("E2E: Golden Path", () => {
  let projectDirectory: string;

  beforeAll(async () => {
    projectDirectory = createTemporaryDirectory();
    createTypeScriptPackageJson(projectDirectory);
    initGitRepo(projectDirectory);
    await runCli(["setup"], { cwd: projectDirectory });
  }, 180_000); // 3 min timeout for bun install

  afterAll(() => {
    if (projectDirectory) {
      removeTemporaryDirectory(projectDirectory);
    }
  });

  it("eslint config is valid and runs", () => {
    writeTestFile(projectDirectory, "src/valid.ts", "export const x = 1;\n");

    // Should not throw - config is valid
    const result = execSync("bunx eslint src/valid.ts", {
      cwd: projectDirectory,
      encoding: "utf8",
    });
    expect(result).toBeDefined();
  });

  it("eslint detects violations", () => {
    // Use 'var' which is flagged by recommended rules
    writeTestFile(projectDirectory, "src/bad.ts", "var unused = 1;\n");

    // Should throw because of lint errors
    expect(() => {
      execSync("bunx eslint src/bad.ts", {
        cwd: projectDirectory,
        encoding: "utf8",
      });
    }).toThrow();
  });

  it("prettier formats files", () => {
    writeTestFile(projectDirectory, "src/ugly.ts", "const x=1;const y=2;\n");

    execSync("bunx prettier --write src/ugly.ts", { cwd: projectDirectory });

    const formatted = readTestFile(projectDirectory, "src/ugly.ts");
    // Prettier adds spaces and may split lines
    expect(formatted).toContain("const x = 1");
  });

  it("post-tool-lint hook processes files", () => {
    const filePath = nodePath.join(projectDirectory, "src/hook-test.ts");
    writeTestFile(projectDirectory, "src/hook-test.ts", "const x=1\n");

    // Simulate Claude Code PostToolUse hook input
    // Note: Only tool_input.file_path is used by the hook
    const hookInput = JSON.stringify({
      session_id: "test-session",
      hook_event_name: "PostToolUse",
      tool_name: "Write",
      tool_input: { file_path: filePath },
    });

    // Run the hook
    execSync(`echo '${hookInput}' | bun .safeword/hooks/post-tool-lint.ts`, {
      cwd: projectDirectory,
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
      encoding: "utf8",
    });

    // File should be formatted (Prettier adds semicolon and spaces)
    const result = readTestFile(projectDirectory, "src/hook-test.ts");
    expect(result.trim()).toBe("const x = 1;");
  });
});
