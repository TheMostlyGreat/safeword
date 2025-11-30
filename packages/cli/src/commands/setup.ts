/**
 * Setup command - Initialize safeword in a project
 */

import { join, basename } from 'node:path';
import { VERSION } from '../version.js';
import {
  exists,
  ensureDir,
  writeFile,
  readJson,
  writeJson,
  updateJson,
  copyDir,
  copyFile,
  getTemplatesDir,
  makeScriptsExecutable,
} from '../utils/fs.js';
import { info, success, warn, error, header, listItem } from '../utils/output.js';
import { isGitRepo } from '../utils/git.js';
import { detectProjectType } from '../utils/project-detector.js';
import { filterOutSafewordHooks } from '../utils/hooks.js';
import { ensureAgentsMdLink } from '../utils/agents-md.js';
import { PRETTIERRC, LINT_STAGED_CONFIG, getEslintConfig, SETTINGS_HOOKS } from '../templates/index.js';
import { detectArchitecture, generateBoundariesConfig } from '../utils/boundaries.js';
import { execSync } from 'node:child_process';

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

    ensureDir(safewordDir);
    ensureDir(join(safewordDir, 'learnings'));
    ensureDir(join(safewordDir, 'planning', 'user-stories'));
    ensureDir(join(safewordDir, 'planning', 'design'));
    ensureDir(join(safewordDir, 'tickets', 'completed'));

    // Copy full SAFEWORD.md from templates
    copyFile(join(templatesDir, 'SAFEWORD.md'), join(safewordDir, 'SAFEWORD.md'));
    writeFile(join(safewordDir, 'version'), VERSION);

    // Copy methodology guides
    copyDir(join(templatesDir, 'guides'), join(safewordDir, 'guides'));

    // Copy document templates (to 'templates' to match links in SAFEWORD.md)
    copyDir(join(templatesDir, 'doc-templates'), join(safewordDir, 'templates'));

    // Copy review prompts
    copyDir(join(templatesDir, 'prompts'), join(safewordDir, 'prompts'));

    // Copy lib scripts and make executable
    copyDir(join(templatesDir, 'lib'), join(safewordDir, 'lib'));
    makeScriptsExecutable(join(safewordDir, 'lib'));

    // Copy hook scripts and make executable
    copyDir(join(templatesDir, 'hooks'), join(safewordDir, 'hooks'));
    makeScriptsExecutable(join(safewordDir, 'hooks'));

    created.push('.safeword/');
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

    // 3. Register Claude Code hooks
    info('\nRegistering Claude Code hooks...');

    const claudeDir = join(cwd, '.claude');
    const settingsPath = join(claudeDir, 'settings.json');

    ensureDir(claudeDir);

    try {
      updateJson<{ hooks?: Record<string, unknown[]> }>(settingsPath, existing => {
        const hooks = existing?.hooks ?? {};

        // Merge hooks, preserving existing non-safeword hooks
        for (const [event, newHooks] of Object.entries(SETTINGS_HOOKS)) {
          const existingHooks = (hooks[event] as unknown[]) ?? [];
          const nonSafewordHooks = filterOutSafewordHooks(existingHooks);
          hooks[event] = [...nonSafewordHooks, ...newHooks];
        }

        return { ...existing, hooks };
      });

      if (exists(settingsPath)) {
        modified.push('.claude/settings.json');
      } else {
        created.push('.claude/settings.json');
      }
      success('Registered hooks in .claude/settings.json');
    } catch (err) {
      error(`Failed to register hooks: ${err instanceof Error ? err.message : 'Unknown error'}`);
      process.exit(1);
    }

    // 4. Copy skills
    info('\nInstalling skills...');

    const skillsDir = join(claudeDir, 'skills');
    copyDir(join(templatesDir, 'skills'), skillsDir);

    created.push('.claude/skills/safeword-quality-reviewer/');
    success('Installed skills');

    // 5. Copy slash commands
    info('\nInstalling slash commands...');

    const commandsDir = join(claudeDir, 'commands');
    copyDir(join(templatesDir, 'commands'), commandsDir);

    created.push('.claude/commands/');
    success('Installed slash commands');

    // 6. Setup MCP servers
    info('\nConfiguring MCP servers...');

    const mcpConfigPath = join(cwd, '.mcp.json');

    updateJson<{ mcpServers?: Record<string, unknown> }>(mcpConfigPath, existing => {
      const mcpServers = existing?.mcpServers ?? {};

      // Add safeword MCP servers (context7 and playwright)
      mcpServers.context7 = {
        command: 'npx',
        args: ['-y', '@upstash/context7-mcp@latest'],
      };
      mcpServers.playwright = {
        command: 'npx',
        args: ['@playwright/mcp@latest'],
      };

      return { ...existing, mcpServers };
    });

    if (exists(mcpConfigPath)) {
      modified.push('.mcp.json');
    } else {
      created.push('.mcp.json');
    }
    success('Configured MCP servers');

    // 7. Setup linting
    info('\nConfiguring linting...');

    const packageJson = readJson<PackageJson>(packageJsonPath);
    if (!packageJson) {
      error('Failed to read package.json');
      process.exit(1);
    }

    const projectType = detectProjectType(packageJson);

    // Detect architecture boundaries (always configured, rules depend on detected dirs)
    const architecture = detectArchitecture(cwd);

    // Create ESLint config (always includes boundaries)
    const eslintConfigPath = join(cwd, 'eslint.config.mjs');
    if (!exists(eslintConfigPath)) {
      writeFile(
        eslintConfigPath,
        getEslintConfig({
          ...projectType,
          boundaries: true, // Always enabled
        }),
      );
      created.push('eslint.config.mjs');
      success('Created eslint.config.mjs');
    } else {
      info('eslint.config.mjs already exists');
    }

    // Always create boundaries config (rules depend on detected architecture dirs)
    const boundariesConfigPath = join(safewordDir, 'eslint-boundaries.config.mjs');
    writeFile(boundariesConfigPath, generateBoundariesConfig(architecture));
    if (architecture.directories.length > 0) {
      info(`Detected architecture: ${architecture.directories.join(', ')} (${architecture.inSrc ? 'in src/' : 'at root'})`);
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

    // 8. Install dependencies
    info('\nInstalling linting dependencies...');

    // Build the list of packages to install
    const devDeps: string[] = [
      'eslint',
      'prettier',
      '@eslint/js',
      'eslint-plugin-import-x',
      'eslint-plugin-sonarjs',
      '@microsoft/eslint-plugin-sdl',
      'eslint-config-prettier',
      'markdownlint-cli2',
      'knip',
      'husky',
      'lint-staged',
    ];

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
    // Always install boundaries - configured only when 3+ architecture directories exist
    devDeps.push('eslint-plugin-boundaries');
    if (projectType.electron) {
      devDeps.push('@electron-toolkit/eslint-config');
    }
    if (projectType.vitest) {
      devDeps.push('@vitest/eslint-plugin');
    }
    // Always include Playwright - safeword sets up e2e testing with Playwright
    devDeps.push('eslint-plugin-playwright');

    // Tailwind: use official Prettier plugin for class sorting
    if (projectType.tailwind) {
      devDeps.push('prettier-plugin-tailwindcss');
    }

    // Publishable libraries: validate package.json for npm publishing
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

    // 9. Setup Husky for git hooks (manually, not using husky init which overwrites prepare script)
    info('\nConfiguring git hooks with Husky...');

    if (isGitRepo(cwd)) {
      try {
        // Create .husky directory and pre-commit hook manually
        // (husky init unconditionally sets prepare script, which we don't want)
        const huskyDir = join(cwd, '.husky');
        ensureDir(huskyDir);

        // Create pre-commit hook that runs lint-staged
        const huskyPreCommit = join(huskyDir, 'pre-commit');
        writeFile(huskyPreCommit, 'npx lint-staged\n');

        // Make hook executable (required for git hooks on Unix)
        makeScriptsExecutable(huskyDir);

        created.push('.husky/pre-commit');
        success('Configured Husky with lint-staged pre-commit hook');
      } catch {
        warn('Failed to setup Husky. Run manually:');
        listItem('mkdir -p .husky');
        listItem('echo "npx lint-staged" > .husky/pre-commit');
      }
    } else if (isNonInteractive) {
      warn('Skipped Husky setup (no git repository)');
    } else {
      warn('Skipped Husky setup (no .git directory)');
      info('Initialize git and run: mkdir -p .husky && echo "npx lint-staged" > .husky/pre-commit');
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
