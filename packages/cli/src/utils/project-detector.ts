/**
 * Project type detection from package.json
 *
 * Detects frameworks and tools used in the project to configure
 * appropriate linting rules.
 */

import { readdirSync } from 'node:fs';
import nodePath from 'node:path';

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
  vue: boolean;
  nuxt: boolean;
  svelte: boolean;
  sveltekit: boolean;
  electron: boolean;
  vitest: boolean;
  playwright: boolean;
  tailwind: boolean;
  publishableLibrary: boolean;
  shell: boolean;
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

/**
 * Detects project type from package.json contents and optional file scanning
 * @param packageJson
 * @param cwd
 */
export function detectProjectType(packageJson: PackageJson, cwd?: string): ProjectType {
  const deps = packageJson.dependencies || {};
  const developmentDeps = packageJson.devDependencies || {};
  const allDeps = { ...deps, ...developmentDeps };

  const hasTypescript = 'typescript' in allDeps;
  const hasReact = 'react' in deps || 'react' in developmentDeps;
  const hasNextJs = 'next' in deps;
  const hasAstro = 'astro' in deps || 'astro' in developmentDeps;
  const hasVue = 'vue' in deps || 'vue' in developmentDeps;
  const hasNuxt = 'nuxt' in deps;
  const hasSvelte = 'svelte' in deps || 'svelte' in developmentDeps;
  const hasSvelteKit = '@sveltejs/kit' in deps || '@sveltejs/kit' in developmentDeps;
  const hasElectron = 'electron' in deps || 'electron' in developmentDeps;
  const hasVitest = 'vitest' in developmentDeps;
  const hasPlaywright = '@playwright/test' in developmentDeps;
  const hasTailwind = 'tailwindcss' in allDeps;

  // Publishable library: has entry points and is not marked private
  const hasEntryPoints = !!(packageJson.main || packageJson.module || packageJson.exports);
  const isPublishable = hasEntryPoints && packageJson.private !== true;

  // Shell scripts: detected by scanning for .sh files
  const hasShell = cwd ? hasShellScripts(cwd) : false;

  return {
    typescript: hasTypescript,
    react: hasReact || hasNextJs, // Next.js implies React
    nextjs: hasNextJs,
    astro: hasAstro,
    vue: hasVue || hasNuxt, // Nuxt implies Vue
    nuxt: hasNuxt,
    svelte: hasSvelte || hasSvelteKit, // SvelteKit implies Svelte
    sveltekit: hasSvelteKit,
    electron: hasElectron,
    vitest: hasVitest,
    playwright: hasPlaywright,
    tailwind: hasTailwind,
    publishableLibrary: isPublishable,
    shell: hasShell,
  };
}
