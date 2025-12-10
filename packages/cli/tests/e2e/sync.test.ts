/**
 * E2E Test: Sync Command
 *
 * Verifies that the sync command correctly:
 * - Detects missing ESLint plugins for frameworks
 * - Installs missing plugins
 * - Stages modified files with --stage flag
 * - Fast exits when nothing to install
 * - Works with Husky pre-commit integration
 */

import { execSync } from 'node:child_process';

import { afterEach,describe, expect, it } from 'vitest';

import {
  CLI_PATH,
  createPackageJson,
  createTempDir,
  createTypeScriptPackageJson,
  fileExists,
  initGitRepo,
  measureTime,
  readTestFile,
  removeTempDir,
  runCli,
  writeTestFile,
} from '../helpers';

describe('E2E: Sync Command', () => {
  let projectDir: string;

  afterEach(() => {
    if (projectDir) {
      removeTempDir(projectDir);
    }
  });

  it('exits quickly when all plugins installed', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    // Setup project (installs all plugins)
    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Sync should be fast when nothing to install
    const { timeMs } = await measureTime(async () => {
      await runCli(['sync', '--quiet'], { cwd: projectDir });
    });

    // Should complete in under 2 seconds (generous timeout for CI)
    expect(timeMs).toBeLessThan(2000);
  }, 180000);

  it('installs missing plugin when framework added', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    // Setup TypeScript project (no Astro)
    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Add Astro to dependencies (simulating user adding framework)
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    pkg.dependencies = { ...pkg.dependencies, astro: '^4.0.0' };
    writeTestFile(projectDir, 'package.json', JSON.stringify(pkg, null, 2));

    // Sync should detect and install Astro plugin
    await runCli(['sync'], { cwd: projectDir });

    // Verify eslint-plugin-astro is now installed
    const updatedPkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(updatedPkg.devDependencies).toHaveProperty('eslint-plugin-astro');
  }, 180000);

  it('Husky pre-commit includes sync with --stage', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Read .husky/pre-commit
    const preCommit = readTestFile(projectDir, '.husky/pre-commit');

    // Should contain sync --quiet --stage before lint-staged
    expect(preCommit).toContain('npx safeword sync --quiet --stage');
    expect(preCommit).toContain('npx lint-staged');

    // sync should come before lint-staged
    const syncIndex = preCommit.indexOf('safeword sync');
    const lintStagedIndex = preCommit.indexOf('lint-staged');
    expect(syncIndex).toBeLessThan(lintStagedIndex);
  }, 180000);

  it('--stage flag stages package.json after plugin install', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    // Setup project
    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Make initial commit
    execSync('git add -A && git commit -m "initial"', {
      cwd: projectDir,
      maxBuffer: 10 * 1024 * 1024,
    });

    // Add Vue to dependencies
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    pkg.dependencies = { ...pkg.dependencies, vue: '^3.0.0' };
    writeTestFile(projectDir, 'package.json', JSON.stringify(pkg, null, 2));

    // Run sync with --stage
    await runCli(['sync', '--stage'], { cwd: projectDir });

    // Check that package.json is staged
    const status = execSync('git status --porcelain', { cwd: projectDir, encoding: 'utf-8' });
    // 'M' means staged, ' M' means unstaged
    expect(status).toMatch(/^M\s+package\.json/m);
  }, 180000);

  it('errors when run outside safeword project', async () => {
    projectDir = createTempDir();
    createPackageJson(projectDir);
    // Note: NOT running setup, so no .safeword directory

    const result = await runCli(['sync'], { cwd: projectDir });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('safeword setup');
  }, 30000);

  it('dynamic ESLint config reads package.json at runtime', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    // Setup project
    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Verify ESLint config is dynamic (contains readFileSync)
    const eslintConfig = readTestFile(projectDir, 'eslint.config.mjs');
    expect(eslintConfig).toContain('readFileSync');
    expect(eslintConfig).toContain('package.json');
    expect(eslintConfig).toContain('await import');

    // Add Vitest to dependencies
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    pkg.devDependencies = { ...pkg.devDependencies, vitest: '^1.0.0' };
    writeTestFile(projectDir, 'package.json', JSON.stringify(pkg, null, 2));

    // Run sync to install vitest plugin
    await runCli(['sync'], { cwd: projectDir });

    // Verify vitest plugin is installed
    const updatedPkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(updatedPkg.devDependencies).toHaveProperty('@vitest/eslint-plugin');
  }, 180000);

  it('sync detects multiple frameworks and installs all plugins', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    // Setup project (TypeScript only)
    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Add multiple frameworks at once
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    pkg.devDependencies = {
      ...pkg.devDependencies,
      svelte: '^4.0.0',
      vitest: '^1.0.0',
    };
    writeTestFile(projectDir, 'package.json', JSON.stringify(pkg, null, 2));

    // Run sync to install missing plugins
    await runCli(['sync'], { cwd: projectDir });

    // Verify both plugins were installed
    const finalPkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(finalPkg.devDependencies).toHaveProperty('eslint-plugin-svelte');
    expect(finalPkg.devDependencies).toHaveProperty('@vitest/eslint-plugin');
  }, 300000); // Increased timeout - npm installs can be slow
});
