/**
 * Test Suite: Language Packs
 * Tests for pack registry, config tracking, and installation.
 *
 * Test Definitions: .safeword/planning/test-definitions/feature-language-packs.md
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getInstalledPacks, isPackInstalled } from "../../src/packs/config.js";
import { installPack } from "../../src/packs/install.js";
import {
  detectLanguages,
  findPackForExtension,
} from "../../src/packs/registry.js";
import {
  createPackageJson,
  createPythonProject,
  createTemporaryDirectory,
  initGitRepo,
  readSafewordConfig,
  readTestFile,
  removeTemporaryDirectory,
  writeSafewordConfig,
} from "../helpers.js";

let testDir: string;

beforeEach(() => {
  testDir = createTemporaryDirectory();
});

afterEach(() => {
  if (testDir) {
    removeTemporaryDirectory(testDir);
  }
});

// =============================================================================
// Test Suite 1: Pack Registry (Unit Tests)
// =============================================================================

describe("Pack Registry", () => {
  it("Test 1.1: Maps file extensions to language packs", () => {
    // Python extensions → python pack
    const pyPack = findPackForExtension(".py");
    expect(pyPack).toBeDefined();
    expect(pyPack?.id).toBe("python");

    // TypeScript/JS extensions → typescript pack
    const tsPack = findPackForExtension(".ts");
    expect(tsPack).toBeDefined();
    expect(tsPack?.id).toBe("typescript");

    const tsxPack = findPackForExtension(".tsx");
    expect(tsxPack?.id).toBe("typescript");

    const jsPack = findPackForExtension(".js");
    expect(jsPack?.id).toBe("typescript");

    // Unknown extensions → undefined
    const unknownPack = findPackForExtension(".xyz");
    expect(unknownPack).toBeUndefined();
  });

  it("Test 1.2: Detects languages from project markers", () => {
    // Create project with both Python and TypeScript markers
    createPythonProject(testDir);
    createPackageJson(testDir, {
      devDependencies: { typescript: "^5.0.0" },
    });

    const detected = detectLanguages(testDir);

    // Should detect both (order doesn't matter)
    expect(detected).toContain("python");
    expect(detected).toContain("typescript");
    expect(detected).toHaveLength(2);
  });
});

// =============================================================================
// Test Suite 2: Config Tracking (Unit Tests)
// =============================================================================

describe("Config Tracking", () => {
  it("Test 1.3: Reads installed packs from config", () => {
    // Empty config → empty array
    writeSafewordConfig(testDir, { installedPacks: [] });
    expect(getInstalledPacks(testDir)).toEqual([]);
    expect(isPackInstalled(testDir, "python")).toBe(false);

    // With installed pack
    writeSafewordConfig(testDir, { installedPacks: ["python"] });
    expect(getInstalledPacks(testDir)).toEqual(["python"]);
    expect(isPackInstalled(testDir, "python")).toBe(true);
    expect(isPackInstalled(testDir, "go")).toBe(false);
  });
});

// =============================================================================
// Test Suite 3: Pack Installation (Unit Tests)
// =============================================================================

describe("Pack Installation", () => {
  it("Test 1.4: Installs pack and updates config", () => {
    createPythonProject(testDir);
    initGitRepo(testDir);
    writeSafewordConfig(testDir, { installedPacks: [] });

    installPack("python", testDir);

    // Config updated
    const config = readSafewordConfig(testDir);
    expect(config.installedPacks).toContain("python");

    // Pack setup ran - setupPythonTooling now returns empty (reconciliation handles files)
    // Just verify the pack was registered
    expect(config.installedPacks).toContain("python");
  });

  it("Test 1.5: Skips already-installed packs", () => {
    createPythonProject(testDir);
    initGitRepo(testDir);
    writeSafewordConfig(testDir, { installedPacks: ["python"] });
    const initialPyproject = readTestFile(testDir, "pyproject.toml");

    installPack("python", testDir);

    // Config unchanged
    const config = readSafewordConfig(testDir);
    expect(config.installedPacks).toEqual(["python"]);

    // Setup not called (pyproject unchanged)
    expect(readTestFile(testDir, "pyproject.toml")).toBe(initialPyproject);
  });
});
