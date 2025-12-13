/**
 * E2E Test: Conditional Setup Logic
 *
 * Verifies that safeword setup adapts to different project types:
 * - TypeScript vs JavaScript projects
 * - React/Next.js/Astro detection
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
    'detects TypeScript project and uses safeword recommendedTypeScript config',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createTypeScriptPackageJson(projectDirectory);
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Check ESLint config uses safeword plugin with TypeScript config
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('eslint-plugin-safeword');
      expect(eslintConfig).toContain('safeword.configs.recommendedTypeScript');

      // Check package.json has eslint-plugin-safeword (bundles typescript-eslint)
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-safeword');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects JavaScript-only project and uses safeword recommended config',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createPackageJson(projectDirectory); // No TypeScript
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // ESLint config is dynamic - uses safeword.configs.recommended for JS
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('eslint-plugin-safeword');
      expect(eslintConfig).toContain('safeword.configs.recommended'); // JS config

      // eslint-plugin-safeword is installed (bundles everything)
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-safeword');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects React project and uses safeword recommendedTypeScriptReact config',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createReactPackageJson(projectDirectory, {
        devDependencies: { typescript: '^5.0.0' },
      });
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Check ESLint config uses safeword plugin with React config
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('eslint-plugin-safeword');
      expect(eslintConfig).toContain('safeword.configs.recommendedTypeScriptReact');

      // Check package.json has eslint-plugin-safeword (bundles React plugins)
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-safeword');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects Next.js project and uses safeword recommendedTypeScriptNext config',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createNextJsPackageJson(projectDirectory, {
        devDependencies: { typescript: '^5.0.0' },
      });
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Check ESLint config uses safeword plugin with Next.js config
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('eslint-plugin-safeword');
      expect(eslintConfig).toContain('safeword.configs.recommendedTypeScriptNext');

      // Check ignores include .next/
      expect(eslintConfig).toContain('.next/');

      // Check package.json has eslint-plugin-safeword (bundles Next.js plugin)
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-safeword');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects Astro project and uses safeword astro config',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createPackageJson(projectDirectory, {
        dependencies: { astro: '^4.0.0' },
        devDependencies: { typescript: '^5.0.0' },
      });
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Check ESLint config uses safeword plugin with Astro config
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('eslint-plugin-safeword');
      expect(eslintConfig).toContain('safeword.configs.astro');

      // Check ignores include .astro/
      expect(eslintConfig).toContain('.astro/');

      // Check package.json has eslint-plugin-safeword (bundles Astro plugin)
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-safeword');
    },
    SETUP_TIMEOUT,
  );

  it(
    'detects Vitest project and uses safeword vitest config',
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

      // Check ESLint config uses safeword plugin with vitest config
      const eslintConfig = readTestFile(projectDirectory, 'eslint.config.mjs');
      expect(eslintConfig).toContain('eslint-plugin-safeword');
      expect(eslintConfig).toContain('safeword.configs.vitest');

      // Check package.json has eslint-plugin-safeword (bundles Vitest plugin)
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-safeword');
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

  // Note: Husky/lint-staged are no longer managed by safeword (v0.9.0+)
  // Users set up their own pre-commit hooks if desired
  it(
    'does not install husky or lint-staged (removed in v0.9.0)',
    async () => {
      projectDirectory = createTemporaryDirectory();
      createTypeScriptPackageJson(projectDirectory);
      initGitRepo(projectDirectory);

      await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: SETUP_TIMEOUT });

      // Husky should NOT be configured by safeword
      expect(fileExists(projectDirectory, '.husky')).toBe(false);

      // husky and lint-staged should NOT be installed
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies?.husky).toBeUndefined();
      expect(pkg.devDependencies?.['lint-staged']).toBeUndefined();

      // But eslint-plugin-safeword should be installed
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-safeword');
    },
    SETUP_TIMEOUT,
  );

  it(
    'works in non-git directory',
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

      // Base packages should be installed
      const pkg = JSON.parse(readTestFile(projectDirectory, 'package.json'));
      expect(pkg.devDependencies?.eslint).toBeDefined();
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-safeword');
    },
    SETUP_TIMEOUT,
  );

  // Note: pre-commit hooks are no longer managed by safeword (v0.9.0+)
  // Users can set up their own husky + lint-staged if desired
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
