/**
 * Unit tests for content templates
 */

import { describe, expect, it } from 'vitest';

import type { ProjectType } from '../utils/project-detector';
import { getEslintConfig } from './config';
import { getPrettierConfig } from './content';

const baseProjectType: ProjectType = {
  typescript: false,
  react: false,
  nextjs: false,
  astro: false,
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

  it('should include prettier-plugin-tailwindcss for Tailwind projects', () => {
    const projectType = { ...baseProjectType, tailwind: true };
    const config = JSON.parse(getPrettierConfig(projectType));

    expect(config.plugins).toContain('prettier-plugin-tailwindcss');
  });

  it('should include multiple plugins for combined frameworks', () => {
    const projectType = { ...baseProjectType, astro: true, tailwind: true };
    const config = JSON.parse(getPrettierConfig(projectType));

    expect(config.plugins).toContain('prettier-plugin-astro');
    expect(config.plugins).toContain('prettier-plugin-tailwindcss');
    expect(config.plugins).toHaveLength(2);
  });

  it('should put tailwind plugin last (required for proper class sorting)', () => {
    const projectType = { ...baseProjectType, astro: true, shell: true, tailwind: true };
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

describe('getEslintConfig', () => {
  it('should use import.meta.url for config-relative path resolution (not CWD)', () => {
    // This test documents a critical fix: the ESLint config must resolve package.json
    // relative to the config file location, NOT relative to process.cwd().
    // When lint-staged runs from a subdirectory in a monorepo, CWD-relative resolution
    // would read the wrong package.json and fail to find framework ESLint plugins.
    const config = getEslintConfig();

    // Must use import.meta.url pattern for config-relative resolution
    expect(config).toContain('import.meta.url');
    expect(config).toContain('fileURLToPath');
    expect(config).toContain('dirname');

    // Must NOT use CWD-relative path (the bug we fixed)
    expect(config).not.toMatch(/readFileSync\s*\(\s*["']\.\/package\.json["']/);
  });

  it('should import eslint-plugin-safeword', () => {
    const config = getEslintConfig();

    expect(config).toContain('import safeword from "eslint-plugin-safeword"');
    expect(config).toContain('safeword.configs');
  });

  it('should include framework detection for safeword config selection', () => {
    const config = getEslintConfig();

    // Config should detect frameworks and select appropriate safeword config
    expect(config).toContain('safeword.configs.recommendedTypeScriptNext');
    expect(config).toContain('safeword.configs.recommendedTypeScriptReact');
    expect(config).toContain('safeword.configs.recommendedTypeScript');
    expect(config).toContain('safeword.configs.recommended');
  });

  it('should include vitest and playwright configs', () => {
    const config = getEslintConfig();

    expect(config).toContain('safeword.configs.vitest');
    expect(config).toContain('safeword.configs.playwright');
  });
});
