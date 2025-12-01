/**
 * Upgrade command - Update safeword configuration to latest version
 */

import { join } from 'node:path';
import { VERSION } from '../version.js';
import { exists, readFileSafe, writeFile } from '../utils/fs.js';
import { info, success, error, header, listItem } from '../utils/output.js';
import { isGitRepo } from '../utils/git.js';
import { compareVersions } from '../utils/version.js';
import { ensureAgentsMdLink } from '../utils/agents-md.js';
import { detectArchitecture, generateBoundariesConfig } from '../utils/boundaries.js';
import {
  installTemplates,
  updateSettingsHooks,
  updateMcpConfig,
  setupHuskyPreCommit,
} from '../utils/install.js';

export async function upgrade(): Promise<void> {
  const cwd = process.cwd();
  const safewordDir = join(cwd, '.safeword');

  // Check if configured
  if (!exists(safewordDir)) {
    error('Not configured. Run `safeword setup` first.');
    process.exit(1);
  }

  // Read project version
  const versionPath = join(safewordDir, 'version');
  const projectVersion = readFileSafe(versionPath)?.trim() ?? '0.0.0';

  // Check for downgrade
  if (compareVersions(VERSION, projectVersion) < 0) {
    error(`CLI v${VERSION} is older than project v${projectVersion}.`);
    error('Update the CLI first: npm install -g safeword');
    process.exit(1);
  }

  header('Safeword Upgrade');
  info(`Upgrading from v${projectVersion} to v${VERSION}`);

  const updated: string[] = [];
  const unchanged: string[] = [];

  try {
    // 1. Update .safeword directory and .claude directories
    info('\nUpdating templates...');

    const templateResult = installTemplates(cwd, { isSetup: false });
    updated.push(...templateResult.updated);

    // Update version file
    writeFile(join(safewordDir, 'version'), VERSION);
    updated.push('.safeword/version');

    success('Updated .safeword directory');

    // 2. Verify AGENTS.md link
    info('\nVerifying AGENTS.md...');
    const agentsMdResult = ensureAgentsMdLink(cwd);
    if (agentsMdResult === 'created') {
      updated.push('AGENTS.md');
      success('Created AGENTS.md');
    } else if (agentsMdResult === 'modified') {
      updated.push('AGENTS.md');
      success('Restored link to AGENTS.md');
    } else {
      unchanged.push('AGENTS.md');
      info('AGENTS.md link is present');
    }

    // 3. Update Claude Code hooks
    info('\nUpdating Claude Code hooks...');

    updateSettingsHooks(cwd);
    updated.push('.claude/settings.json');
    success('Updated hooks in .claude/settings.json');

    // 4. Update MCP servers
    info('\nUpdating MCP servers...');

    const mcpResult = updateMcpConfig(cwd);
    if (mcpResult === 'created') {
      updated.push('.mcp.json');
    } else {
      updated.push('.mcp.json');
    }
    success('Updated MCP servers');

    // 5. Update boundaries config (regenerate based on current framework detection)
    info('\nUpdating boundaries config...');

    const architecture = detectArchitecture(cwd);
    const boundariesConfigPath = join(safewordDir, 'eslint-boundaries.config.mjs');
    writeFile(boundariesConfigPath, generateBoundariesConfig(architecture));

    if (architecture.directories.length > 0) {
      info(
        `Detected architecture: ${architecture.directories.join(', ')} (${architecture.inSrc ? 'in src/' : 'at root'})`,
      );
    }
    updated.push('.safeword/eslint-boundaries.config.mjs');
    success('Updated boundaries config');

    // 6. Update Husky hooks if repo exists
    if (isGitRepo(cwd)) {
      info('\nUpdating Husky pre-commit hook...');

      const huskyResult = setupHuskyPreCommit(cwd);
      updated.push('.husky/pre-commit');

      if (huskyResult === 'created') {
        success('Initialized Husky with pre-commit hook');
      } else {
        success('Updated Husky pre-commit hook');
      }
    }

    // Print summary
    header('Upgrade Complete');

    info(`\nVersion: v${projectVersion} → v${VERSION}`);

    if (updated.length > 0) {
      info('\nUpdated:');
      for (const file of updated) {
        listItem(file);
      }
    }

    if (unchanged.length > 0) {
      info('\nUnchanged:');
      for (const file of unchanged) {
        listItem(file);
      }
    }

    success(`\nSafeword upgraded to v${VERSION}`);
  } catch (err) {
    error(`Upgrade failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    process.exit(1);
  }
}
