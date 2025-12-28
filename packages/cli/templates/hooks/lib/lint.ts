// Shared linting logic for Claude Code and Cursor hooks
// Used by: post-tool-lint.ts, cursor/after-file-edit.ts

import { existsSync } from 'node:fs';

import { $ } from 'bun';

// File extensions for different linting strategies
const JS_EXTENSIONS = new Set(['js', 'jsx', 'ts', 'tsx', 'mjs', 'mts', 'cjs', 'cts', 'vue', 'svelte', 'astro']);
const PYTHON_EXTENSIONS = new Set(['py', 'pyi']);
const GO_EXTENSIONS = new Set(['go']);
const SHELL_EXTENSIONS = new Set(['sh']);
const PRETTIER_EXTENSIONS = new Set(['md', 'json', 'css', 'scss', 'html', 'yaml', 'yml', 'graphql']);

/**
 * Lint a file based on its extension.
 * - JS/TS: ESLint + Prettier
 * - Python: Ruff check + Ruff format
 * - Go: golangci-lint run --fix + golangci-lint fmt
 * - Shell: shellcheck + Prettier
 * - Other: Prettier only
 *
 * @param file - Path to the file to lint
 * @param projectDir - Project root directory (for finding prettier-plugin-sh)
 */
export async function lintFile(file: string, projectDir: string): Promise<void> {
  const extension = file.split('.').pop()?.toLowerCase() ?? '';

  // JS/TS and framework files - ESLint first (fix code), then Prettier (format)
  if (JS_EXTENSIONS.has(extension)) {
    const eslintResult = await $`npx eslint --fix ${file}`.nothrow().quiet();
    if (eslintResult.exitCode !== 0 && eslintResult.stderr.length > 0) {
      console.log(eslintResult.stderr.toString());
    }
    await $`npx prettier --write ${file}`.nothrow().quiet();
    return;
  }

  // Python files - Ruff check (fix code), then Ruff format
  // Skips gracefully if ruff is not installed
  if (PYTHON_EXTENSIONS.has(extension)) {
    await $`ruff check --fix ${file}`.nothrow().quiet();
    await $`ruff format ${file}`.nothrow().quiet();
    return;
  }

  // Go files - golangci-lint run (fix code), then golangci-lint fmt (format)
  // Skips gracefully if golangci-lint is not installed
  if (GO_EXTENSIONS.has(extension)) {
    await $`golangci-lint run --fix ${file}`.nothrow().quiet();
    await $`golangci-lint fmt ${file}`.nothrow().quiet();
    return;
  }

  // Other supported formats - prettier only
  if (PRETTIER_EXTENSIONS.has(extension)) {
    await $`npx prettier --write ${file}`.nothrow().quiet();
    return;
  }

  // Shell scripts - shellcheck (if available), then Prettier (if plugin installed)
  if (SHELL_EXTENSIONS.has(extension)) {
    const shellcheckResult = await $`npx shellcheck ${file}`.nothrow().quiet();
    if (shellcheckResult.exitCode !== 0 && shellcheckResult.stderr.length > 0) {
      console.log(shellcheckResult.stderr.toString());
    }
    if (existsSync(`${projectDir}/node_modules/prettier-plugin-sh`)) {
      await $`npx prettier --write ${file}`.nothrow().quiet();
    }
  }
}
