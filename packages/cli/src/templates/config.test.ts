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
  });

  it('should import eslint-plugin-safeword and destructure detect/configs', () => {
    const config = getEslintConfig();

    expect(config).toContain('import safeword from "eslint-plugin-safeword"');
    expect(config).toContain('const { detect, configs } = safeword');
  });

  it('should use detect.collectAllDeps for dependency scanning', () => {
    const config = getEslintConfig();

    expect(config).toContain('detect.collectAllDeps(__dirname)');
    expect(config).toContain('detect.detectFramework(deps)');
  });

  it('should include framework detection for config selection', () => {
    const config = getEslintConfig();

    // Config should have baseConfigs mapping
    expect(config).toContain('configs.recommendedTypeScriptNext');
    expect(config).toContain('configs.recommendedTypeScriptReact');
    expect(config).toContain('configs.recommendedTypeScript');
    expect(config).toContain('configs.recommended');
    expect(config).toContain('baseConfigs[framework]');
  });

  it('should use detect helpers for optional configs', () => {
    const config = getEslintConfig();

    expect(config).toContain('detect.hasVitest(deps)');
    expect(config).toContain('detect.hasPlaywright(deps)');
    expect(config).toContain('detect.hasTailwind(deps)');
    expect(config).toContain('detect.hasTanstackQuery(deps)');
  });

  it('should use detect.getIgnores for dynamic ignores', () => {
    const config = getEslintConfig();

    expect(config).toContain('detect.getIgnores(deps)');
  });

  it('should include eslint-config-prettier for standard config', () => {
    const config = getEslintConfig(false);

    expect(config).toContain('eslintConfigPrettier');
  });

  it('should NOT include eslint-config-prettier for biome config', () => {
    const config = getEslintConfig(true);

    expect(config).not.toContain('eslintConfigPrettier');
  });
});
