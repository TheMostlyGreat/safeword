#!/usr/bin/env bun
// Safeword: Question protocol guidance (UserPromptSubmit)
// Reminds Claude to ask 1-5 clarifying questions for ambiguous tasks

import { existsSync } from 'node:fs';

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const safewordDir = `${projectDir}/.safeword`;

// Not a safeword project, skip silently
if (!existsSync(safewordDir)) {
  process.exit(0);
}

console.log(
  `SAFEWORD: Research before asking. Debate options (correct? elegant? latest practices?), then ask 1-5 targeted questions about scope, constraints, or success criteria.`
);
