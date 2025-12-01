/**
 * Setup command - Initialize safeword in a project
 */

import { join, basename } from 'node:path';
import { VERSION } from '../version.js';
import { exists, writeFile, readJson, writeJson, copyFile, getTemplatesDir } from '../utils/fs.js';
import { info, success, warn, error, header, listItem } from '../utils/output.js';
import { isGitRepo } from '../utils/git.js';
import { detectProjectType } from '../utils/project-detector.js';
import { ensureAgentsMdLink } from '../utils/agents-md.js';
import { PRETTIERRC, LINT_STAGED_CONFIG, getEslintConfig } from '../templates/index.js';
import { detectArchitecture, generateBoundariesConfig } from '../utils/boundaries.js';
import { execSync } from 'node:child_process';
import {
  installTemplates,
  updateSettingsHooks,
  updateMcpConfig,
  setupHuskyPreCommit,
  BASE_DEV_DEPS,
} from '../utils/install.js';

export interface SetupOptions {
  yes?: boolean;
}

interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  'lint-staged'?: Record<string, string[]>;
}

export async function setup(options: SetupOptions): Promise<void> {
  const cwd = process.cwd();
  const safewordDir = join(cwd, '.safeword');

  // Check if already configured
  if (exists(safewordDir)) {
    error('Already configured. Run `safeword upgrade` to update.');
    process.exit(1);
  }

  // Check for package.json, create if missing
  const packageJsonPath = join(cwd, 'package.json');
  let packageJsonCreated = false;
  if (!exists(packageJsonPath)) {
    const dirName = basename(cwd) || 'project';
    const defaultPackageJson: PackageJson = {
      name: dirName,
      version: '0.1.0',
      scripts: {},
    };
    writeJson(packageJsonPath, defaultPackageJson);
    packageJsonCreated = true;
  }

  const isNonInteractive = options.yes || !process.stdin.isTTY;

  header('Safeword Setup');
  info(`Version: ${VERSION}`);

  if (packageJsonCreated) {
    info('Created package.json (none found)');
  }

  // Track created files for summary
  const created: string[] = packageJsonCreated ? ['package.json'] : [];
  const modified: string[] = [];

  try {
    const templatesDir = getTemplatesDir();

    // 1. Create .safeword directory structure and copy templates
    info('\nCreating .safeword directory...');

    const templateResult = installTemplates(cwd, { isSetup: true });
    created.push(...templateResult.created);

    // Write version file
    writeFile(join(safewordDir, 'version'), VERSION);

    success('Created .safeword directory');

    // 2. Handle AGENTS.md
    info('\nConfiguring AGENTS.md...');
    const agentsMdResult = ensureAgentsMdLink(cwd);
    if (agentsMdResult === 'created') {
      created.push('AGENTS.md');
      success('Created AGENTS.md');
    } else if (agentsMdResult === 'modified') {
      modified.push('AGENTS.md');
      success('Prepended link to AGENTS.md');
    } else {
      info('AGENTS.md already has safeword link');
    }

    // 3. Register Claude Code hooks (skills and commands already copied by installTemplates)
    info('\nRegistering Claude Code hooks...');

    const settingsPath = join(cwd, '.claude', 'settings.json');
    const settingsExisted = exists(settingsPath);

    try {
      updateSettingsHooks(cwd);

      if (settingsExisted) {
        modified.push('.claude/settings.json');
      } else {
        created.push('.claude/settings.json');
      }
      success('Registered hooks in .claude/settings.json');
    } catch (err) {
      error(`Failed to register hooks: ${err instanceof Error ? err.message : 'Unknown error'}`);
      process.exit(1);
    }

    // 4. Setup MCP servers
    info('\nConfiguring MCP servers...');

    const mcpConfigPath = join(cwd, '.mcp.json');
    const mcpExisted = exists(mcpConfigPath);

    updateMcpConfig(cwd);

    if (mcpExisted) {
      modified.push('.mcp.json');
    } else {
      created.push('.mcp.json');
    }
    success('Configured MCP servers');

    // 5. Setup linting
    info('\nConfiguring linting...');

    const packageJson = readJson<PackageJson>(packageJsonPath);
    if (!packageJson) {
      error('Failed to read package.json');
      process.exit(1);
    }

    const projectType = detectProjectType(packageJson);

    // Detect architecture boundaries (always configured, rules depend on detected dirs)
    const architecture = detectArchitecture(cwd);

    // Create dynamic ESLint config (detects frameworks from package.json at runtime)
    const eslintConfigPath = join(cwd, 'eslint.config.mjs');
    if (!exists(eslintConfigPath)) {
      writeFile(eslintConfigPath, getEslintConfig({ boundaries: true }));
      created.push('eslint.config.mjs');
      success('Created eslint.config.mjs (dynamic - adapts to framework changes)');
    } else {
      info('eslint.config.mjs already exists');
    }

    // Always create boundaries config (rules depend on detected architecture dirs)
    const boundariesConfigPath = join(safewordDir, 'eslint-boundaries.config.mjs');
    writeFile(boundariesConfigPath, generateBoundariesConfig(architecture));
    if (architecture.directories.length > 0) {
      info(
        `Detected architecture: ${architecture.directories.join(', ')} (${architecture.inSrc ? 'in src/' : 'at root'})`,
      );
    } else {
      info('No architecture directories detected yet (boundaries ready when you add them)');
    }
    success('Created .safeword/eslint-boundaries.config.mjs');

    // Create Prettier config
    const prettierrcPath = join(cwd, '.prettierrc');
    if (!exists(prettierrcPath)) {
      writeFile(prettierrcPath, PRETTIERRC);
      created.push('.prettierrc');
      success('Created .prettierrc');
    } else {
      info('.prettierrc already exists');
    }

    // Create markdownlint config (using cli2 preferred filename)
    const markdownlintPath = join(cwd, '.markdownlint-cli2.jsonc');
    if (!exists(markdownlintPath)) {
      copyFile(join(templatesDir, 'markdownlint-cli2.jsonc'), markdownlintPath);
      created.push('.markdownlint-cli2.jsonc');
      success('Created .markdownlint-cli2.jsonc');
    } else {
      info('.markdownlint-cli2.jsonc already exists');
    }

    // Add scripts and lint-staged config to package.json
    try {
      const scripts = packageJson.scripts ?? {};
      let packageJsonModified = false;

      if (!scripts.lint) {
        scripts.lint = 'eslint .';
        packageJsonModified = true;
      }

      if (!scripts['lint:md']) {
        scripts['lint:md'] = 'markdownlint-cli2 "**/*.md" "#node_modules"';
        packageJsonModified = true;
      }

      if (!scripts.format) {
        scripts.format = 'prettier --write .';
        packageJsonModified = true;
      }

      if (!scripts['format:check']) {
        scripts['format:check'] = 'prettier --check .';
        packageJsonModified = true;
      }

      if (!scripts.knip) {
        scripts.knip = 'knip';
        packageJsonModified = true;
      }

      // Add publint script for publishable libraries
      if (projectType.publishableLibrary && !scripts.publint) {
        scripts.publint = 'publint';
        packageJsonModified = true;
      }

      // Add prepare script for Husky (runs on npm install)
      // The || true fallback prevents npm install --production from failing
      // when husky (a devDependency) isn't installed
      if (!scripts.prepare) {
        scripts.prepare = 'husky || true';
        packageJsonModified = true;
      }

      // Add lint-staged config
      if (!packageJson['lint-staged']) {
        packageJson['lint-staged'] = LINT_STAGED_CONFIG;
        packageJsonModified = true;
      }

      if (packageJsonModified) {
        packageJson.scripts = scripts;
        writeJson(packageJsonPath, packageJson);
        modified.push('package.json');
        success('Added lint scripts and lint-staged config');
      }
    } catch (err) {
      error(
        `Failed to update package.json: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
      process.exit(1);
    }

    // 6. Install dependencies
    info('\nInstalling linting dependencies...');

    // Build the list of packages to install (start with base deps from shared constants)
    const devDeps: string[] = [...BASE_DEV_DEPS];

    // Add framework-specific dependencies
    if (projectType.typescript) {
      devDeps.push('typescript-eslint');
    }
    if (projectType.react || projectType.nextjs) {
      devDeps.push('eslint-plugin-react', 'eslint-plugin-react-hooks', 'eslint-plugin-jsx-a11y');
    }
    if (projectType.nextjs) {
      devDeps.push('@next/eslint-plugin-next');
    }
    if (projectType.astro) {
      devDeps.push('eslint-plugin-astro');
    }
    if (projectType.vue) {
      devDeps.push('eslint-plugin-vue');
    }
    if (projectType.svelte) {
      devDeps.push('eslint-plugin-svelte');
    }
    if (projectType.electron) {
      devDeps.push('@electron-toolkit/eslint-config');
    }
    if (projectType.vitest) {
      devDeps.push('@vitest/eslint-plugin');
    }
    if (projectType.tailwind) {
      devDeps.push('prettier-plugin-tailwindcss');
    }
    if (projectType.publishableLibrary) {
      devDeps.push('publint');
    }

    try {
      const installCmd = `npm install -D ${devDeps.join(' ')}`;
      info(`Running: ${installCmd}`);
      execSync(installCmd, { cwd, stdio: 'inherit' });
      success('Installed linting dependencies');
    } catch {
      warn('Failed to install dependencies. Run manually:');
      listItem(`npm install -D ${devDeps.join(' ')}`);
    }

    // 7. Setup Husky for git hooks
    info('\nConfiguring git hooks with Husky...');

    if (isGitRepo(cwd)) {
      try {
        setupHuskyPreCommit(cwd);
        created.push('.husky/pre-commit');
        success('Configured Husky with lint-staged pre-commit hook');
      } catch {
        warn('Failed to setup Husky. Run manually:');
        listItem('mkdir -p .husky');
        listItem('echo "npx safeword sync --quiet --stage && npx lint-staged" > .husky/pre-commit');
      }
    } else if (isNonInteractive) {
      warn('Skipped Husky setup (no git repository)');
    } else {
      warn('Skipped Husky setup (no .git directory)');
      info('Initialize git and run safeword setup again to enable pre-commit hooks');
    }

    // Print summary
    header('Setup Complete');

    if (created.length > 0) {
      info('\nCreated:');
      for (const file of created) {
        listItem(file);
      }
    }

    if (modified.length > 0) {
      info('\nModified:');
      for (const file of modified) {
        listItem(file);
      }
    }

    info('\nNext steps:');
    listItem('Run `safeword check` to verify setup');
    listItem('Commit the new files to git');

    success(`\nSafeword ${VERSION} installed successfully!`);
  } catch (err) {
    error(`Setup failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    process.exit(1);
  }
}
