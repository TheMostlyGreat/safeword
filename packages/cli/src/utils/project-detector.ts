/**
 * Project type detection from package.json
 *
 * Detects frameworks and tools used in the project to configure
 * appropriate linting rules.
 */

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
}

/**
 * Detects project type from package.json contents
 */
export function detectProjectType(packageJson: PackageJson): ProjectType {
  const deps = packageJson.dependencies || {};
  const devDeps = packageJson.devDependencies || {};
  const allDeps = { ...deps, ...devDeps };

  const hasTypescript = 'typescript' in allDeps;
  const hasReact = 'react' in deps || 'react' in devDeps;
  const hasNextJs = 'next' in deps;
  const hasAstro = 'astro' in deps || 'astro' in devDeps;
  const hasVue = 'vue' in deps || 'vue' in devDeps;
  const hasNuxt = 'nuxt' in deps;
  const hasSvelte = 'svelte' in deps || 'svelte' in devDeps;
  const hasSvelteKit = '@sveltejs/kit' in deps || '@sveltejs/kit' in devDeps;
  const hasElectron = 'electron' in deps || 'electron' in devDeps;
  const hasVitest = 'vitest' in devDeps;
  const hasPlaywright = '@playwright/test' in devDeps;
  const hasTailwind = 'tailwindcss' in allDeps;

  // Publishable library: has entry points and is not marked private
  const hasEntryPoints = !!(packageJson.main || packageJson.module || packageJson.exports);
  const isPublishable = hasEntryPoints && packageJson.private !== true;

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
  };
}
