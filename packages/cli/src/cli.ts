#!/usr/bin/env node

import { Command } from 'commander';

import { VERSION } from './version.js';

const program = new Command();

program
  .name('safeword')
  .description('CLI for setting up and managing safeword development environments')
  .version(VERSION);

program
  .command('setup')
  .description('Set up safeword in the current project')
  .option('-y, --yes', 'Accept all defaults (non-interactive mode)')
  .action(async options => {
    const { setup } = await import('./commands/setup.js');
    await setup(options);
  });

program
  .command('check')
  .description('Check project health and versions')
  .option('--offline', 'Skip remote version check')
  .action(async options => {
    const { check } = await import('./commands/check.js');
    await check(options);
  });

program
  .command('upgrade')
  .description('Upgrade safeword configuration to latest version')
  .action(async () => {
    const { upgrade } = await import('./commands/upgrade.js');
    await upgrade();
  });

program
  .command('diff')
  .description('Preview changes that would be made by upgrade')
  .option('-v, --verbose', 'Show full diff output')
  .action(async options => {
    const { diff } = await import('./commands/diff.js');
    await diff(options);
  });

program
  .command('reset')
  .description('Remove safeword configuration from project')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('--full', 'Also remove linting config and uninstall npm packages')
  .action(async options => {
    const { reset } = await import('./commands/reset.js');
    await reset(options);
  });

// Show help if no arguments provided
if (process.argv.length === 2) {
  program.help();
}

// Parse arguments
program.parse();
