/**
 * Framework detection utilities for safeword ESLint preset
 *
 * Single source of truth for package detection. Used by:
 * - Generated eslint.config.mjs at lint time
 * - CLI's project-detector at init time
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * TanStack Query package names across all supported frameworks.
 */
const TANSTACK_QUERY_PACKAGES = [
  '@tanstack/react-query',
  '@tanstack/vue-query',
  '@tanstack/solid-query',
  '@tanstack/svelte-query',
  '@tanstack/angular-query-experimental',
] as const;

/**
 * Tailwind CSS package names (v3 and v4 installation methods).
 */
const TAILWIND_PACKAGES = ['tailwindcss', '@tailwindcss/vite', '@tailwindcss/postcss'] as const;

/**
 * Playwright test package names.
 */
const PLAYWRIGHT_PACKAGES = ['@playwright/test', 'playwright'] as const;

/**
 * Non-Prettier formatter config files (Biome, dprint, Rome).
 * Used to detect if project uses an alternative formatter.
 * Prettier is safeword's default, so its presence doesn't skip config creation.
 */
const ALTERNATIVE_FORMATTER_FILES = [
  // Biome (and legacy Rome)
  'biome.json',
  'biome.jsonc',
  'rome.json',
  // dprint
  'dprint.json',
  '.dprint.json',
  'dprint.jsonc',
  '.dprint.jsonc',
] as const;

type DepsRecord = Record<string, string | undefined>;
type ScriptsRecord = Record<string, string | undefined>;

/**
 * Read dependencies from a package.json file.
 */
function readPackageDeps(pkgPath: string): DepsRecord {
  try {
    if (!existsSync(pkgPath)) return {};
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return { ...pkg.dependencies, ...pkg.devDependencies };
  } catch {
    return {};
  }
}

/**
 * Get workspace patterns from root package.json.
 */
function getWorkspacePatternsFromPackage(rootPackagePath: string): string[] {
  try {
    const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
    if (Array.isArray(rootPackage.workspaces)) {
      return rootPackage.workspaces;
    }
    if (rootPackage.workspaces?.packages) {
      return rootPackage.workspaces.packages;
    }
  } catch {
    // No workspaces defined
  }
  return [];
}

/**
 * Scan a workspace directory for package.json files.
 */
function scanWorkspaceDirectory(rootDirectory: string, pattern: string): DepsRecord {
  if (!pattern.endsWith('/*')) return {};

  const baseDirectory = path.join(rootDirectory, pattern.slice(0, -2));
  if (!existsSync(baseDirectory)) return {};

  const allDeps: DepsRecord = {};
  try {
    const entries = readdirSync(baseDirectory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        Object.assign(
          allDeps,
          readPackageDeps(path.join(baseDirectory, entry.name, 'package.json')),
        );
      }
    }
  } catch {
    // Ignore read errors
  }
  return allDeps;
}

/**
 * Collect all dependencies from root and workspace package.json files.
 * Supports npm/yarn workspaces and common monorepo patterns.
 */
function collectAllDeps(rootDirectory: string): DepsRecord {
  const rootPackagePath = path.join(rootDirectory, 'package.json');
  const allDeps = readPackageDeps(rootPackagePath);

  // Get patterns from workspaces config + common monorepo directories
  const workspacePatterns = getWorkspacePatternsFromPackage(rootPackagePath);
  const commonPatterns = ['apps/*', 'packages/*'];
  const patterns = [...new Set([...workspacePatterns, ...commonPatterns])];

  // Scan each workspace pattern
  for (const pattern of patterns) {
    Object.assign(allDeps, scanWorkspaceDirectory(rootDirectory, pattern));
  }

  return allDeps;
}

/**
 * Check if Tailwind CSS is installed.
 */
function hasTailwind(deps: DepsRecord): boolean {
  return TAILWIND_PACKAGES.some(pkg => pkg in deps);
}

/**
 * Check if TanStack Query is installed.
 */
function hasTanstackQuery(deps: DepsRecord): boolean {
  return TANSTACK_QUERY_PACKAGES.some(pkg => pkg in deps);
}

/**
 * Check if Vitest is installed.
 */
function hasVitest(deps: DepsRecord): boolean {
  return 'vitest' in deps;
}

/**
 * Check if Playwright is installed.
 */
function hasPlaywright(deps: DepsRecord): boolean {
  return PLAYWRIGHT_PACKAGES.some(pkg => pkg in deps);
}

/**
 * Detect base framework for config selection.
 * Returns the most specific framework detected.
 */
function detectFramework(
  deps: DepsRecord,
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
function getIgnores(deps: DepsRecord): string[] {
  const ignores = ['**/node_modules/', '**/dist/', '**/build/', '**/coverage/'];
  if ('next' in deps) ignores.push('**/.next/');
  if ('astro' in deps) ignores.push('**/.astro/');
  return ignores;
}

/**
 * Check if project has an existing linter setup.
 * True if package.json has a "lint" script.
 */
function hasExistingLinter(scripts: ScriptsRecord): boolean {
  return 'lint' in scripts;
}

/**
 * Check if project has an existing NON-PRETTIER formatter setup.
 * Only returns true for Biome, dprint, or Rome - not Prettier.
 *
 * We don't check for "format" script because safeword adds that script itself.
 * We don't check for Prettier configs because Prettier is safeword's default formatter.
 */
function hasExistingFormatter(cwd: string, _scripts: ScriptsRecord): boolean {
  // Only check for non-Prettier formatter config files
  return ALTERNATIVE_FORMATTER_FILES.some(file => existsSync(path.join(cwd, file)));
}

/**
 * All detection utilities bundled together.
 */
export const detect = {
  // Package lists
  TAILWIND_PACKAGES,
  TANSTACK_QUERY_PACKAGES,
  PLAYWRIGHT_PACKAGES,
  ALTERNATIVE_FORMATTER_FILES,

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
