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

import { execSync } from 'node:child_process';

import { afterEach, describe, expect, it } from 'vitest';

import {
  createNextJsPackageJson,
  createPackageJson,
  createReactPackageJson,
  createTemporaryDirectory,
  createTypeScriptPackageJson,
  fileExists,
  initGitRepo,
  readTestFile,
  removeTemporaryDirectory,
  runCli,
  writeTestFile,
} from '../helpers';

/** Setup timeout: 10 minutes - npm install can take 7+ minutes */
const SETUP_TIMEOUT = 600_000;

describe('E2E: Conditional Setup - Project Type Detection', () => {
  let projectDirectory: string;

  afterEach(() => {
    if (projectDirectory) {
      removeTemporaryDirectory(projectDirectory);
    }
  });

  it(
    'detects TypeScript project and includes typescript-eslint',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createTypeScriptPackageJson(projectDirectory);
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Check ESLint config includes TypeScript
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('typescript-eslint');
      expect(eslintConfig).toContain('tseslint');

      // Check package.json has typescript-eslint installed
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('typescript-eslint');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects JavaScript-only project (no TypeScript plugins installed)',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createPackageJson(projectDirectory); // No TypeScript
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // ESLint config is dynamic - contains conditional code but doesn't execute it for JS projects
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('readFileSync'); // Dynamic config
      expect(eslintConfig).toContain('deps["typescript"]'); // Contains conditional

      // Key check: typescript-eslint package is NOT installed in devDependencies
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).not.toHaveProperty('typescript-eslint');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects React project and includes React plugins',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createReactPackageJson(projectDirectory, {
        devDependencies: { typescript: '^5.0.0' },
      });
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Check ESLint config includes React
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('eslint-plugin-react');
      expect(eslintConfig).toContain('react-hooks');
      expect(eslintConfig).toContain('jsx-a11y');

      // Check package.json has React plugins installed
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-react');
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-react-hooks');
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-jsx-a11y');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects Next.js project and includes Next.js plugin',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createNextJsPackageJson(projectDirectory, {
        devDependencies: { typescript: '^5.0.0' },
      });
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Check ESLint config includes Next.js
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('@next/eslint-plugin-next');
      expect(eslintConfig).toContain('nextPlugin');
      // Next.js also implies React
      expect(eslintConfig).toContain('eslint-plugin-react');

      // Check ignores include .next/
      expect(eslintConfig).toContain('.next/');

      // Check package.json has Next.js plugin installed
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('@next/eslint-plugin-next');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects Astro project and includes Astro plugin',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createPackageJson(projectDirectory, {
        dependencies: { astro: '^4.0.0' },
        devDependencies: { typescript: '^5.0.0' },
      });
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Check ESLint config includes Astro
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('eslint-plugin-astro');

      // Check ignores include .astro/
      expect(eslintConfig).toContain('.astro/');

      // Check package.json has Astro plugin installed
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-astro');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects Vue project and includes Vue plugin',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createPackageJson(projectDirectory, {
        dependencies: { vue: '^3.0.0' },
        devDependencies: { typescript: '^5.0.0' },
      });
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Check ESLint config includes Vue
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('eslint-plugin-vue');

      // Check ignores include .nuxt/
      expect(eslintConfig).toContain('.nuxt/');

      // Check package.json has Vue plugin installed
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-vue');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects Svelte project and includes Svelte plugin',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createPackageJson(projectDirectory, {
        devDependencies: {
          svelte: '^4.0.0',
          typescript: '^5.0.0',
        },
      });
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Check ESLint config includes Svelte
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('eslint-plugin-svelte');

      // Check ignores include .svelte-kit/
      expect(eslintConfig).toContain('.svelte-kit/');

      // Check package.json has Svelte plugin installed
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-svelte');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects Vitest project and includes Vitest plugin',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createPackageJson(projectDirectory, {
        devDependencies: {
          vitest: '^1.0.0',
          typescript: '^5.0.0',
        },
      });
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Check ESLint config includes Vitest
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('@vitest/eslint-plugin');

      // Check package.json has Vitest plugin installed
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('@vitest/eslint-plugin');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects Tailwind and includes Prettier plugin',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createPackageJson(projectDirectory, {
        devDependencies: {
          tailwindcss: '^3.0.0',
          typescript: '^5.0.0',
        },
      });
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Check package.json has Tailwind Prettier plugin installed
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('prettier-plugin-tailwindcss');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects publishable library and includes publint',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createPackageJson(projectDirectory, {
        // Publishable: has main/exports, not private
        main: './dist/index.js',
        exports: {
          '.': './dist/index.js',
        },
        devDependencies: { typescript: '^5.0.0' },
      });
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Check package.json has publint installed
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('publint');
      expect(pkg.scripts).toHaveProperty('publint');
    },
    SETUP_TIMEOUT,
  );
});

