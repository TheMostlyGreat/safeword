/**
 * Project type detection from package.json
 *
 * Detects frameworks and tools used in the project to configure
 * appropriate linting rules.
 */

export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface ProjectType {
  typescript: boolean;
  react: boolean;
  nextjs: boolean;
  astro: boolean;
  electron: boolean;
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
  const hasElectron = 'electron' in deps || 'electron' in devDeps;

  return {
    typescript: hasTypescript,
    react: hasReact || hasNextJs, // Next.js implies React
    nextjs: hasNextJs,
    astro: hasAstro,
    electron: hasElectron,
  };
}
