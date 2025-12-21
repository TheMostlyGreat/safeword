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

// Read the user prompt from stdin
const input = await Bun.stdin.text();

// Only trigger on substantial prompts (more than 20 chars)
if (input.length < 20) {
  process.exit(0);
}

console.log(`SAFEWORD Question Protocol: For ambiguous or complex requests, ask 1-5 clarifying questions before proceeding. Focus on:
- Scope boundaries (what's included/excluded)
- Technical constraints (frameworks, patterns, compatibility)
- Success criteria (how will we know it's done)`);
