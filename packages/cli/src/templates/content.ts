/**
 * Content templates - static string content
 *
 * Note: Most templates (SAFEWORD.md, hooks, skills, guides, etc.) are now
 * file-based in the templates/ directory. This file contains only small
 * string constants that are used inline.
 */

import type { ProjectType } from '../utils/project-detector.js';

export const AGENTS_MD_LINK = `**⚠️ ALWAYS READ FIRST:** \`.safeword/SAFEWORD.md\`

The SAFEWORD.md file contains core development patterns, workflows, and conventions.
Read it BEFORE working on any task in this project.

---`;

interface PrettierConfig {
  semi: boolean;
  singleQuote: boolean;
  tabWidth: number;
  trailingComma: string;
  printWidth: number;
  endOfLine: string;
  useTabs: boolean;
  bracketSpacing: boolean;
  arrowParens: string;
  plugins?: string[];
}

/**
 * Generate .prettierrc content based on project type.
 * Explicitly lists plugins to ensure compatibility with pnpm/Yarn PnP.
 * @param projectType
 */
export function getPrettierConfig(projectType: ProjectType): string {
  const config: PrettierConfig = {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    printWidth: 100,
    endOfLine: 'lf',
    useTabs: false,
    bracketSpacing: true,
    arrowParens: 'avoid',
  };

  const plugins: string[] = [];

  if (projectType.astro) plugins.push('prettier-plugin-astro');
  if (projectType.shell) plugins.push('prettier-plugin-sh');
  // Tailwind must be last for proper class sorting
  if (projectType.tailwind) plugins.push('prettier-plugin-tailwindcss');

  if (plugins.length > 0) {
    config.plugins = plugins;
  }

  return `${JSON.stringify(config, undefined, 2)}\n`;
}

/**
 * Generate lint-staged configuration based on project type.
 * Only includes shell patterns when shell scripts are detected.
 *
 * SYNC: Keep file patterns in sync with post-tool-lint.sh in:
 *   packages/cli/templates/hooks/post-tool-lint.sh
 * @param projectType
 */
export function getLintStagedConfig(projectType: ProjectType): Record<string, string[]> {
  const config: Record<string, string[]> = {
    '*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}': ['eslint --fix', 'prettier --write'],
    '*.astro': ['eslint --fix', 'prettier --write'],
    '*.{json,css,scss,html,yaml,yml,graphql}': ['prettier --write'],
    '*.md': ['markdownlint-cli2 --fix', 'prettier --write'],
  };

  if (projectType.shell) {
    config['*.sh'] = ['shellcheck', 'prettier --write'];
  }

  return config;
}
