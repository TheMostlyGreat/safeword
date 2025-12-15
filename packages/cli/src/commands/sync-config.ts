/**
 * Sync Config command - Regenerate depcruise config from current project structure
 *
 * Used by `/audit` slash command to refresh config before running checks.
 */

import { writeFileSync } from 'node:fs';
import nodePath from 'node:path';

import { detectArchitecture } from '../utils/boundaries.js';
import {
  generateDepCruiseConfigFile,
  generateDepCruiseMainConfig,
} from '../utils/depcruise-config.js';
import { exists } from '../utils/fs.js';
import { error, info, success } from '../utils/output.js';

/**
 * Sync depcruise config with current project structure
 */
export async function syncConfig(): Promise<void> {
  const cwd = process.cwd();
  const safewordDirectory = nodePath.join(cwd, '.safeword');

  // Check if .safeword exists
  if (!exists(safewordDirectory)) {
    error('Not configured. Run `safeword setup` first.');
    process.exit(1);
  }

  // Detect current architecture
  const arch = detectArchitecture(cwd);

  // Generate and write .safeword/depcruise-config.js
  const generatedConfigPath = nodePath.join(safewordDirectory, 'depcruise-config.js');
  const generatedConfig = generateDepCruiseConfigFile(arch);
  writeFileSync(generatedConfigPath, generatedConfig);
  info('Generated .safeword/depcruise-config.js');

  // Create main config if not exists (self-healing)
  const mainConfigPath = nodePath.join(cwd, '.dependency-cruiser.js');
  if (!exists(mainConfigPath)) {
    const mainConfig = generateDepCruiseMainConfig();
    writeFileSync(mainConfigPath, mainConfig);
    info('Created .dependency-cruiser.js');
  }

  success('Config synced');
}
