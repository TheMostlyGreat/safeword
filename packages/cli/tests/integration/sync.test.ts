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

import { afterEach, describe, expect, it } from 'vitest';

import {
  CLI_PATH,
  createPackageJson,
  createTemporaryDirectory,
  createTypeScriptPackageJson,
  fileExists,
  initGitRepo,
  measureTime,
  readTestFile,
  removeTemporaryDirectory,
  runCli,
  writeTestFile,
} from '../helpers';

describe('E2E: Sync Command', () => {
  let projectDirectory: string;

  afterEach(() => {
    if (projectDirectory) {
      removeTemporaryDirectory(projectDirectory);
    }
  });

  it('exits quickly when all plugins installed', async () => {
    projectDirectory = createTemporaryDirectory();
    createTypeScriptPackageJson(projectDirectory);
    initGitRepo(projectDirectory);

    // Setup project (installs all plugins)
    await runCli(['setup', '--yes'], { cwd: projectDirectory });

    // Sync should be fast when nothing to install
    const { timeMs } = await measureTime(async () => {
      await runCli(['sync', '--quiet'], { cwd: projectDirectory });
    });

    // Should complete in under 2 seconds (generous timeout for CI)
    expect(timeMs).toBeLessThan(2000);
  }, 180_000);

  it('installs missing plugin when framework added', async () => {
    projectDirectory = createTemporaryDirectory();
    createTypeScriptPackageJson(projectDirectory);
    initGitRepo(projectDirectory);

    // Setup TypeScript project (no Astro)
    await runCli(['setup', '--yes'], { cwd: projectDirectory });

    // Add Astro to dependencies (simulating user adding framework)
    const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
    pkg.dependencies = { ...pkg.dependencies, astro: '^4.0.0' };
    writeTestFile(projectDirectory, 'package.json', JSON.stringify(pkg, undefined, 2));

    // Sync should detect and install Astro plugin
    await runCli(['sync'], { cwd: projectDirectory });

    // Verify eslint-plugin-astro is now installed
    const updatedPackage = JSON.parse(readTestFile(projectDirectory, 'package.json'));
    expect(updatedPackage.devDependencies).toHaveProperty('eslint-plugin-astro');
  }, 180_000);

  it('Husky pre-commit includes sync with --stage', async () => {
    projectDirectory = createTemporaryDirectory();
    createTypeScriptPackageJson(projectDirectory);
    initGitRepo(projectDirectory);

    await runCli(['setup', '--yes'], { cwd: projectDirectory });

    // Read .husky/pre-commit
    const preCommit = readTestFile(projectDirectory, '.husky/pre-commit');

    // Should contain sync --quiet --stage before lint-staged
    expect(preCommit).toContain('npx safeword sync --quiet --stage');
    expect(preCommit).toContain('npx lint-staged');

    // sync should come before lint-staged
    const syncIndex = preCommit.indexOf('safeword sync');
    const lintStagedIndex = preCommit.indexOf('lint-staged');
    expect(syncIndex).toBeLessThan(lintStagedIndex);
  }, 180_000);

  it('--stage flag stages package.json after plugin install', async () => {
    projectDirectory = createTemporaryDirectory();
    createTypeScriptPackageJson(projectDirectory);
    initGitRepo(projectDirectory);

    // Setup project
    await runCli(['setup', '--yes'], { cwd: projectDirectory });

    // Make initial commit
    execSync('git add -A && git commit -m "initial"', {
      cwd: projectDirectory,
      maxBuffer: 10 * 1024 * 1024,
    });

    // Add Vue to dependencies
    const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
    pkg.dependencies = { ...pkg.dependencies, vue: '^3.0.0' };
    writeTestFile(projectDirectory, 'package.json', JSON.stringify(pkg, undefined, 2));

    // Run sync with --stage
    await runCli(['sync', '--stage'], { cwd: projectDirectory });

    // Check that package.json is staged
    const status = execSync('git status --porcelain', { cwd: projectDirectory, encoding: 'utf8' });
    // 'M' means staged, ' M' means unstaged
    expect(status).toMatch(/^M\s+package\.json/m);
  }, 180_000);

  it('errors when run outside safeword project', async () => {
    projectDirectory = createTemporaryDirectory();
    createPackageJson(projectDirectory);
    // Note: NOT running setup, so no .safeword directory

    const result = await runCli(['sync'], { cwd: projectDirectory });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('safeword setup');
  }, 30_000);

  it('dynamic ESLint config reads package.json at runtime', async () => {
    projectDirectory = createTemporaryDirectory();
    createTypeScriptPackageJson(projectDirectory);
    initGitRepo(projectDirectory);

    // Setup project
    await runCli(['setup', '--yes'], { cwd: projectDirectory });

    // Verify ESLint config is dynamic (contains readFileSync)
    const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
    expect(eslintConfig).toContain('readFileSync');
    expect(eslintConfig).toContain('package.json');
    expect(eslintConfig).toContain('await import');

    // Add Vitest to dependencies
    const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
    pkg.devDependencies = { ...pkg.devDependencies, vitest: '^1.0.0' };
    writeTestFile(projectDirectory, 'package.json', JSON.stringify(pkg, undefined, 2));

    // Run sync to install vitest plugin
    await runCli(['sync'], { cwd: projectDirectory });

    // Verify vitest plugin is installed
    const updatedPackage = JSON.parse(readTestFile(projectDirectory, 'package.json'));
    expect(updatedPackage.devDependencies).toHaveProperty('@vitest/eslint-plugin');
  }, 180_000);

  it('sync detects multiple frameworks and installs all plugins', async () => {
    projectDirectory = createTemporaryDirectory();
    createTypeScriptPackageJson(projectDirectory);
    initGitRepo(projectDirectory);

    // Setup project (TypeScript only)
    await runCli(['setup', '--yes'], { cwd: projectDirectory });

    // Add multiple frameworks at once
    const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
    pkg.devDependencies = {
      ...pkg.devDependencies,
      svelte: '^4.0.0',
      vitest: '^1.0.0',
    };
    writeTestFile(projectDirectory, 'package.json', JSON.stringify(pkg, undefined, 2));

    // Run sync to install missing plugins
    await runCli(['sync'], { cwd: projectDirectory });

    // Verify both plugins were installed
    const finalPackage = JSON.parse(readTestFile(projectDirectory, 'package.json'));
    expect(finalPackage.devDependencies).toHaveProperty('eslint-plugin-svelte');
    expect(finalPackage.devDependencies).toHaveProperty('@vitest/eslint-plugin');
  }, 300_000); // Increased timeout - npm installs can be slow
});
