#!/usr/bin/env node
/* eslint-env node */
// Ensures publishing happens via bun (which strips workspace: protocols)
const agent = process.env.npm_config_user_agent || '';
if (!agent.includes('bun')) {
  console.error('\u001B[31mError: Use "bun publish", not "npm publish"\u001B[0m');
  console.error('npm publish does not strip workspace: protocols from package.json');
  process.exit(1);
}
