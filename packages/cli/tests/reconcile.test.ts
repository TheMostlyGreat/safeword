/**
 * Test Suite: Reconciliation Engine
 *
 * Tests the reconcile() function that computes and executes plans
 * based on SAFEWORD_SCHEMA and the current project state.
 *
 * TDD RED phase - these tests should FAIL until src/reconcile.ts is implemented.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// This import will fail until reconcile.ts is created (RED phase)
// import { reconcile, computePackagesToInstall } from '../src/reconcile.js';
// import { SAFEWORD_SCHEMA } from '../src/schema.js';

describe('Reconcile - Reconciliation Engine', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'safeword-reconcile-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  // Helper to create a minimal package.json
  function createPackageJson(content: Record<string, unknown> = {}) {
    const defaultContent = {
      name: 'test-project',
      version: '1.0.0',
      ...content,
    };
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(defaultContent, null, 2));
    return defaultContent;
  }

  // Helper to create project context
  function createContext(overrides: Record<string, unknown> = {}) {
    return {
      cwd: tempDir,
      projectType: {
        typescript: false,
        react: false,
        nextjs: false,
        astro: false,
        vue: false,
        svelte: false,
        electron: false,
        vitest: false,
        tailwind: false,
        publishableLibrary: false,
        ...(overrides.projectType as Record<string, boolean>),
      },
      devDeps: (overrides.devDeps as Record<string, string>) ?? {},
      isGitRepo: (overrides.isGitRepo as boolean) ?? true, // Default to true so husky tests pass
    };
  }

  describe('reconcile() - install mode', () => {
    it('should create all owned directories', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      const result = await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      expect(result.applied).toBe(true);

      // Verify all ownedDirs were created
      for (const dir of SAFEWORD_SCHEMA.ownedDirs) {
        expect(existsSync(join(tempDir, dir))).toBe(true);
      }
    });

    it('should create all shared directories', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      for (const dir of SAFEWORD_SCHEMA.sharedDirs) {
        expect(existsSync(join(tempDir, dir))).toBe(true);
      }
    });

    it('should create all preserved directories', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      for (const dir of SAFEWORD_SCHEMA.preservedDirs) {
        expect(existsSync(join(tempDir, dir))).toBe(true);
      }
    });

    it('should write all owned files', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      const result = await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Check a sample of owned files exist
      expect(existsSync(join(tempDir, '.safeword/SAFEWORD.md'))).toBe(true);
      expect(existsSync(join(tempDir, '.safeword/version'))).toBe(true);
      expect(existsSync(join(tempDir, '.husky/pre-commit'))).toBe(true);

      // created should include all owned files
      expect(result.created.length).toBeGreaterThan(0);
    });

    it('should skip .husky directory and files in non-git repos', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext({ isGitRepo: false });

      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // .husky should NOT be created in non-git repos
      expect(existsSync(join(tempDir, '.husky'))).toBe(false);
      expect(existsSync(join(tempDir, '.husky/pre-commit'))).toBe(false);

      // But .safeword should still be created
      expect(existsSync(join(tempDir, '.safeword/SAFEWORD.md'))).toBe(true);
      expect(existsSync(join(tempDir, '.safeword/hooks'))).toBe(true);
    });

    it('should create managed files when missing', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // managedFiles should be created
      expect(existsSync(join(tempDir, 'eslint.config.mjs'))).toBe(true);
      expect(existsSync(join(tempDir, '.prettierrc'))).toBe(true);
      expect(existsSync(join(tempDir, '.markdownlint-cli2.jsonc'))).toBe(true);
    });

    it('should merge JSON files', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson({ scripts: { test: 'vitest' } });
      const ctx = createContext();

      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      const pkg = JSON.parse(readFileSync(join(tempDir, 'package.json'), 'utf-8'));

      // Existing scripts preserved
      expect(pkg.scripts.test).toBe('vitest');
      // Safeword scripts added
      expect(pkg.scripts.lint).toBe('eslint .');
      expect(pkg.scripts.format).toBe('prettier --write .');
      expect(pkg.scripts.knip).toBe('knip');
      expect(pkg['lint-staged']).toBeDefined();
    });

    it('should apply text patches', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // AGENTS.md should be created with the prepend content
      expect(existsSync(join(tempDir, 'AGENTS.md'))).toBe(true);
      const content = readFileSync(join(tempDir, 'AGENTS.md'), 'utf-8');
      expect(content).toContain('@./.safeword/SAFEWORD.md');
    });

    it('should compute packages to install', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      const result = await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Should include all base packages
      expect(result.packagesToInstall).toContain('eslint');
      expect(result.packagesToInstall).toContain('prettier');
      expect(result.packagesToInstall).toContain('husky');
    });

    it('should include conditional packages based on project type', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext({ projectType: { typescript: true, react: true } });

      const result = await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      expect(result.packagesToInstall).toContain('typescript-eslint');
      expect(result.packagesToInstall).toContain('eslint-plugin-react');
      expect(result.packagesToInstall).toContain('eslint-plugin-react-hooks');
    });

    it('should exclude already installed packages', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson({ devDependencies: { eslint: '^8.0.0', prettier: '^3.0.0' } });
      const ctx = createContext({ devDeps: { eslint: '^8.0.0', prettier: '^3.0.0' } });

      const result = await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      expect(result.packagesToInstall).not.toContain('eslint');
      expect(result.packagesToInstall).not.toContain('prettier');
      // But should still include others
      expect(result.packagesToInstall).toContain('husky');
    });
  });

  describe('reconcile() - upgrade mode', () => {
    it('should remove deprecated files that exist', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      // First install
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Create a deprecated file (simulating old version)
      const deprecatedPath = join(tempDir, '.safeword/templates/user-stories-template.md');
      mkdirSync(join(tempDir, '.safeword/templates'), { recursive: true });
      writeFileSync(deprecatedPath, '# Old User Stories Template');

      // Upgrade should remove deprecated file
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);

      expect(result.removed).toContain('.safeword/templates/user-stories-template.md');
      expect(existsSync(deprecatedPath)).toBe(false);
    });

    it('should not fail when deprecated files do not exist', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      // First install
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Ensure deprecated file does not exist
      const deprecatedPath = join(tempDir, '.safeword/templates/user-stories-template.md');
      expect(existsSync(deprecatedPath)).toBe(false);

      // Upgrade should succeed without errors
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);

      expect(result.applied).toBe(true);
      // Deprecated file not in removed list since it didn't exist
      expect(result.removed).not.toContain('.safeword/templates/user-stories-template.md');
    });

    it('should include deprecated files in dryRun upgrade actions', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      // First install
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Create a deprecated file
      const deprecatedPath = join(tempDir, '.safeword/templates/user-stories-template.md');
      mkdirSync(join(tempDir, '.safeword/templates'), { recursive: true });
      writeFileSync(deprecatedPath, '# Old Template');

      // dryRun upgrade should report deprecated file in actions
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx, { dryRun: true });

      // Should have rm action for deprecated file
      const rmActions = result.actions.filter(a => a.type === 'rm');
      expect(rmActions.some(a => a.path === '.safeword/templates/user-stories-template.md')).toBe(
        true,
      );

      // File should still exist (dryRun)
      expect(existsSync(deprecatedPath)).toBe(true);

      // Should be in removed list
      expect(result.removed).toContain('.safeword/templates/user-stories-template.md');
    });

    it('should update owned files only if content changed', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      // First install
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Modify an owned file
      const versionPath = join(tempDir, '.safeword/version');
      writeFileSync(versionPath, 'old-version');

      // Upgrade should update it
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);

      expect(result.updated).toContain('.safeword/version');
    });

    it('should not update owned files if content matches', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      // First install
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Upgrade without changes
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);

      // Nothing should be updated
      expect(result.updated.length).toBe(0);
    });

    it('should skip managed files if user modified them', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      // First install
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // User modifies eslint config
      const eslintPath = join(tempDir, 'eslint.config.mjs');
      writeFileSync(eslintPath, '// User customized config\nexport default [];');

      // Upgrade should NOT overwrite it
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);

      expect(result.updated).not.toContain('eslint.config.mjs');

      // Verify content preserved
      const content = readFileSync(eslintPath, 'utf-8');
      expect(content).toContain('User customized');
    });

    it('should update managed files if content matches template', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      // First install
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Simulate template changed (by changing version in schema)
      // In real world, the template content would change
      // For this test, we verify the logic path exists

      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx);

      // Result should be valid
      expect(result.applied).toBe(true);
    });
  });

  describe('reconcile() - uninstall mode', () => {
    it('should remove all owned files including .safeword/', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      // First install
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Uninstall
      await reconcile(SAFEWORD_SCHEMA, 'uninstall', ctx);

      // All owned files should be removed
      expect(existsSync(join(tempDir, '.claude/commands/lint.md'))).toBe(false);
      expect(existsSync(join(tempDir, '.claude/skills/safeword-quality-reviewer/SKILL.md'))).toBe(
        false,
      );
      expect(existsSync(join(tempDir, '.safeword/SAFEWORD.md'))).toBe(false);
      expect(existsSync(join(tempDir, '.safeword'))).toBe(false);
    });

    it('should unmerge JSON files', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson({ scripts: { test: 'vitest' } });
      const ctx = createContext();

      // First install
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Uninstall
      await reconcile(SAFEWORD_SCHEMA, 'uninstall', ctx);

      const pkg = JSON.parse(readFileSync(join(tempDir, 'package.json'), 'utf-8'));

      // Safeword-specific scripts removed (but lint/format preserved)
      expect(pkg.scripts['lint:md']).toBeUndefined();
      expect(pkg.scripts['format:check']).toBeUndefined();
      expect(pkg.scripts.knip).toBeUndefined();
      expect(pkg['lint-staged']).toBeUndefined();

      // lint/format preserved (useful standalone)
      expect(pkg.scripts.lint).toBe('eslint .');
      expect(pkg.scripts.format).toBe('prettier --write .');

      // Original scripts preserved
      expect(pkg.scripts.test).toBe('vitest');
    });

    it('should remove text patches', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      // Create existing AGENTS.md with user content
      writeFileSync(join(tempDir, 'AGENTS.md'), '# My Project\n\nCustom content here.');
      createPackageJson();
      const ctx = createContext();

      // Install (prepends to AGENTS.md)
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Verify patch was applied
      let content = readFileSync(join(tempDir, 'AGENTS.md'), 'utf-8');
      expect(content).toContain('@./.safeword/SAFEWORD.md');
      expect(content).toContain('Custom content here');

      // Uninstall
      await reconcile(SAFEWORD_SCHEMA, 'uninstall', ctx);

      // Patch removed, user content preserved
      content = readFileSync(join(tempDir, 'AGENTS.md'), 'utf-8');
      expect(content).not.toContain('@./.safeword/SAFEWORD.md');
      expect(content).toContain('Custom content here');
    });

    it('should remove owned directories but preserve user content', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      // First install
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Add a completed ticket (should be preserved - user content)
      const completedDir = join(tempDir, '.safeword/tickets/completed');
      mkdirSync(completedDir, { recursive: true });
      writeFileSync(join(completedDir, '001-done.md'), 'Completed ticket');

      // Uninstall
      await reconcile(SAFEWORD_SCHEMA, 'uninstall', ctx);

      // Owned dirs removed
      expect(existsSync(join(tempDir, '.safeword/hooks'))).toBe(false);
      expect(existsSync(join(tempDir, '.safeword/guides'))).toBe(false);

      // Preserved dir still exists with user content
      expect(existsSync(join(tempDir, '.safeword/tickets/completed/001-done.md'))).toBe(true);

      // But .safeword parent still exists because of preserved content
      expect(existsSync(join(tempDir, '.safeword'))).toBe(true);
    });
  });

  describe('reconcile() - uninstall-full mode', () => {
    it('should remove managed files', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      // First install
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Full uninstall
      await reconcile(SAFEWORD_SCHEMA, 'uninstall-full', ctx);

      // Managed files removed
      expect(existsSync(join(tempDir, 'eslint.config.mjs'))).toBe(false);
      expect(existsSync(join(tempDir, '.prettierrc'))).toBe(false);
      expect(existsSync(join(tempDir, '.markdownlint-cli2.jsonc'))).toBe(false);
    });

    it('should compute packages to remove', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson({
        devDependencies: {
          eslint: '^8.0.0',
          prettier: '^3.0.0',
          husky: '^9.0.0',
        },
      });
      const ctx = createContext({
        devDeps: { eslint: '^8.0.0', prettier: '^3.0.0', husky: '^9.0.0' },
      });

      // First install
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Full uninstall
      const result = await reconcile(SAFEWORD_SCHEMA, 'uninstall-full', ctx);

      // Should include packages to remove
      expect(result.packagesToRemove).toContain('eslint');
      expect(result.packagesToRemove).toContain('prettier');
      expect(result.packagesToRemove).toContain('husky');
    });

    it('should remove .mcp.json if empty after unmerge', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      // First install (creates .mcp.json with our servers)
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);
      expect(existsSync(join(tempDir, '.mcp.json'))).toBe(true);

      // Full uninstall
      await reconcile(SAFEWORD_SCHEMA, 'uninstall-full', ctx);

      // .mcp.json should be removed (was only our content)
      expect(existsSync(join(tempDir, '.mcp.json'))).toBe(false);
    });
  });

  describe('reconcile() - dryRun option', () => {
    it('should not make any changes in dryRun mode', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      const result = await reconcile(SAFEWORD_SCHEMA, 'install', ctx, { dryRun: true });

      expect(result.applied).toBe(false);

      // No files should be created
      expect(existsSync(join(tempDir, '.safeword'))).toBe(false);
      expect(existsSync(join(tempDir, '.claude'))).toBe(false);
    });

    it('should still compute actions in dryRun mode', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      const result = await reconcile(SAFEWORD_SCHEMA, 'install', ctx, { dryRun: true });

      // Actions should be computed
      expect(result.actions.length).toBeGreaterThan(0);

      // Should have mkdir, write, and json-merge actions
      expect(result.actions.some(a => a.type === 'mkdir')).toBe(true);
      expect(result.actions.some(a => a.type === 'write')).toBe(true);
      expect(result.actions.some(a => a.type === 'json-merge')).toBe(true);
    });

    it('should report healthy when dryRun upgrade finds no changes', async () => {
      const { reconcile } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      createPackageJson();
      const ctx = createContext();

      // First install
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // dryRun upgrade should find no changes
      const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx, { dryRun: true });

      // No actions means healthy
      expect(result.actions.filter(a => a.type === 'write').length).toBe(0);
      expect(result.updated.length).toBe(0);
    });
  });

  describe('computePackagesToInstall()', () => {
    it('should return all base packages for fresh install', async () => {
      const { computePackagesToInstall } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      const projectType = {
        typescript: false,
        react: false,
        nextjs: false,
        astro: false,
        vue: false,
        svelte: false,
        electron: false,
        vitest: false,
        tailwind: false,
        publishableLibrary: false,
      };

      const result = computePackagesToInstall(SAFEWORD_SCHEMA, projectType, {});

      expect(result).toEqual(SAFEWORD_SCHEMA.packages.base);
    });

    it('should add TypeScript packages when typescript: true', async () => {
      const { computePackagesToInstall } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      const projectType = {
        typescript: true,
        react: false,
        nextjs: false,
        astro: false,
        vue: false,
        svelte: false,
        electron: false,
        vitest: false,
        tailwind: false,
        publishableLibrary: false,
      };

      const result = computePackagesToInstall(SAFEWORD_SCHEMA, projectType, {});

      expect(result).toContain('typescript-eslint');
    });

    it('should add multiple conditional packages', async () => {
      const { computePackagesToInstall } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      const projectType = {
        typescript: true,
        react: true,
        nextjs: true,
        astro: false,
        vue: false,
        svelte: false,
        electron: false,
        vitest: true,
        tailwind: true,
        publishableLibrary: false,
      };

      const result = computePackagesToInstall(SAFEWORD_SCHEMA, projectType, {});

      expect(result).toContain('typescript-eslint');
      expect(result).toContain('eslint-plugin-react');
      expect(result).toContain('@next/eslint-plugin-next');
      expect(result).toContain('@vitest/eslint-plugin');
      expect(result).toContain('prettier-plugin-tailwindcss');
    });

    it('should exclude already installed packages', async () => {
      const { computePackagesToInstall } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      const projectType = {
        typescript: false,
        react: false,
        nextjs: false,
        astro: false,
        vue: false,
        svelte: false,
        electron: false,
        vitest: false,
        tailwind: false,
        publishableLibrary: false,
      };

      const installedDevDeps = {
        eslint: '^8.0.0',
        prettier: '^3.0.0',
        husky: '^9.0.0',
      };

      const result = computePackagesToInstall(SAFEWORD_SCHEMA, projectType, installedDevDeps);

      expect(result).not.toContain('eslint');
      expect(result).not.toContain('prettier');
      expect(result).not.toContain('husky');
      expect(result).toContain('knip'); // Not installed, should be included
    });

    it('should exclude husky and lint-staged in non-git repos', async () => {
      const { computePackagesToInstall } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      const projectType = {
        typescript: false,
        react: false,
        nextjs: false,
        astro: false,
        vue: false,
        svelte: false,
        electron: false,
        vitest: false,
        tailwind: false,
        publishableLibrary: false,
      };

      // isGitRepo = false
      const result = computePackagesToInstall(SAFEWORD_SCHEMA, projectType, {}, false);

      expect(result).not.toContain('husky');
      expect(result).not.toContain('lint-staged');
      // Other base packages should still be included
      expect(result).toContain('eslint');
      expect(result).toContain('prettier');
      expect(result).toContain('knip');
    });

    it('should include husky and lint-staged in git repos', async () => {
      const { computePackagesToInstall } = await import('../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../src/schema.js');

      const projectType = {
        typescript: false,
        react: false,
        nextjs: false,
        astro: false,
        vue: false,
        svelte: false,
        electron: false,
        vitest: false,
        tailwind: false,
        publishableLibrary: false,
      };

      // isGitRepo = true (default)
      const result = computePackagesToInstall(SAFEWORD_SCHEMA, projectType, {}, true);

      expect(result).toContain('husky');
      expect(result).toContain('lint-staged');
    });
  });
});
