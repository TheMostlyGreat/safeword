/**
 * E2E Test: Sync Command
 *
 * Verifies that the sync command correctly:
 * - Detects missing ESLint plugins for frameworks NOT bundled in safeword (Vue, Svelte, Electron)
 * - Installs missing plugins
 * - Stages modified files with --stage flag
 * - Fast exits when nothing to install
 *
 * Note: Most ESLint plugins are now bundled in eslint-plugin-safeword (v0.9.0+)
 * Only Vue, Svelte, and Electron still need separate plugin installation.
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

  it('installs missing plugin when framework added (Vue - not bundled)', async () => {
    projectDirectory = createTemporaryDirectory();
    createTypeScriptPackageJson(projectDirectory);
    initGitRepo(projectDirectory);

    // Setup TypeScript project (no Vue)
    await runCli(['setup', '--yes'], { cwd: projectDirectory });

    // Add Vue to dependencies (Vue is NOT bundled in safeword, so sync installs plugin)
    const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
    pkg.dependencies = { ...pkg.dependencies, vue: '^3.0.0' };
    writeTestFile(projectDirectory, 'package.json', JSON.stringify(pkg, undefined, 2));

    // Sync should detect and install Vue plugin
    await runCli(['sync'], { cwd: projectDirectory });

    // Verify eslint-plugin-vue is now installed (Vue is separate, not bundled)
    const updatedPackage = JSON.parse(readTestFile(projectDirectory, 'package.json'));
    expect(updatedPackage.devDependencies).toHaveProperty('eslint-plugin-vue');
  }, 180_000);

  // Note: Husky pre-commit is no longer managed by safeword (v0.9.0+)
  // Users set up their own pre-commit hooks if desired

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
    expect(eslintConfig).toContain('await import'); // For Vue/Svelte dynamic imports

    // Add Svelte to dependencies (Svelte is NOT bundled, so it uses dynamic import)
    const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
    pkg.devDependencies = { ...pkg.devDependencies, svelte: '^4.0.0' };
    writeTestFile(projectDirectory, 'package.json', JSON.stringify(pkg, undefined, 2));

    // Run sync to install svelte plugin
    await runCli(['sync'], { cwd: projectDirectory });

    // Verify svelte plugin is installed (Svelte is separate, not bundled)
    const updatedPackage = JSON.parse(readTestFile(projectDirectory, 'package.json'));
    expect(updatedPackage.devDependencies).toHaveProperty('eslint-plugin-svelte');
  }, 180_000);

  it('sync detects multiple unbundled frameworks and installs all plugins', async () => {
    projectDirectory = createTemporaryDirectory();
    createTypeScriptPackageJson(projectDirectory);
    initGitRepo(projectDirectory);

    // Setup project (TypeScript only)
    await runCli(['setup', '--yes'], { cwd: projectDirectory });

    // Add multiple unbundled frameworks at once (Vue and Svelte are NOT bundled)
    const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
    pkg.dependencies = {
      ...pkg.dependencies,
      vue: '^3.0.0',
    };
    pkg.devDependencies = {
      ...pkg.devDependencies,
      svelte: '^4.0.0',
    };
    writeTestFile(projectDirectory, 'package.json', JSON.stringify(pkg, undefined, 2));

    // Run sync to install missing plugins
    await runCli(['sync'], { cwd: projectDirectory });

    // Verify both unbundled plugins were installed
    const finalPackage = JSON.parse(readTestFile(projectDirectory, 'package.json'));
    expect(finalPackage.devDependencies).toHaveProperty('eslint-plugin-vue');
    expect(finalPackage.devDependencies).toHaveProperty('eslint-plugin-svelte');
  }, 300_000); // Increased timeout - npm installs can be slow
});
