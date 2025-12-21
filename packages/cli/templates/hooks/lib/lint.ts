// Shared linting logic for Claude Code and Cursor hooks
// Used by: post-tool-lint.ts, cursor/after-file-edit.ts

import { existsSync } from 'node:fs';

import { $ } from 'bun';

// File extensions for different linting strategies
const JS_EXTENSIONS = new Set(['js', 'jsx', 'ts', 'tsx', 'mjs', 'mts', 'cjs', 'cts', 'vue', 'svelte', 'astro']);
const PRETTIER_EXTENSIONS = new Set(['md', 'json', 'css', 'scss', 'html', 'yaml', 'yml', 'graphql']);

/**
 * Lint a file based on its extension.
 * Runs ESLint + Prettier for JS/TS, Prettier only for other formats,
 * and shellcheck + Prettier for shell scripts.
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

  // Other supported formats - prettier only
  if (PRETTIER_EXTENSIONS.has(extension)) {
    await $`npx prettier --write ${file}`.nothrow().quiet();
    return;
  }

  // Shell scripts - shellcheck (if available), then Prettier (if plugin installed)
  if (extension === 'sh') {
    const shellcheckResult = await $`npx shellcheck ${file}`.nothrow().quiet();
    if (shellcheckResult.exitCode !== 0 && shellcheckResult.stderr.length > 0) {
      console.log(shellcheckResult.stderr.toString());
    }
    if (existsSync(`${projectDir}/node_modules/prettier-plugin-sh`)) {
      await $`npx prettier --write ${file}`.nothrow().quiet();
    }
  }
}