describe('E2E: Conditional Setup - Existing Config Preservation', () => {
  let projectDirectory: string;

  afterEach(() => {
    if (projectDirectory) {
      removeTemporaryDirectory(projectDirectory);
    }
  });

  it(
    'preserves existing ESLint config (does not overwrite)',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createTypeScriptPackageJson(projectDirectory);
      initGitRepo(projectDirectory);

      // Create existing ESLint config
      const existingConfig = '// My custom ESLint config\nexport default [];\n';
      writeTestFile(projectDirectory, 'eslint.config.mjs', existingConfig);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Existing config should be preserved
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toBe(existingConfig);
    },
    SETUP_TIMEOUT,
  );

  it(
    'preserves existing Prettier config (does not overwrite)',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createTypeScriptPackageJson(projectDirectory);
      initGitRepo(projectDirectory);

      // Create existing Prettier config
      const existingConfig = '{ "semi": false, "singleQuote": true }';
      writeTestFile(projectDirectory, '.prettierrc', existingConfig);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Existing config should be preserved
      const prettierConfig = readTestFile(projectDirectory, '.prettierrc');
      expect(prettierConfig).toBe(existingConfig);
    },
    SETUP_TIMEOUT,
  );

  it(
    'preserves existing lint scripts in package.json',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createPackageJson(projectDirectory, {
        scripts: {
          lint: 'custom-lint-command',
          format: 'custom-format-command',
        },
        devDependencies: { typescript: '^5.0.0' },
      });
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Custom scripts should be preserved
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.scripts.lint).toBe('custom-lint-command');
      expect(pkg.scripts.format).toBe('custom-format-command');
    },
    SETUP_TIMEOUT,
  );

  it(
    'merges hooks with existing non-safeword hooks',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createTypeScriptPackageJson(projectDirectory);
      initGitRepo(projectDirectory);

      // Create existing Claude settings with custom hooks
      writeTestFile(
        projectDirectory,
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
          undefined,
          2,
        ),
      );

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Both custom and safeword hooks should exist
      const settings = JSON.parse(readTestFile(projectDirectory, '.claude/settings.json'));
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
    },
    SETUP_TIMEOUT,
  );
});

describe('E2E: Conditional Setup - Git Integration', () => {
  let projectDirectory: string;

  afterEach(() => {
    if (projectDirectory) {
      removeTemporaryDirectory(projectDirectory);
    }
  });

  it(
    'creates Husky pre-commit hook in git repo',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createTypeScriptPackageJson(projectDirectory);
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Husky should be configured
      expect(fileExists(projectDirectory, '.husky/pre-commit')).toBe(true);

      const preCommit = readTestFile(projectDirectory, '.husky/pre-commit');
      expect(preCommit).toContain('lint-staged');
    },
    SETUP_TIMEOUT,
  );

  it(
    'skips Husky setup in non-git directory',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createTypeScriptPackageJson(projectDirectory);
      // Note: NOT calling initGitRepo

      const result = await runCli(['setup', '--yes'], {
        cwd: projectDirectory,
        timeout: SETUP_TIMEOUT,
      });

      // Setup should complete successfully
      expect(result.exitCode).toBe(0);

      // Husky directory should not exist (no git = no husky)
      expect(fileExists(projectDirectory, '.husky')).toBe(false);

      // Should NOT have Husky pre-commit hook
      expect(fileExists(projectDirectory, '.husky/pre-commit')).toBe(false);

      // husky and lint-staged should NOT be installed in non-git projects
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies?.husky).toBeUndefined();
      expect(pkg.devDependencies?.['lint-staged']).toBeUndefined();
      // But other base packages should be installed
      expect(pkg.devDependencies?.eslint).toBeDefined();
    },
    SETUP_TIMEOUT,
  );

  it(
    'pre-commit hook runs lint-staged successfully',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createTypeScriptPackageJson(projectDirectory);
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Create a valid file, stage it, and commit
      writeTestFile(projectDirectory, 'src/valid.ts', 'export const valid = 1;\n');

      execSync('git add src/valid.ts', { cwd: projectDirectory });

      // Commit should succeed (lint-staged passes)

      execSync('git commit -m "test commit"', { cwd: projectDirectory, encoding: 'utf8' });

      const log = execSync('git log --oneline -1', { cwd: projectDirectory, encoding: 'utf8' });
      expect(log).toContain('test commit');
    },
    SETUP_TIMEOUT,
  );
});

describe('E2E: Conditional Setup - Package.json Creation', () => {
  let projectDirectory: string;

  afterEach(() => {
    if (projectDirectory) {
      removeTemporaryDirectory(projectDirectory);
    }
  });

  it(
    'creates package.json if missing',
    async () => {
      projectDirectory = createTemporaryDirectory();
      // Note: NOT creating package.json
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // package.json should be created
      expect(fileExists(projectDirectory, 'package.json')).toBe(true);

      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg).toHaveProperty('name');
      expect(pkg).toHaveProperty('version');
    },
    SETUP_TIMEOUT,
  );
});

// Note: Architecture boundaries are now project-specific (not generated by CLI).
// Users who want boundaries should configure them in their own eslint.config.mjs.
