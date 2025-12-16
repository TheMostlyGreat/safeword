/**
 * Project type detection from package.json
 *
 * Detects frameworks and tools used in the project to configure
 * appropriate linting rules.
 */

import { readdirSync } from 'node:fs';
import nodePath from 'node:path';

import { detect } from 'eslint-plugin-safeword';

// Re-export detection constants from eslint-plugin-safeword (single source of truth)
export const {
  TAILWIND_PACKAGES,
  TANSTACK_QUERY_PACKAGES,
  PLAYWRIGHT_PACKAGES,
  FORMATTER_CONFIG_FILES,
  hasExistingLinter,
  hasExistingFormatter,
} = detect;

export interface PackageJson {
  name?: string;
  version?: string;
  private?: boolean;
  main?: string;
  module?: string;
  exports?: unknown;
  types?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface ProjectType {
  typescript: boolean;
  react: boolean;
  nextjs: boolean;
  astro: boolean;
  vitest: boolean;
  playwright: boolean;
  tailwind: boolean;
  tanstackQuery: boolean;
  publishableLibrary: boolean;
  shell: boolean;
  /** True if project has existing lint script or linter config */
  existingLinter: boolean;
  /** True if project has existing format script or formatter config */
  existingFormatter: boolean;
}

/**
 * Checks if a directory contains any .sh files up to specified depth.
 * Excludes node_modules and .git directories.
 * @param cwd
 * @param maxDepth
 */
export function hasShellScripts(cwd: string, maxDepth = 4): boolean {
  const excludeDirectories = new Set(['node_modules', '.git', '.safeword']);

  /**
   *
   * @param dir
   * @param depth
   */
  function scan(dir: string, depth: number): boolean {
    if (depth > maxDepth) return false;

    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.sh')) {
          return true;
        }
        if (
          entry.isDirectory() &&
          !excludeDirectories.has(entry.name) &&
          scan(nodePath.join(dir, entry.name), depth + 1)
        ) {
          return true;
        }
      }
    } catch {
      // Ignore permission errors
    }
    return false;
  }

  return scan(cwd, 0);
}

export interface PackageJsonWithScripts extends PackageJson {
  scripts?: Record<string, string>;
}

/**
 * Detects project type from package.json contents and optional file scanning
 * @param packageJson - Package.json contents including scripts
 * @param cwd - Working directory for file-based detection
 */
export function detectProjectType(packageJson: PackageJsonWithScripts, cwd?: string): ProjectType {
  const deps = packageJson.dependencies || {};
  const developmentDeps = packageJson.devDependencies || {};
  const allDeps = { ...deps, ...developmentDeps };
  const scripts = packageJson.scripts || {};

  const hasTypescript = 'typescript' in allDeps;
  const hasReact = 'react' in deps || 'react' in developmentDeps;
  const hasNextJs = 'next' in deps;
  const hasAstro = 'astro' in deps || 'astro' in developmentDeps;
  const hasVitest = 'vitest' in developmentDeps;
  const hasPlaywright = '@playwright/test' in developmentDeps;
  // Tailwind v4 can be installed via tailwindcss, @tailwindcss/vite, or @tailwindcss/postcss
  const hasTailwind = TAILWIND_PACKAGES.some(pkg => pkg in allDeps);

  // TanStack Query detection
  const hasTanstackQuery = TANSTACK_QUERY_PACKAGES.some(pkg => pkg in allDeps);

  // Publishable library: has entry points and is not marked private
  const hasEntryPoints = !!(packageJson.main || packageJson.module || packageJson.exports);
  const isPublishable = hasEntryPoints && packageJson.private !== true;

  // Shell scripts: detected by scanning for .sh files
  const hasShell = cwd ? hasShellScripts(cwd) : false;

  // Generic tooling detection: detect intent, not specific tools
  const hasLinter = hasExistingLinter(scripts);
  const hasFormatter = cwd ? hasExistingFormatter(cwd, scripts) : 'format' in scripts;

  return {
    typescript: hasTypescript,
    react: hasReact || hasNextJs, // Next.js implies React
    nextjs: hasNextJs,
    astro: hasAstro,
    vitest: hasVitest,
    playwright: hasPlaywright,
    tailwind: hasTailwind,
    tanstackQuery: hasTanstackQuery,
    publishableLibrary: isPublishable,
    shell: hasShell,
    existingLinter: hasLinter,
    existingFormatter: hasFormatter,
  };
}
