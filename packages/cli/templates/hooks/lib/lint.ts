// Shared linting logic for Claude Code and Cursor hooks
// Used by: post-tool-lint.ts, cursor/after-file-edit.ts
//
// Uses explicit --config flags pointing to .safeword/ configs for LLM enforcement.
// This allows stricter rules for LLMs while humans use their normal project configs.

import { existsSync } from 'node:fs';

import { $ } from 'bun';

// File extensions for different linting strategies
const JS_EXTENSIONS = new Set([
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'mts',
  'cjs',
  'cts',
  'vue',
  'svelte',
  'astro',
]);
const PYTHON_EXTENSIONS = new Set(['py', 'pyi']);
const GO_EXTENSIONS = new Set(['go']);
const SHELL_EXTENSIONS = new Set(['sh']);
const PRETTIER_EXTENSIONS = new Set(['md', 'json', 'css', 'scss', 'html', 'yaml', 'yml', 'graphql']);

// Cache safeword config paths at module init (avoids repeated fs checks per file)
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const SAFEWORD_ESLINT = `${projectDir}/.safeword/eslint.config.mjs`;
const SAFEWORD_RUFF = `${projectDir}/.safeword/ruff.toml`;
const SAFEWORD_GOLANGCI = `${projectDir}/.safeword/.golangci.yml`;

const HAS_SAFEWORD_ESLINT = existsSync(SAFEWORD_ESLINT);
const HAS_SAFEWORD_RUFF = existsSync(SAFEWORD_RUFF);
const HAS_SAFEWORD_GOLANGCI = existsSync(SAFEWORD_GOLANGCI);

/**
 * Lint a file based on its extension.
 * Uses safeword configs (.safeword/) for stricter LLM enforcement when available.
 *
 * - JS/TS: ESLint (--config if safeword config exists) + Prettier
 * - Python: Ruff check + Ruff format (--config if safeword config exists)
 * - Go: golangci-lint (--config if safeword config exists)
 * - Shell: shellcheck + Prettier
 * - Other: Prettier only
 *
 * @param file - Path to the file to lint
 * @param _projectDir - Project root directory (cached at module init, kept for backward compat)
 */
export async function lintFile(file: string, _projectDir: string): Promise<void> {
  const extension = file.split('.').pop()?.toLowerCase() ?? '';

  // JS/TS and framework files - ESLint first (fix code), then Prettier (format)
  if (JS_EXTENSIONS.has(extension)) {
    // Use safeword config if available for stricter LLM rules
    const eslintResult = HAS_SAFEWORD_ESLINT
      ? await $`bunx eslint --config ${SAFEWORD_ESLINT} --fix ${file}`.nothrow().quiet()
      : await $`bunx eslint --fix ${file}`.nothrow().quiet();

    if (eslintResult.exitCode !== 0 && eslintResult.stderr.length > 0) {
      console.log(eslintResult.stderr.toString());
    }
    await $`bunx prettier --write ${file}`.nothrow().quiet();
    return;
  }

  // Python files - Ruff check (fix code), then Ruff format
  // Skips gracefully if ruff is not installed
  if (PYTHON_EXTENSIONS.has(extension)) {
    if (HAS_SAFEWORD_RUFF) {
      await $`ruff check --config ${SAFEWORD_RUFF} --fix ${file}`.nothrow().quiet();
      await $`ruff format --config ${SAFEWORD_RUFF} ${file}`.nothrow().quiet();
    } else {
      await $`ruff check --fix ${file}`.nothrow().quiet();
      await $`ruff format ${file}`.nothrow().quiet();
    }
    return;
  }

  // Go files - golangci-lint run (fix code), then golangci-lint fmt (format)
  // Skips gracefully if golangci-lint is not installed
  if (GO_EXTENSIONS.has(extension)) {
    if (HAS_SAFEWORD_GOLANGCI) {
      await $`golangci-lint run --config ${SAFEWORD_GOLANGCI} --fix ${file}`.nothrow().quiet();
      await $`golangci-lint fmt --config ${SAFEWORD_GOLANGCI} ${file}`.nothrow().quiet();
    } else {
      await $`golangci-lint run --fix ${file}`.nothrow().quiet();
      await $`golangci-lint fmt ${file}`.nothrow().quiet();
    }
    return;
  }

  // Other supported formats - prettier only
  if (PRETTIER_EXTENSIONS.has(extension)) {
    await $`bunx prettier --write ${file}`.nothrow().quiet();
    return;
  }

  // Shell scripts - shellcheck (if available), then Prettier (if plugin installed)
  if (SHELL_EXTENSIONS.has(extension)) {
    const shellcheckResult = await $`bunx shellcheck ${file}`.nothrow().quiet();
    if (shellcheckResult.exitCode !== 0 && shellcheckResult.stderr.length > 0) {
      console.log(shellcheckResult.stderr.toString());
    }
    if (existsSync(`${projectDir}/node_modules/prettier-plugin-sh`)) {
      await $`bunx prettier --write ${file}`.nothrow().quiet();
    }
  }
}
