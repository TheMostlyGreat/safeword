/**
 * Tests for ESLint configs - Story 2: Config Loads and Lints
 *
 * Verifies that configs:
 * - Load without errors
 * - Contain expected plugins
 * - Lint valid code without errors
 * - Catch invalid code with expected errors
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */

import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import plugin from '../../index.js';
import { recommended } from '../recommended.js';
import { recommendedTypeScript } from '../recommended-typescript.js';

describe('recommended config', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(recommended)).toBe(true);
    expect(recommended.length).toBeGreaterThan(0);
  });

  it('includes expected plugins', () => {
    const configNames = recommended.flatMap(config => {
      if (typeof config === 'object' && config !== null) {
        // Check for plugin registrations
        if ('plugins' in config && config.plugins) {
          return Object.keys(config.plugins);
        }
        // Check for config names
        if ('name' in config && typeof config.name === 'string') {
          return [config.name];
        }
      }
      return [];
    });

    // Should include our safeword plugin
    expect(configNames).toContain('safeword');
  });

  it('loads without errors via ESLint API', () => {
    const linter = new Linter({ configType: 'flat' });

    // Verify config can be used - this will throw if invalid
    expect(() => {
      linter.verify('const x = 1;', recommended);
    }).not.toThrow();
  });

  it('returns no errors for valid code', () => {
    const linter = new Linter({ configType: 'flat' });

    // Simple valid code - uses export to avoid no-unused-vars
    const validCode = `
export const add = (a, b) => a + b;
`;

    const results = linter.verify(validCode, recommended, { filename: 'test.mjs' });
    const errors = results.filter(r => r.severity === 2);

    expect(errors).toHaveLength(0);
  });

  it('returns errors for invalid code', () => {
    const linter = new Linter({ configType: 'flat' });

    // Code with security issue - eval with expression
    const invalidCode = `
const userInput = 'alert(1)';
eval(userInput);
`;

    const results = linter.verify(invalidCode, recommended);
    const errors = results.filter(r => r.severity === 2);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('catches incomplete error handling', () => {
    const linter = new Linter({ configType: 'flat' });

    const code = `
try {
  doSomething();
} catch (error) {
  console.error(error);
}
`;

    const results = linter.verify(code, recommended);
    const safewordErrors = results.filter(
      r => r.ruleId === 'safeword/no-incomplete-error-handling',
    );

    expect(safewordErrors.length).toBe(1);
  });
});

describe('recommendedTypeScript config', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(recommendedTypeScript)).toBe(true);
    expect(recommendedTypeScript.length).toBeGreaterThan(0);
  });

  it('includes TypeScript plugins', () => {
    const hasTypeScriptConfig = recommendedTypeScript.some(config => {
      if (typeof config === 'object' && config !== null) {
        // Check for @typescript-eslint rules
        if ('rules' in config && config.rules) {
          return Object.keys(config.rules).some(rule => rule.startsWith('@typescript-eslint/'));
        }
        // Check for typescript-eslint plugin
        if ('plugins' in config && config.plugins) {
          return '@typescript-eslint' in config.plugins;
        }
      }
      return false;
    });

    expect(hasTypeScriptConfig).toBe(true);
  });

  it('includes projectService for type-checked rules', () => {
    const hasProjectService = recommendedTypeScript.some(config => {
      if (typeof config === 'object' && config !== null && 'languageOptions' in config) {
        const langOpts = config.languageOptions;
        if (langOpts && typeof langOpts === 'object' && 'parserOptions' in langOpts) {
          const parserOpts = langOpts.parserOptions;
          return parserOpts && typeof parserOpts === 'object' && 'projectService' in parserOpts;
        }
      }
      return false;
    });

    expect(hasProjectService).toBe(true);
  });

  it('scopes TypeScript rules to .ts/.tsx files', () => {
    const hasTsFileScope = recommendedTypeScript.some(config => {
      if (typeof config === 'object' && config !== null && 'files' in config) {
        const files = config.files;
        if (Array.isArray(files)) {
          return files.some(
            f => typeof f === 'string' && (f.includes('.ts') || f.includes('.tsx')),
          );
        }
      }
      return false;
    });

    expect(hasTsFileScope).toBe(true);
  });

  it('loads without errors via ESLint API', () => {
    const linter = new Linter({ configType: 'flat' });

    // For type-checked rules, we need to use the config in a way that
    // doesn't require actual type information (Linter API limitation)
    expect(() => {
      // Just verify the config is valid ESLint config format
      linter.verify('const x: number = 1;', recommendedTypeScript, {
        filename: 'test.ts',
      });
    }).not.toThrow();
  });
});

describe('plugin exports', () => {
  it('exports default plugin object', () => {
    expect(plugin).toBeDefined();
    expect(typeof plugin).toBe('object');
  });

  it('has meta with name and version', () => {
    expect(plugin.meta).toBeDefined();
    expect(plugin.meta.name).toBe('eslint-plugin-safeword');
    expect(plugin.meta.version).toBeDefined();
  });

  it('exports configs.recommended', () => {
    expect(plugin.configs).toBeDefined();
    expect(plugin.configs.recommended).toBeDefined();
    expect(Array.isArray(plugin.configs.recommended)).toBe(true);
  });

  it('exports configs.recommendedTypeScript', () => {
    expect(plugin.configs.recommendedTypeScript).toBeDefined();
    expect(Array.isArray(plugin.configs.recommendedTypeScript)).toBe(true);
  });

  it('exports rules', () => {
    expect(plugin.rules).toBeDefined();
    expect(plugin.rules['no-incomplete-error-handling']).toBeDefined();
  });
});

describe('default ignores', () => {
  it('includes node_modules in ignores', () => {
    const hasNodeModulesIgnore = recommended.some(config => {
      if (typeof config === 'object' && config !== null && 'ignores' in config) {
        const ignores = config.ignores;
        if (Array.isArray(ignores)) {
          return ignores.some(
            pattern => typeof pattern === 'string' && pattern.includes('node_modules'),
          );
        }
      }
      return false;
    });

    expect(hasNodeModulesIgnore).toBe(true);
  });

  it('includes dist in ignores', () => {
    const hasDistIgnore = recommended.some(config => {
      if (typeof config === 'object' && config !== null && 'ignores' in config) {
        const ignores = config.ignores;
        if (Array.isArray(ignores)) {
          return ignores.some(pattern => typeof pattern === 'string' && pattern.includes('dist'));
        }
      }
      return false;
    });

    expect(hasDistIgnore).toBe(true);
  });
});
