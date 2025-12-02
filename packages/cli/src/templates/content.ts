/**
 * Content templates - static string content
 *
 * Note: Most templates (SAFEWORD.md, hooks, skills, guides, etc.) are now
 * file-based in the templates/ directory. This file contains only small
 * string constants that are used inline.
 */

import type { ProjectType } from '../utils/project-detector.js';

export const AGENTS_MD_LINK = `**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**

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
  plugins?: string[];
}

/**
 * Generate .prettierrc content based on project type.
 * Explicitly lists plugins to ensure compatibility with pnpm/Yarn PnP.
 */
export function getPrettierConfig(projectType: ProjectType): string {
  const config: PrettierConfig = {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5',
    printWidth: 100,
    endOfLine: 'lf',
  };

  const plugins: string[] = [];

  if (projectType.astro) plugins.push('prettier-plugin-astro');
  if (projectType.svelte) plugins.push('prettier-plugin-svelte');
  if (projectType.tailwind) plugins.push('prettier-plugin-tailwindcss');

  if (plugins.length > 0) {
    config.plugins = plugins;
  }

  return JSON.stringify(config, null, 2) + '\n';
}

/**
 * lint-staged configuration for pre-commit hooks
 * Runs linters only on staged files for fast commits
 *
 * SYNC: Keep file patterns in sync with post-tool-lint.sh in:
 *   packages/cli/templates/hooks/post-tool-lint.sh
 */
export const LINT_STAGED_CONFIG = {
  '*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}': ['eslint --fix', 'prettier --write'],
  '*.{vue,svelte,astro}': ['eslint --fix', 'prettier --write'],
  '*.{json,css,scss,html,yaml,yml,graphql}': ['prettier --write'],
  '*.md': ['markdownlint-cli2 --fix', 'prettier --write'],
};
