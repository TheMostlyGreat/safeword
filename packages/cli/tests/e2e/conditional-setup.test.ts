/**
 * E2E Test: Conditional Setup Logic
 *
 * Verifies that safeword setup adapts to different project types:
 * - TypeScript vs JavaScript projects
 * - React/Next.js/Astro/Vue/Svelte detection
 * - Existing config preservation (doesn't overwrite)
 * - Git vs non-git projects
 * - Publishable library detection
 *
 * Each test creates a fresh project to test specific conditions.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import {
  createTempDir,
  removeTempDir,
  createPackageJson,
  createTypeScriptPackageJson,
  createReactPackageJson,
  createNextJsPackageJson,
  initGitRepo,
  runCli,
  readTestFile,
  writeTestFile,
  fileExists,
} from '../helpers';

describe('E2E: Conditional Setup - Project Type Detection', () => {
  let projectDir: string;

  afterEach(() => {
    if (projectDir) {
      removeTempDir(projectDir);
    }
  });

  it('detects TypeScript project and includes typescript-eslint', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Check ESLint config includes TypeScript
    const eslintConfig = readTestFile(projectDir, 'eslint.config.mjs');
    expect(eslintConfig).toContain('typescript-eslint');
    expect(eslintConfig).toContain('tseslint');

    // Check package.json has typescript-eslint installed
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(pkg.devDependencies).toHaveProperty('typescript-eslint');
  }, 180000);

  it('detects JavaScript-only project (no TypeScript plugins installed)', async () => {
    projectDir = createTempDir();
    createPackageJson(projectDir); // No TypeScript
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // ESLint config is dynamic - contains conditional code but doesn't execute it for JS projects
    const eslintConfig = readTestFile(projectDir, 'eslint.config.mjs');
    expect(eslintConfig).toContain('readFileSync'); // Dynamic config
    expect(eslintConfig).toContain('deps["typescript"]'); // Contains conditional

    // Key check: typescript-eslint package is NOT installed in devDependencies
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(pkg.devDependencies).not.toHaveProperty('typescript-eslint');
  }, 180000);

  it('detects React project and includes React plugins', async () => {
    projectDir = createTempDir();
    createReactPackageJson(projectDir, {
      devDependencies: { typescript: '^5.0.0' },
    });
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Check ESLint config includes React
    const eslintConfig = readTestFile(projectDir, 'eslint.config.mjs');
    expect(eslintConfig).toContain('eslint-plugin-react');
    expect(eslintConfig).toContain('react-hooks');
    expect(eslintConfig).toContain('jsx-a11y');

    // Check package.json has React plugins installed
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(pkg.devDependencies).toHaveProperty('eslint-plugin-react');
    expect(pkg.devDependencies).toHaveProperty('eslint-plugin-react-hooks');
    expect(pkg.devDependencies).toHaveProperty('eslint-plugin-jsx-a11y');
  }, 180000);

  it('detects Next.js project and includes Next.js plugin', async () => {
    projectDir = createTempDir();
    createNextJsPackageJson(projectDir, {
      devDependencies: { typescript: '^5.0.0' },
    });
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Check ESLint config includes Next.js
    const eslintConfig = readTestFile(projectDir, 'eslint.config.mjs');
    expect(eslintConfig).toContain('@next/eslint-plugin-next');
    expect(eslintConfig).toContain('nextPlugin');
    // Next.js also implies React
    expect(eslintConfig).toContain('eslint-plugin-react');

    // Check ignores include .next/
    expect(eslintConfig).toContain('.next/');

    // Check package.json has Next.js plugin installed
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(pkg.devDependencies).toHaveProperty('@next/eslint-plugin-next');
  }, 180000);

  it('detects Astro project and includes Astro plugin', async () => {
    projectDir = createTempDir();
    createPackageJson(projectDir, {
      dependencies: { astro: '^4.0.0' },
      devDependencies: { typescript: '^5.0.0' },
    });
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Check ESLint config includes Astro
    const eslintConfig = readTestFile(projectDir, 'eslint.config.mjs');
    expect(eslintConfig).toContain('eslint-plugin-astro');

    // Check ignores include .astro/
    expect(eslintConfig).toContain('.astro/');

    // Check package.json has Astro plugin installed
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(pkg.devDependencies).toHaveProperty('eslint-plugin-astro');
  }, 180000);

  it('detects Vue project and includes Vue plugin', async () => {
    projectDir = createTempDir();
    createPackageJson(projectDir, {
      dependencies: { vue: '^3.0.0' },
      devDependencies: { typescript: '^5.0.0' },
    });
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Check ESLint config includes Vue
    const eslintConfig = readTestFile(projectDir, 'eslint.config.mjs');
    expect(eslintConfig).toContain('eslint-plugin-vue');

    // Check ignores include .nuxt/
    expect(eslintConfig).toContain('.nuxt/');

    // Check package.json has Vue plugin installed
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(pkg.devDependencies).toHaveProperty('eslint-plugin-vue');
  }, 180000);

  it('detects Svelte project and includes Svelte plugin', async () => {
    projectDir = createTempDir();
    createPackageJson(projectDir, {
      devDependencies: {
        svelte: '^4.0.0',
        typescript: '^5.0.0',
      },
    });
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Check ESLint config includes Svelte
    const eslintConfig = readTestFile(projectDir, 'eslint.config.mjs');
    expect(eslintConfig).toContain('eslint-plugin-svelte');

    // Check ignores include .svelte-kit/
    expect(eslintConfig).toContain('.svelte-kit/');

    // Check package.json has Svelte plugin installed
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(pkg.devDependencies).toHaveProperty('eslint-plugin-svelte');
  }, 180000);

  it('detects Vitest project and includes Vitest plugin', async () => {
    projectDir = createTempDir();
    createPackageJson(projectDir, {
      devDependencies: {
        vitest: '^1.0.0',
        typescript: '^5.0.0',
      },
    });
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Check ESLint config includes Vitest
    const eslintConfig = readTestFile(projectDir, 'eslint.config.mjs');
    expect(eslintConfig).toContain('@vitest/eslint-plugin');

    // Check package.json has Vitest plugin installed
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(pkg.devDependencies).toHaveProperty('@vitest/eslint-plugin');
  }, 180000);

  it('detects Tailwind and includes Prettier plugin', async () => {
    projectDir = createTempDir();
    createPackageJson(projectDir, {
      devDependencies: {
        tailwindcss: '^3.0.0',
        typescript: '^5.0.0',
      },
    });
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Check package.json has Tailwind Prettier plugin installed
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(pkg.devDependencies).toHaveProperty('prettier-plugin-tailwindcss');
  }, 180000);

  it('detects publishable library and includes publint', async () => {
    projectDir = createTempDir();
    createPackageJson(projectDir, {
      // Publishable: has main/exports, not private
      main: './dist/index.js',
      exports: {
        '.': './dist/index.js',
      },
      devDependencies: { typescript: '^5.0.0' },
    });
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Check package.json has publint installed
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(pkg.devDependencies).toHaveProperty('publint');
    expect(pkg.scripts).toHaveProperty('publint');
  }, 180000);
});

describe('E2E: Conditional Setup - Existing Config Preservation', () => {
  let projectDir: string;

  afterEach(() => {
    if (projectDir) {
      removeTempDir(projectDir);
    }
  });

  it('preserves existing ESLint config (does not overwrite)', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    // Create existing ESLint config
    const existingConfig = '// My custom ESLint config\nexport default [];\n';
    writeTestFile(projectDir, 'eslint.config.mjs', existingConfig);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Existing config should be preserved
    const eslintConfig = readTestFile(projectDir, 'eslint.config.mjs');
    expect(eslintConfig).toBe(existingConfig);
  }, 180000);

  it('preserves existing Prettier config (does not overwrite)', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    // Create existing Prettier config
    const existingConfig = '{ "semi": false, "singleQuote": true }';
    writeTestFile(projectDir, '.prettierrc', existingConfig);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Existing config should be preserved
    const prettierConfig = readTestFile(projectDir, '.prettierrc');
    expect(prettierConfig).toBe(existingConfig);
  }, 180000);

  it('preserves existing lint scripts in package.json', async () => {
    projectDir = createTempDir();
    createPackageJson(projectDir, {
      scripts: {
        lint: 'custom-lint-command',
        format: 'custom-format-command',
      },
      devDependencies: { typescript: '^5.0.0' },
    });
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Custom scripts should be preserved
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(pkg.scripts.lint).toBe('custom-lint-command');
    expect(pkg.scripts.format).toBe('custom-format-command');
  }, 180000);

  it('merges hooks with existing non-safeword hooks', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    // Create existing Claude settings with custom hooks
    writeTestFile(
      projectDir,
      '.claude/settings.json',
      JSON.stringify(
        {
          hooks: {
            SessionStart: [
              {
                hooks: [
                  {
                    type: 'command',
                    command: 'echo "My custom hook"',
                  },
                ],
              },
            ],
          },
        },
        null,
        2,
      ),
    );

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Both custom and safeword hooks should exist
    const settings = JSON.parse(readTestFile(projectDir, '.claude/settings.json'));
    const sessionStartHooks = settings.hooks.SessionStart;

    // Should have at least 4 hooks (1 custom + 3 safeword)
    expect(sessionStartHooks.length).toBeGreaterThanOrEqual(4);

    // Custom hook should be first (preserved)
    expect(sessionStartHooks[0].hooks[0].command).toBe('echo "My custom hook"');

    // Safeword hooks should be present
    const commands = sessionStartHooks.map(
      (h: { hooks: { command: string }[] }) => h.hooks[0].command,
    );
    expect(commands).toContain('"$CLAUDE_PROJECT_DIR"/.safeword/hooks/session-verify-agents.sh');
    expect(commands).toContain('"$CLAUDE_PROJECT_DIR"/.safeword/hooks/session-version.sh');
  }, 180000);
});

describe('E2E: Conditional Setup - Git Integration', () => {
  let projectDir: string;

  afterEach(() => {
    if (projectDir) {
      removeTempDir(projectDir);
    }
  });

  it('creates Husky pre-commit hook in git repo', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Husky should be configured
    expect(fileExists(projectDir, '.husky/pre-commit')).toBe(true);

    const preCommit = readTestFile(projectDir, '.husky/pre-commit');
    expect(preCommit).toContain('lint-staged');
  }, 180000);

  it('skips Husky setup in non-git directory', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    // Note: NOT calling initGitRepo

    const result = await runCli(['setup', '--yes'], { cwd: projectDir });

    // Setup should complete successfully
    expect(result.exitCode).toBe(0);

    // Husky directory should not exist (no git = no husky)
    expect(fileExists(projectDir, '.husky')).toBe(false);

    // Should NOT have Husky pre-commit hook
    expect(fileExists(projectDir, '.husky/pre-commit')).toBe(false);

    // husky and lint-staged should NOT be installed in non-git projects
    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(pkg.devDependencies?.husky).toBeUndefined();
    expect(pkg.devDependencies?.['lint-staged']).toBeUndefined();
    // But other base packages should be installed
    expect(pkg.devDependencies?.eslint).toBeDefined();
  }, 180000);

  it('pre-commit hook runs lint-staged successfully', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Create a valid file, stage it, and commit
    writeTestFile(projectDir, 'src/valid.ts', 'export const valid = 1;\n');
    execSync('git add src/valid.ts', { cwd: projectDir });

    // Commit should succeed (lint-staged passes)
    execSync('git commit -m "test commit"', { cwd: projectDir, encoding: 'utf-8' });

    const log = execSync('git log --oneline -1', { cwd: projectDir, encoding: 'utf-8' });
    expect(log).toContain('test commit');
  }, 180000);
});

describe('E2E: Conditional Setup - Package.json Creation', () => {
  let projectDir: string;

  afterEach(() => {
    if (projectDir) {
      removeTempDir(projectDir);
    }
  });

  it('creates package.json if missing', async () => {
    projectDir = createTempDir();
    // Note: NOT creating package.json
    initGitRepo(projectDir);

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // package.json should be created
    expect(fileExists(projectDir, 'package.json')).toBe(true);

    const pkg = JSON.parse(readTestFile(projectDir, 'package.json'));
    expect(pkg).toHaveProperty('name');
    expect(pkg).toHaveProperty('version');
  }, 180000);
});

describe('E2E: Conditional Setup - Architecture Boundaries', () => {
  let projectDir: string;

  afterEach(() => {
    if (projectDir) {
      removeTempDir(projectDir);
    }
  });

  it('detects architecture directories and generates boundaries config', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    // Create architecture directories
    writeTestFile(projectDir, 'src/types/index.ts', 'export type User = { id: string };\n');
    writeTestFile(projectDir, 'src/utils/helpers.ts', 'export const helper = () => {};\n');
    writeTestFile(projectDir, 'src/services/api.ts', 'export const api = {};\n');
    writeTestFile(projectDir, 'src/components/Button.tsx', 'export const Button = () => null;\n');

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Boundaries config should be created
    expect(fileExists(projectDir, '.safeword/eslint-boundaries.config.mjs')).toBe(true);

    const boundariesConfig = readTestFile(projectDir, '.safeword/eslint-boundaries.config.mjs');
    // Should detect the architecture directories
    expect(boundariesConfig).toContain('types');
    expect(boundariesConfig).toContain('utils');
    expect(boundariesConfig).toContain('services');
    expect(boundariesConfig).toContain('components');
  }, 180000);

  it('handles projects without architecture directories', async () => {
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);

    // No architecture directories - just a flat structure

    await runCli(['setup', '--yes'], { cwd: projectDir });

    // Boundaries config should still be created (ready for when dirs are added)
    expect(fileExists(projectDir, '.safeword/eslint-boundaries.config.mjs')).toBe(true);
  }, 180000);
});
