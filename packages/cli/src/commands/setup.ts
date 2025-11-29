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
import { isGitRepo, installGitHook } from '../utils/git.js';
import { detectProjectType } from '../utils/project-detector.js';
import { filterOutSafewordHooks } from '../utils/hooks.js';
import { ensureAgentsMdLink } from '../utils/agents-md.js';
import { PRETTIERRC, getEslintConfig, SETTINGS_HOOKS } from '../templates/index.js';

export interface SetupOptions {
  yes?: boolean;
}

interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
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

    // Create ESLint config
    const eslintConfigPath = join(cwd, 'eslint.config.mjs');
    if (!exists(eslintConfigPath)) {
      writeFile(eslintConfigPath, getEslintConfig(projectType));
      created.push('eslint.config.mjs');
      success('Created eslint.config.mjs');
    } else {
      info('eslint.config.mjs already exists');
    }

    // Create Prettier config
    const prettierrcPath = join(cwd, '.prettierrc');
    if (!exists(prettierrcPath)) {
      writeFile(prettierrcPath, PRETTIERRC);
      created.push('.prettierrc');
      success('Created .prettierrc');
    } else {
      info('.prettierrc already exists');
    }

    // Create markdownlint config
    const markdownlintPath = join(cwd, '.markdownlint.jsonc');
    if (!exists(markdownlintPath)) {
      copyFile(join(templatesDir, 'markdownlint.jsonc'), markdownlintPath);
      created.push('.markdownlint.jsonc');
      success('Created .markdownlint.jsonc');
    } else {
      info('.markdownlint.jsonc already exists');
    }

    // Add scripts to package.json
    try {
      const scripts = packageJson.scripts ?? {};
      let scriptsModified = false;

      if (!scripts.lint) {
        scripts.lint = 'eslint .';
        scriptsModified = true;
      }

      if (!scripts['lint:md']) {
        scripts['lint:md'] = 'markdownlint-cli2 "**/*.md" "#node_modules"';
        scriptsModified = true;
      }

      if (!scripts.format) {
        scripts.format = 'prettier --write .';
        scriptsModified = true;
      }

      if (!scripts['format:check']) {
        scripts['format:check'] = 'prettier --check .';
        scriptsModified = true;
      }

      if (scriptsModified) {
        packageJson.scripts = scripts;
        writeJson(packageJsonPath, packageJson);
        modified.push('package.json');
        success('Added lint and format scripts');
      }
    } catch (err) {
      error(
        `Failed to update package.json: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
      process.exit(1);
    }

    // 8. Handle git repository
    info('\nConfiguring git...');

    if (isGitRepo(cwd)) {
      installGitHook(cwd);
      modified.push('.git/hooks/pre-commit');
      success('Installed git pre-commit hook');
    } else if (isNonInteractive) {
      warn('Skipped git initialization (non-interactive mode)');
      warn('Git hooks not installed (no repository)');
    } else {
      // Interactive mode - would prompt here
      // For now, skip in all cases
      warn('Skipped git initialization (no .git directory)');
      warn('Git hooks not installed (no repository)');
    }

    // 9. Note about dependencies
    info('\nNote: Install linting dependencies manually:');
    listItem('npm install -D eslint prettier @eslint/js');
    if (projectType.typescript) {
      listItem('npm install -D typescript-eslint');
    }
    if (projectType.react) {
      listItem('npm install -D eslint-plugin-react eslint-plugin-react-hooks');
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
    listItem('Install linting dependencies (see above)');
    listItem('Run `safeword check` to verify setup');
    listItem('Commit the new files to git');

    success(`\nSafeword ${VERSION} installed successfully!`);
  } catch (err) {
    error(`Setup failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    process.exit(1);
  }
}
