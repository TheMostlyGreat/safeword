/**
 * Test Suite: Language Packs
 * Tests for pack registry, config tracking, and installation.
 *
 * Test Definitions: .safeword/planning/test-definitions/feature-language-packs.md
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  getInstalledPacks,
  isPackInstalled,
} from '../../src/packs/config.js';
import { installPack } from '../../src/packs/install.js';
// These imports will fail until implementation exists
import {
  detectLanguages,
  findPackForExtension,
} from '../../src/packs/registry.js';
import {
  createPackageJson,
  createPythonProject,
  createTemporaryDirectory,
  initGitRepo,
  readTestFile,
  removeTemporaryDirectory,
  writeTestFile,
} from '../helpers.js';

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

describe('Pack Registry', () => {
  it('Test 1.1: Maps file extensions to language packs', () => {
    // Python extensions → python pack
    const pyPack = findPackForExtension('.py');
    expect(pyPack).not.toBeNull();
    expect(pyPack?.id).toBe('python');

    // TypeScript/JS extensions → typescript pack
    const tsPack = findPackForExtension('.ts');
    expect(tsPack).not.toBeNull();
    expect(tsPack?.id).toBe('typescript');

    const tsxPack = findPackForExtension('.tsx');
    expect(tsxPack?.id).toBe('typescript');

    const jsPack = findPackForExtension('.js');
    expect(jsPack?.id).toBe('typescript');

    // Unknown extensions → null
    const unknownPack = findPackForExtension('.xyz');
    expect(unknownPack).toBeNull();
  });

  it('Test 1.2: Detects languages from project markers', () => {
    // Create project with both Python and TypeScript markers
    createPythonProject(testDir);
    createPackageJson(testDir, {
      devDependencies: { typescript: '^5.0.0' },
    });

    const detected = detectLanguages(testDir);

    // Should detect both (order doesn't matter)
    expect(detected).toContain('python');
    expect(detected).toContain('typescript');
    expect(detected).toHaveLength(2);
  });
});

// =============================================================================
// Test Suite 2: Config Tracking (Unit Tests)
// =============================================================================

describe('Config Tracking', () => {
  it('Test 1.3: Reads and writes installed packs from config', () => {
    // Create .safeword directory
    writeTestFile(testDir, '.safeword/config.json', JSON.stringify({
      version: '0.15.0',
      installedPacks: [],
    }));

    // Empty config → empty array
    expect(getInstalledPacks(testDir)).toEqual([]);

    // Not installed → false
    expect(isPackInstalled(testDir, 'python')).toBe(false);

    // Write config with installed pack
    writeTestFile(testDir, '.safeword/config.json', JSON.stringify({
      version: '0.15.0',
      installedPacks: ['python'],
    }));

    // Now should return the pack
    expect(getInstalledPacks(testDir)).toEqual(['python']);
    expect(isPackInstalled(testDir, 'python')).toBe(true);
    expect(isPackInstalled(testDir, 'go')).toBe(false);
  });
});

// =============================================================================
// Test Suite 3: Pack Installation (Unit Tests)
// =============================================================================

describe('Pack Installation', () => {
  it('Test 1.4: Installs pack and updates config', () => {
    // Create Python project with empty config
    createPythonProject(testDir);
    initGitRepo(testDir);
    writeTestFile(testDir, '.safeword/config.json', JSON.stringify({
      version: '0.15.0',
      installedPacks: [],
    }));

    // Install Python pack
    installPack('python', testDir);

    // Config should now contain python
    const config = JSON.parse(readTestFile(testDir, '.safeword/config.json'));
    expect(config.installedPacks).toContain('python');

    // Python pack should have created pyproject.toml configs
    const pyproject = readTestFile(testDir, 'pyproject.toml');
    expect(pyproject).toContain('[tool.ruff]');
  });

  it('Test 1.5: Skips already-installed packs', () => {
    // Create Python project with pack already installed
    createPythonProject(testDir);
    initGitRepo(testDir);
    writeTestFile(testDir, '.safeword/config.json', JSON.stringify({
      version: '0.15.0',
      installedPacks: ['python'],
    }));

    // Get initial pyproject.toml state
    const initialPyproject = readTestFile(testDir, 'pyproject.toml');

    // Install again (should be idempotent)
    installPack('python', testDir);

    // Config should be unchanged (no duplicates)
    const config = JSON.parse(readTestFile(testDir, '.safeword/config.json'));
    expect(config.installedPacks).toEqual(['python']);
    expect(config.installedPacks.filter((p: string) => p === 'python')).toHaveLength(1);

    // pyproject.toml should be unchanged (setup not called again)
    const finalPyproject = readTestFile(testDir, 'pyproject.toml');
    expect(finalPyproject).toBe(initialPyproject);
  });
});
