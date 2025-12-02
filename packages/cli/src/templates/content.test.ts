/**
 * Unit tests for content templates
 */

import { describe, it, expect } from 'vitest';
import { getPrettierConfig } from './content';
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
