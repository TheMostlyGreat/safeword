/**
 * Check command - Verify project health and configuration
 */

import { join } from 'node:path';
import { VERSION } from '../version.js';
import { exists, readFile, readFileSafe } from '../utils/fs.js';
import { info, success, warn, header, keyValue } from '../utils/output.js';
import { isNewerVersion } from '../utils/version.js';

export interface CheckOptions {
  offline?: boolean;
}

interface HealthStatus {
  configured: boolean;
  projectVersion: string | null;
  cliVersion: string;
  updateAvailable: boolean;
  latestVersion: string | null;
  issues: string[];
}

/**
 * Check for latest version from npm (with timeout)
 */
async function checkLatestVersion(timeout = 3000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch('https://registry.npmjs.org/safeword/latest', {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = (await response.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

/**
 * Check project configuration health
 */
function checkHealth(cwd: string): HealthStatus {
  const safewordDir = join(cwd, '.safeword');
  const issues: string[] = [];

  // Check if configured
  if (!exists(safewordDir)) {
    return {
      configured: false,
      projectVersion: null,
      cliVersion: VERSION,
      updateAvailable: false,
      latestVersion: null,
      issues: [],
    };
  }

  // Read project version
  const versionPath = join(safewordDir, 'version');
  const projectVersion = readFileSafe(versionPath)?.trim() ?? null;

  // Check for required files
  const requiredFiles = ['SAFEWORD.md', 'version', 'hooks/agents-md-check.sh'];

  for (const file of requiredFiles) {
    if (!exists(join(safewordDir, file))) {
      issues.push(`Missing: .safeword/${file}`);
    }
  }

  // Check AGENTS.md link
  const agentsMdPath = join(cwd, 'AGENTS.md');
  if (exists(agentsMdPath)) {
    const content = readFile(agentsMdPath);
    if (!content.includes('@./.safeword/SAFEWORD.md')) {
      issues.push('AGENTS.md missing safeword link');
    }
  } else {
    issues.push('AGENTS.md file missing');
  }

  // Check .claude/settings.json
  const settingsPath = join(cwd, '.claude', 'settings.json');
  if (!exists(settingsPath)) {
    issues.push('Missing: .claude/settings.json');
  }

  return {
    configured: true,
    projectVersion,
    cliVersion: VERSION,
    updateAvailable: false,
    latestVersion: null,
    issues,
  };
}

export async function check(options: CheckOptions): Promise<void> {
  const cwd = process.cwd();

  header('Safeword Health Check');

  const health = checkHealth(cwd);

  // Not configured
  if (!health.configured) {
    info('Not configured. Run `safeword setup` to initialize.');
    return;
  }

  // Show versions
  keyValue('Safeword CLI', `v${health.cliVersion}`);
  keyValue('Project config', health.projectVersion ? `v${health.projectVersion}` : 'unknown');

  // Check for updates (unless offline)
  if (!options.offline) {
    info('\nChecking for updates...');
    const latestVersion = await checkLatestVersion();

    if (latestVersion) {
      health.latestVersion = latestVersion;
      health.updateAvailable = isNewerVersion(health.cliVersion, latestVersion);

      if (health.updateAvailable) {
        warn(`Update available: v${latestVersion}`);
        info('Run `npm install -g safeword` to upgrade');
      } else {
        success('CLI is up to date');
      }
    } else {
      warn("Couldn't check for updates (offline?)");
    }
  } else {
    info('\nSkipped update check (offline mode)');
  }

  // Check project version vs CLI version
  if (health.projectVersion && isNewerVersion(health.cliVersion, health.projectVersion)) {
    warn(`Project config (v${health.projectVersion}) is newer than CLI (v${health.cliVersion})`);
    info('Consider upgrading the CLI');
  } else if (health.projectVersion && isNewerVersion(health.projectVersion, health.cliVersion)) {
    info(`\nUpgrade available for project config`);
    info(
      `Run \`safeword upgrade\` to update from v${health.projectVersion} to v${health.cliVersion}`,
    );
  }

  // Show issues
  if (health.issues.length > 0) {
    header('Issues Found');
    for (const issue of health.issues) {
      warn(issue);
    }
    info('\nRun `safeword upgrade` to repair configuration');
  } else {
    success('\nConfiguration is healthy');
  }
}
