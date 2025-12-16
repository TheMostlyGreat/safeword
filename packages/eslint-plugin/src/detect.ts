/**
 * Framework detection utilities for eslint-plugin-safeword
 *
 * Single source of truth for package detection. Used by:
 * - Generated eslint.config.mjs at lint time
 * - CLI's project-detector at init time
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * TanStack Query package names across all supported frameworks.
 */
export const TANSTACK_QUERY_PACKAGES = [
  '@tanstack/react-query',
  '@tanstack/vue-query',
  '@tanstack/solid-query',
  '@tanstack/svelte-query',
  '@tanstack/angular-query-experimental',
] as const;

/**
 * Tailwind CSS package names (v3 and v4 installation methods).
 */
export const TAILWIND_PACKAGES = [
  'tailwindcss',
  '@tailwindcss/vite',
  '@tailwindcss/postcss',
] as const;

/**
 * Playwright test package names.
 */
export const PLAYWRIGHT_PACKAGES = ['@playwright/test', 'playwright'] as const;

/**
 * Known formatter config files.
 * If any exist, user likely has their own formatter setup.
 */
export const FORMATTER_CONFIG_FILES = [
  // Biome
  'biome.json',
  'biome.jsonc',
  // dprint
  'dprint.json',
  // Rome (legacy, now Biome)
  'rome.json',
  // Prettier (we check this too - if they have prettier config, don't reinstall)
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.yaml',
  '.prettierrc.yml',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.mjs',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
] as const;

export type DepsRecord = Record<string, string | undefined>;
export type ScriptsRecord = Record<string, string | undefined>;

/**
 * Collect all dependencies from root and workspace package.json files.
 * Supports npm/yarn workspaces and common monorepo patterns.
 */
export function collectAllDeps(rootDir: string): DepsRecord {
  const allDeps: DepsRecord = {};

  const mergeDeps = (pkgPath: string): void => {
    try {
      if (!existsSync(pkgPath)) return;
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      Object.assign(allDeps, pkg.dependencies, pkg.devDependencies);
    } catch {
      // Ignore invalid package.json files
    }
  };

  // Read root package.json
  const rootPkgPath = join(rootDir, 'package.json');
  mergeDeps(rootPkgPath);

  // Check for workspaces (npm/yarn/pnpm)
  let workspacePatterns: string[] = [];
  try {
    const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'));
    if (Array.isArray(rootPkg.workspaces)) {
      workspacePatterns = rootPkg.workspaces;
    } else if (rootPkg.workspaces?.packages) {
      workspacePatterns = rootPkg.workspaces.packages;
    }
  } catch {
    // No workspaces defined
  }

  // Also check common monorepo directories even without workspaces config
  const commonPatterns = ['apps/*', 'packages/*'];
  const patterns = [...new Set([...workspacePatterns, ...commonPatterns])];

  // Scan workspace directories (simple glob: only supports "dir/*" patterns)
  for (const pattern of patterns) {
    if (!pattern.endsWith('/*')) continue;
    const baseDir = join(rootDir, pattern.slice(0, -2));
    if (!existsSync(baseDir)) continue;
    try {
      const entries = readdirSync(baseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          mergeDeps(join(baseDir, entry.name, 'package.json'));
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return allDeps;
}

/**
 * Check if Tailwind CSS is installed.
 */
export function hasTailwind(deps: DepsRecord): boolean {
  return TAILWIND_PACKAGES.some(pkg => pkg in deps);
}

/**
 * Check if TanStack Query is installed.
 */
export function hasTanstackQuery(deps: DepsRecord): boolean {
  return TANSTACK_QUERY_PACKAGES.some(pkg => pkg in deps);
}

/**
 * Check if Vitest is installed.
 */
export function hasVitest(deps: DepsRecord): boolean {
  return 'vitest' in deps;
}

/**
 * Check if Playwright is installed.
 */
export function hasPlaywright(deps: DepsRecord): boolean {
  return PLAYWRIGHT_PACKAGES.some(pkg => pkg in deps);
}

/**
 * Detect base framework for config selection.
 * Returns the most specific framework detected.
 */
export function detectFramework(
  deps: DepsRecord
): 'next' | 'react' | 'astro' | 'typescript' | 'javascript' {
  if ('next' in deps) return 'next';
  if ('react' in deps) return 'react';
  if ('astro' in deps) return 'astro';
  if ('typescript' in deps || 'typescript-eslint' in deps) return 'typescript';
  return 'javascript';
}

/**
 * Get dynamic ignores based on detected frameworks.
 */
export function getIgnores(deps: DepsRecord): string[] {
  const ignores = ['**/node_modules/', '**/dist/', '**/build/', '**/coverage/'];
  if ('next' in deps) ignores.push('.next/');
  if ('astro' in deps) ignores.push('.astro/');
  return ignores;
}

/**
 * Check if project has an existing linter setup.
 * True if package.json has a "lint" script.
 */
export function hasExistingLinter(scripts: ScriptsRecord): boolean {
  return 'lint' in scripts;
}

/**
 * Check if project has an existing formatter setup.
 * True if package.json has a "format" script OR any formatter config file exists.
 */
export function hasExistingFormatter(cwd: string, scripts: ScriptsRecord): boolean {
  // Check for format script
  if ('format' in scripts) return true;

  // Check for formatter config files
  return FORMATTER_CONFIG_FILES.some(file => existsSync(join(cwd, file)));
}

/**
 * All detection utilities bundled together.
 */
export const detect = {
  // Package lists
  TAILWIND_PACKAGES,
  TANSTACK_QUERY_PACKAGES,
  PLAYWRIGHT_PACKAGES,
  FORMATTER_CONFIG_FILES,

  // Core utilities
  collectAllDeps,
  detectFramework,
  getIgnores,

  // Feature detection
  hasTailwind,
  hasTanstackQuery,
  hasVitest,
  hasPlaywright,

  // Existing tooling detection
  hasExistingLinter,
  hasExistingFormatter,
};

export default detect;
