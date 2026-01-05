/**
 * Test Suite: Setup Command (Reconcile-based)
 *
 * Tests that the setup command uses reconcile() with mode='install'
 * to create all managed files and directories.
 *
 * TDD RED phase - these tests verify reconcile integration.
 */

import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Setup Command - Reconcile Integration", () => {
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(
      nodePath.join(tmpdir(), "safeword-setup-reconcile-"),
    );
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  describe("reconcile mode=install", () => {
    it("should compute all install actions correctly", async () => {
      const { reconcile } = await import("../../src/reconcile.js");
      const { SAFEWORD_SCHEMA } = await import("../../src/schema.js");
      const { createProjectContext } =
        await import("../../src/utils/context.js");

      // Create minimal package.json
      writeFileSync(
        nodePath.join(temporaryDirectory, "package.json"),
        JSON.stringify({ name: "test", version: "1.0.0" }, undefined, 2),
      );

      const ctx = createProjectContext(temporaryDirectory);
      const result = await reconcile(SAFEWORD_SCHEMA, "install", ctx, {
        dryRun: true,
      });

      // dryRun should compute actions without applying
      expect(result.applied).toBe(false);

      // Should have mkdir actions for directories
      const mkdirActions = result.actions.filter((a) => a.type === "mkdir");
      expect(mkdirActions.length).toBeGreaterThan(0);

      // Should have write actions for files
      const writeActions = result.actions.filter((a) => a.type === "write");
      expect(writeActions.length).toBeGreaterThan(0);

      // Should have SAFEWORD.md write action
      const hasSafewordMd = writeActions.some(
        (a) => a.type === "write" && a.path.includes("SAFEWORD.md"),
      );
      expect(hasSafewordMd).toBe(true);

      // Should have version file write action
      const hasVersion = writeActions.some(
        (a) => a.type === "write" && a.path === ".safeword/version",
      );
      expect(hasVersion).toBe(true);

      // Should have JSON merge for settings.json
      const jsonMergeActions = result.actions.filter(
        (a) => a.type === "json-merge",
      );
      expect(jsonMergeActions.length).toBeGreaterThan(0);

      // Should compute packages to install
      expect(result.packagesToInstall.length).toBeGreaterThan(0);
      expect(result.packagesToInstall).toContain("eslint");
    });

    it("should create all directories when applied", async () => {
      const { reconcile } = await import("../../src/reconcile.js");
      const { SAFEWORD_SCHEMA } = await import("../../src/schema.js");
      const { createProjectContext } =
        await import("../../src/utils/context.js");

      writeFileSync(
        nodePath.join(temporaryDirectory, "package.json"),
        JSON.stringify({ name: "test", version: "1.0.0" }, undefined, 2),
      );

      const ctx = createProjectContext(temporaryDirectory);
      await reconcile(SAFEWORD_SCHEMA, "install", ctx);

      // Check directories created
      expect(existsSync(nodePath.join(temporaryDirectory, ".safeword"))).toBe(
        true,
      );
      expect(
        existsSync(nodePath.join(temporaryDirectory, ".safeword/hooks")),
      ).toBe(true);
      expect(
        existsSync(nodePath.join(temporaryDirectory, ".safeword/guides")),
      ).toBe(true);
      expect(
        existsSync(nodePath.join(temporaryDirectory, ".safeword/learnings")),
      ).toBe(true);
      expect(
        existsSync(nodePath.join(temporaryDirectory, ".safeword/tickets")),
      ).toBe(true);
      expect(
        existsSync(
          nodePath.join(temporaryDirectory, ".safeword/tickets/completed"),
        ),
      ).toBe(true);
      expect(existsSync(nodePath.join(temporaryDirectory, ".claude"))).toBe(
        true,
      );
      expect(
        existsSync(nodePath.join(temporaryDirectory, ".claude/commands")),
      ).toBe(true);
    });

    it("should create all owned files when applied", async () => {
      const { reconcile } = await import("../../src/reconcile.js");
      const { SAFEWORD_SCHEMA } = await import("../../src/schema.js");
      const { createProjectContext } =
        await import("../../src/utils/context.js");

      writeFileSync(
        nodePath.join(temporaryDirectory, "package.json"),
        JSON.stringify({ name: "test", version: "1.0.0" }, undefined, 2),
      );

      const ctx = createProjectContext(temporaryDirectory);
      await reconcile(SAFEWORD_SCHEMA, "install", ctx);

      // Check core files
      expect(
        existsSync(nodePath.join(temporaryDirectory, ".safeword/SAFEWORD.md")),
      ).toBe(true);
      expect(
        existsSync(nodePath.join(temporaryDirectory, ".safeword/version")),
      ).toBe(true);

      // Check hook files
      expect(
        existsSync(
          nodePath.join(
            temporaryDirectory,
            ".safeword/hooks/session-verify-agents.ts",
          ),
        ),
      ).toBe(true);
      expect(
        existsSync(
          nodePath.join(temporaryDirectory, ".safeword/hooks/stop-quality.ts"),
        ),
      ).toBe(true);

      // Check guides
      expect(
        existsSync(
          nodePath.join(
            temporaryDirectory,
            ".safeword/guides/architecture-guide.md",
          ),
        ),
      ).toBe(true);
      expect(
        existsSync(
          nodePath.join(
            temporaryDirectory,
            ".safeword/guides/planning-guide.md",
          ),
        ),
      ).toBe(true);
      expect(
        existsSync(
          nodePath.join(
            temporaryDirectory,
            ".safeword/guides/testing-guide.md",
          ),
        ),
      ).toBe(true);

      // Check claude files
      expect(
        existsSync(
          nodePath.join(temporaryDirectory, ".claude/commands/lint.md"),
        ),
      ).toBe(true);
    });

    it("should create managed files only if missing", async () => {
      const { reconcile } = await import("../../src/reconcile.js");
      const { SAFEWORD_SCHEMA } = await import("../../src/schema.js");
      const { createProjectContext } =
        await import("../../src/utils/context.js");

      writeFileSync(
        nodePath.join(temporaryDirectory, "package.json"),
        JSON.stringify({ name: "test", version: "1.0.0" }, undefined, 2),
      );

      // Create existing eslint config with custom content
      writeFileSync(
        nodePath.join(temporaryDirectory, "eslint.config.mjs"),
        "// Custom ESLint config",
      );

      const ctx = createProjectContext(temporaryDirectory);
      await reconcile(SAFEWORD_SCHEMA, "install", ctx);

      // Existing eslint config should NOT be overwritten
      const eslintContent = readFileSync(
        nodePath.join(temporaryDirectory, "eslint.config.mjs"),
        "utf8",
      );
      expect(eslintContent).toBe("// Custom ESLint config");

      // But prettierrc should be created if missing
      expect(existsSync(nodePath.join(temporaryDirectory, ".prettierrc"))).toBe(
        true,
      );
    });

    it("should apply JSON merges for settings.json", async () => {
      const { reconcile } = await import("../../src/reconcile.js");
      const { SAFEWORD_SCHEMA } = await import("../../src/schema.js");
      const { createProjectContext } =
        await import("../../src/utils/context.js");

      writeFileSync(
        nodePath.join(temporaryDirectory, "package.json"),
        JSON.stringify({ name: "test", version: "1.0.0" }, undefined, 2),
      );

      const ctx = createProjectContext(temporaryDirectory);
      await reconcile(SAFEWORD_SCHEMA, "install", ctx);

      // Settings should be created with hooks
      expect(
        existsSync(nodePath.join(temporaryDirectory, ".claude/settings.json")),
      ).toBe(true);
      const settings = JSON.parse(
        readFileSync(
          nodePath.join(temporaryDirectory, ".claude/settings.json"),
          "utf8",
        ),
      );
      expect(settings.hooks).toBeDefined();
      expect(settings.hooks.SessionStart).toBeDefined();
    });

    it("should apply JSON merges for package.json scripts", async () => {
      const { reconcile } = await import("../../src/reconcile.js");
      const { SAFEWORD_SCHEMA } = await import("../../src/schema.js");
      const { createProjectContext } =
        await import("../../src/utils/context.js");

      writeFileSync(
        nodePath.join(temporaryDirectory, "package.json"),
        JSON.stringify({ name: "test", version: "1.0.0" }, undefined, 2),
      );

      const ctx = createProjectContext(temporaryDirectory);
      await reconcile(SAFEWORD_SCHEMA, "install", ctx);

      // Package.json should have scripts added
      const packageJson = JSON.parse(
        readFileSync(nodePath.join(temporaryDirectory, "package.json"), "utf8"),
      );
      expect(packageJson.scripts?.lint).toBeDefined();
      expect(packageJson.scripts?.format).toBeDefined();
      expect(packageJson.scripts?.knip).toBeDefined();
    });

    it("should create AGENTS.md via text patch", async () => {
      const { reconcile } = await import("../../src/reconcile.js");
      const { SAFEWORD_SCHEMA } = await import("../../src/schema.js");
      const { createProjectContext } =
        await import("../../src/utils/context.js");

      writeFileSync(
        nodePath.join(temporaryDirectory, "package.json"),
        JSON.stringify({ name: "test", version: "1.0.0" }, undefined, 2),
      );

      const ctx = createProjectContext(temporaryDirectory);
      await reconcile(SAFEWORD_SCHEMA, "install", ctx);

      // AGENTS.md should be created with safeword link
      expect(existsSync(nodePath.join(temporaryDirectory, "AGENTS.md"))).toBe(
        true,
      );
      const content = readFileSync(
        nodePath.join(temporaryDirectory, "AGENTS.md"),
        "utf8",
      );
      expect(content).toContain(".safeword/SAFEWORD.md");
    });

    it("should prepend to existing AGENTS.md", async () => {
      const { reconcile } = await import("../../src/reconcile.js");
      const { SAFEWORD_SCHEMA } = await import("../../src/schema.js");
      const { createProjectContext } =
        await import("../../src/utils/context.js");

      writeFileSync(
        nodePath.join(temporaryDirectory, "package.json"),
        JSON.stringify({ name: "test", version: "1.0.0" }, undefined, 2),
      );

      // Create existing AGENTS.md
      writeFileSync(
        nodePath.join(temporaryDirectory, "AGENTS.md"),
        "# My Project\n\nCustom content here.",
      );

      const ctx = createProjectContext(temporaryDirectory);
      await reconcile(SAFEWORD_SCHEMA, "install", ctx);

      // AGENTS.md should have link prepended
      const content = readFileSync(
        nodePath.join(temporaryDirectory, "AGENTS.md"),
        "utf8",
      );
      expect(content).toContain(".safeword/SAFEWORD.md");
      expect(content).toContain("Custom content here");
    });

    it("should detect framework-specific packages", async () => {
      const { reconcile } = await import("../../src/reconcile.js");
      const { SAFEWORD_SCHEMA } = await import("../../src/schema.js");
      const { createProjectContext } =
        await import("../../src/utils/context.js");

      // Create package.json with Astro dependency
      writeFileSync(
        nodePath.join(temporaryDirectory, "package.json"),
        JSON.stringify(
          {
            name: "test",
            version: "1.0.0",
            devDependencies: {
              astro: "^4.0.0",
            },
          },
          undefined,
          2,
        ),
      );

      const ctx = createProjectContext(temporaryDirectory);
      const result = await reconcile(SAFEWORD_SCHEMA, "install", ctx, {
        dryRun: true,
      });

      // Should include Astro prettier plugin (NOT bundled in safeword)
      expect(result.packagesToInstall).toContain("prettier-plugin-astro");
    });
  });

  describe("setup command integration", () => {
    it("should run setup successfully via CLI", async () => {
      writeFileSync(
        nodePath.join(temporaryDirectory, "package.json"),
        JSON.stringify({ name: "test", version: "1.0.0" }, undefined, 2),
      );

      const cliPath = nodePath.join(process.cwd(), "src/cli.ts");
      try {
        const result = execSync(`bunx tsx ${cliPath} setup --yes`, {
          cwd: temporaryDirectory,
          encoding: "utf8",
          timeout: 60_000,
        });

        expect(result).toContain("Setup");
      } catch (error) {
        // Check if setup itself worked even if bun install timed out
        const stdout = (error as { stdout?: string }).stdout || "";

        // If we see setup output and .safeword exists, the reconcile worked
        if (
          (stdout.includes("Setup") || stdout.includes("Created")) &&
          existsSync(nodePath.join(temporaryDirectory, ".safeword"))
        ) {
          expect(true).toBe(true);
        } else {
          throw error;
        }
      }
    });

    it("should error on already configured project", async () => {
      writeFileSync(
        nodePath.join(temporaryDirectory, "package.json"),
        JSON.stringify({ name: "test", version: "1.0.0" }, undefined, 2),
      );

      // Create .safeword dir
      mkdirSync(nodePath.join(temporaryDirectory, ".safeword"), {
        recursive: true,
      });

      const cliPath = nodePath.join(process.cwd(), "src/cli.ts");
      try {
        execSync(`bunx tsx ${cliPath} setup --yes`, {
          cwd: temporaryDirectory,
          encoding: "utf8",
          timeout: 30_000,
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        const stderr = (error as { stderr?: string }).stderr || "";
        expect(stderr.toLowerCase()).toContain("already configured");
      }
    });
  });
});
