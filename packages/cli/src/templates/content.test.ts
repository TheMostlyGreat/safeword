/**
 * Unit tests for content templates
 */

import { describe, expect, it } from 'vitest';

import { getEslintConfig } from './config';

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
