#!/usr/bin/env bun
// Safeword: Lint configuration sync check (SessionStart)
// Warns if ESLint or Prettier configs are missing or out of sync

import { existsSync } from 'node:fs';

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const safewordDir = `${projectDir}/.safeword`;

// Not a safeword project, skip silently
if (!existsSync(safewordDir)) {
  process.exit(0);
}

const warnings: string[] = [];

// Check for ESLint config
const eslintConfigs = [
  'eslint.config.mjs',
  'eslint.config.js',
  '.eslintrc.json',
  '.eslintrc.js',
];
const hasEslint = await Promise.all(
  eslintConfigs.map(f => Bun.file(`${projectDir}/${f}`).exists().catch(() => false)),
);
if (!hasEslint.some(Boolean)) {
  warnings.push("ESLint config not found - run 'bun run lint' may fail");
}

// Check for Prettier config
const prettierConfigs = ['.prettierrc', '.prettierrc.json', 'prettier.config.js'];
const hasPrettier = await Promise.all(
  prettierConfigs.map(f => Bun.file(`${projectDir}/${f}`).exists().catch(() => false)),
);
if (!hasPrettier.some(Boolean)) {
  warnings.push('Prettier config not found - formatting may be inconsistent');
}

// Check for required dependencies in package.json
const pkgJsonFile = Bun.file(`${projectDir}/package.json`);
if (await pkgJsonFile.exists()) {
  try {
    const pkgJson = await pkgJsonFile.text();
    if (!pkgJson.includes('"eslint"')) {
      warnings.push("ESLint not in package.json - run 'bun add -D eslint'");
    }
    if (!pkgJson.includes('"prettier"')) {
      warnings.push("Prettier not in package.json - run 'bun add -D prettier'");
    }
  } catch (error) {
    if (process.env.DEBUG) console.error('[session-lint-check] package.json parse error:', error);
  }
}

// Output warnings if any
if (warnings.length > 0) {
  console.log('SAFEWORD Lint Check:');
  for (const warning of warnings) {
    console.log(`  ⚠️  ${warning}`);
  }
}
