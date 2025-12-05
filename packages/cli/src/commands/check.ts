/**
 * Check command - Verify project health and configuration
 *
 * Uses reconcile() with dryRun to detect missing files and configuration issues.
 */

import { join } from 'node:path';
import { VERSION } from '../version.js';
import { exists, readFileSafe } from '../utils/fs.js';
import { info, success, warn, header, keyValue } from '../utils/output.js';
import { isNewerVersion } from '../utils/version.js';
import { createProjectContext } from '../utils/context.js';
import { reconcile } from '../reconcile.js';
import { SAFEWORD_SCHEMA } from '../schema.js';

export interface CheckOptions {
  offline?: boolean;
}

/** Check for missing files from write actions */
function findMissingFiles(cwd: string, actions: { type: string; path: string }[]): string[] {
  const issues: string[] = [];
  for (const action of actions) {
    if (action.type === 'write' && !exists(join(cwd, action.path))) {
      issues.push(`Missing: ${action.path}`);
    }
  }
  return issues;
}

/** Check for missing text patch markers */
function findMissingPatches(
  cwd: string,
  actions: { type: string; path: string; definition?: { marker: string } }[],
): string[] {
  const issues: string[] = [];
  for (const action of actions) {
    if (action.type !== 'text-patch') continue;

    const fullPath = join(cwd, action.path);
    if (!exists(fullPath)) {
      issues.push(`${action.path} file missing`);
    } else {
      const content = readFileSafe(fullPath) ?? '';
      if (action.definition && !content.includes(action.definition.marker)) {
        issues.push(`${action.path} missing safeword link`);
      }
    }
  }
  return issues;
}

interface HealthStatus {
  configured: boolean;
  projectVersion: string | null;
  cliVersion: string;
  updateAvailable: boolean;
  latestVersion: string | null;
  issues: string[];
  missingPackages: string[];
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
 * Check project configuration health using reconcile dryRun
 */
async function checkHealth(cwd: string): Promise<HealthStatus> {
  const safewordDir = join(cwd, '.safeword');

  // Check if configured
  if (!exists(safewordDir)) {
    return {
      configured: false,
      projectVersion: null,
      cliVersion: VERSION,
      updateAvailable: false,
      latestVersion: null,
      issues: [],
      missingPackages: [],
    };
  }

  // Read project version
  const versionPath = join(safewordDir, 'version');
  const projectVersion = readFileSafe(versionPath)?.trim() ?? null;

  // Use reconcile with dryRun to detect issues
  const ctx = createProjectContext(cwd);
  const result = await reconcile(SAFEWORD_SCHEMA, 'upgrade', ctx, { dryRun: true });

  // Collect issues from write actions and text patches
  const issues: string[] = [
    ...findMissingFiles(cwd, result.actions),
    ...findMissingPatches(cwd, result.actions),
  ];

  // Check for missing .claude/settings.json
  if (!exists(join(cwd, '.claude', 'settings.json'))) {
    issues.push('Missing: .claude/settings.json');
  }

  return {
    configured: true,
    projectVersion,
    cliVersion: VERSION,
    updateAvailable: false,
    latestVersion: null,
    issues,
    missingPackages: result.packagesToInstall,
  };
}

/** Check for CLI updates and report status */
async function reportUpdateStatus(health: HealthStatus): Promise<void> {
  info('\nChecking for updates...');
  const latestVersion = await checkLatestVersion();

  if (!latestVersion) {
    warn("Couldn't check for updates (offline?)");
    return;
  }

  health.latestVersion = latestVersion;
  health.updateAvailable = isNewerVersion(health.cliVersion, latestVersion);

  if (health.updateAvailable) {
    warn(`Update available: v${latestVersion}`);
    info('Run `npm install -g safeword` to upgrade');
  } else {
    success('CLI is up to date');
  }
}

/** Compare project version vs CLI version and report */
function reportVersionMismatch(health: HealthStatus): void {
  if (!health.projectVersion) return;

  if (isNewerVersion(health.cliVersion, health.projectVersion)) {
    warn(`Project config (v${health.projectVersion}) is newer than CLI (v${health.cliVersion})`);
    info('Consider upgrading the CLI');
  } else if (isNewerVersion(health.projectVersion, health.cliVersion)) {
    info(`\nUpgrade available for project config`);
    info(
      `Run \`safeword upgrade\` to update from v${health.projectVersion} to v${health.cliVersion}`,
    );
  }
}

/** Report issues or success */
function reportHealthSummary(health: HealthStatus): void {
  if (health.issues.length > 0) {
    header('Issues Found');
    for (const issue of health.issues) {
      warn(issue);
    }
    info('\nRun `safeword upgrade` to repair configuration');
    return;
  }

  if (health.missingPackages.length > 0) {
    header('Missing Packages');
    info(`${health.missingPackages.length} linting packages not installed`);
    info('Run `safeword sync` to install missing packages');
    return;
  }

  success('\nConfiguration is healthy');
}

export async function check(options: CheckOptions): Promise<void> {
  const cwd = process.cwd();

  header('Safeword Health Check');

  const health = await checkHealth(cwd);

  // Not configured
  if (!health.configured) {
    info('Not configured. Run `safeword setup` to initialize.');
    return;
  }

  // Show versions
  keyValue('Safeword CLI', `v${health.cliVersion}`);
  keyValue('Project config', health.projectVersion ? `v${health.projectVersion}` : 'unknown');

  // Check for updates (unless offline)
  if (options.offline) {
    info('\nSkipped update check (offline mode)');
  } else {
    await reportUpdateStatus(health);
  }

  reportVersionMismatch(health);
  reportHealthSummary(health);
}
