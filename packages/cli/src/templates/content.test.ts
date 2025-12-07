/**
 * Unit tests for content templates
 */

import { describe, it, expect } from 'vitest';
import { getPrettierConfig, getLintStagedConfig } from './content';
import { getEslintConfig } from './config';
import type { ProjectType } from '../utils/project-detector';

const baseProjectType: ProjectType = {
  typescript: false,
  react: false,
  nextjs: false,
  astro: false,
  vue: false,
  nuxt: false,
  svelte: false,
  sveltekit: false,
  electron: false,
  vitest: false,
  playwright: false,
  tailwind: false,
  publishableLibrary: false,
  shell: false,
};

describe('getPrettierConfig', () => {
  it('should return base config without plugins for vanilla project', () => {
    const config = JSON.parse(getPrettierConfig(baseProjectType));

    expect(config.semi).toBe(true);
    expect(config.singleQuote).toBe(true);
    expect(config.tabWidth).toBe(2);
    expect(config.plugins).toBeUndefined();
  });

  it('should include prettier-plugin-astro for Astro projects', () => {
    const projectType = { ...baseProjectType, astro: true };
    const config = JSON.parse(getPrettierConfig(projectType));

    expect(config.plugins).toContain('prettier-plugin-astro');
  });

  it('should include prettier-plugin-svelte for Svelte projects', () => {
    const projectType = { ...baseProjectType, svelte: true };
    const config = JSON.parse(getPrettierConfig(projectType));

    expect(config.plugins).toContain('prettier-plugin-svelte');
  });

  it('should include prettier-plugin-tailwindcss for Tailwind projects', () => {
    const projectType = { ...baseProjectType, tailwind: true };
    const config = JSON.parse(getPrettierConfig(projectType));

    expect(config.plugins).toContain('prettier-plugin-tailwindcss');
  });

  it('should include multiple plugins for combined frameworks', () => {
    const projectType = { ...baseProjectType, svelte: true, tailwind: true };
    const config = JSON.parse(getPrettierConfig(projectType));

    expect(config.plugins).toContain('prettier-plugin-svelte');
    expect(config.plugins).toContain('prettier-plugin-tailwindcss');
    expect(config.plugins).toHaveLength(2);
  });

  it('should put tailwind plugin last (required for proper class sorting)', () => {
    const projectType = { ...baseProjectType, astro: true, svelte: true, tailwind: true };
    const config = JSON.parse(getPrettierConfig(projectType));

    const tailwindIndex = config.plugins.indexOf('prettier-plugin-tailwindcss');
    expect(tailwindIndex).toBe(config.plugins.length - 1);
  });

  it('should not include plugins for React/TypeScript (native Prettier support)', () => {
    const projectType = { ...baseProjectType, react: true, typescript: true };
    const config = JSON.parse(getPrettierConfig(projectType));

    expect(config.plugins).toBeUndefined();
  });
});

describe('getLintStagedConfig', () => {
  it('should not include shell pattern when shell is false', () => {
    const config = getLintStagedConfig(baseProjectType);

    expect(config['*.sh']).toBeUndefined();
    expect(config['*.md']).toBeDefined();
  });

  it('should include shell pattern when shell is true', () => {
    const projectType = { ...baseProjectType, shell: true };
    const config = getLintStagedConfig(projectType);

    expect(config['*.sh']).toEqual(['shellcheck', 'prettier --write']);
  });
});

describe('getEslintConfig', () => {
  it('should use import.meta.url for config-relative path resolution (not CWD)', () => {
    // This test documents a critical fix: the ESLint config must resolve package.json
    // relative to the config file location, NOT relative to process.cwd().
    // When lint-staged runs from a subdirectory in a monorepo, CWD-relative resolution
    // would read the wrong package.json and fail to find framework ESLint plugins.
    const config = getEslintConfig({ boundaries: false });

    // Must use import.meta.url pattern for config-relative resolution
    expect(config).toContain('import.meta.url');
    expect(config).toContain('fileURLToPath');
    expect(config).toContain('dirname');

    // Must NOT use CWD-relative path (the bug we fixed)
    expect(config).not.toMatch(/readFileSync\s*\(\s*["']\.\/package\.json["']/);
  });

  it('should include tryImport helper for graceful plugin loading errors', () => {
    const config = getEslintConfig({ boundaries: false });

    // Must have tryImport helper that provides actionable error messages
    expect(config).toContain('async function tryImport');
    expect(config).toContain('ERR_MODULE_NOT_FOUND');
    expect(config).toContain('npm install -D');
  });

  it('should include boundaries config when option is true', () => {
    const config = getEslintConfig({ boundaries: true });

    expect(config).toContain('boundariesConfig');
    expect(config).toContain('.safeword/eslint-boundaries.config.mjs');
  });

  it('should exclude boundaries config when option is false', () => {
    const config = getEslintConfig({ boundaries: false });

    expect(config).not.toContain('boundariesConfig');
    expect(config).not.toContain('eslint-boundaries.config.mjs');
  });
});
