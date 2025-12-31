/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/strict-boolean-expressions, sonarjs/function-return-type, security/detect-object-injection, jsdoc/require-param-description, jsdoc/require-returns */
import { describe, expect, it } from 'vitest';

import { TAILWIND_FILES, tailwindConfig } from '../tailwind.js';

/**
 * Helper to get effective rule config from flat config array.
 * Returns the LAST match since ESLint flat config uses last-wins for rule resolution.
 * @param config
 * @param ruleId
 */
function getRuleConfig(config: any[], ruleId: string): any {
  let result: any;
  for (const configObject of config) {
    if (configObject.rules && ruleId in configObject.rules) {
      result = configObject.rules[ruleId];
    }
  }
  return result;
}

/**
 * Helper to extract severity from rule config
 * @param ruleConfig
 */
function getSeverity(ruleConfig: any): number | string | undefined {
  if (ruleConfig === undefined) return undefined;
  if (typeof ruleConfig === 'number') return ruleConfig;
  if (typeof ruleConfig === 'string') return ruleConfig;
  if (Array.isArray(ruleConfig)) return ruleConfig[0];
  return undefined;
}

/**
 * Collect all rules from config
 * @param config
 */
function getAllRules(config: any[]): Record<string, any> {
  const allRules: Record<string, any> = {};
  for (const configObject of config) {
    if (configObject.rules) {
      Object.assign(allRules, configObject.rules);
    }
  }
  return allRules;
}

describe('Tailwind config', () => {
  it('exports tailwindConfig as an array', () => {
    expect(Array.isArray(tailwindConfig)).toBe(true);
    expect(tailwindConfig.length).toBeGreaterThan(0);
  });

  it('includes eslint-plugin-better-tailwindcss', () => {
    const hasTailwindPlugin = tailwindConfig.some(
      (config: any) => config.plugins && 'better-tailwindcss' in config.plugins,
    );
    expect(hasTailwindPlugin).toBe(true);
  });

  it('exports TAILWIND_FILES constant', () => {
    expect(TAILWIND_FILES).toBeDefined();
    expect(Array.isArray(TAILWIND_FILES)).toBe(true);
    expect(TAILWIND_FILES[0]).toContain('jsx');
    expect(TAILWIND_FILES[0]).toContain('tsx');
    expect(TAILWIND_FILES[0]).toContain('astro');
    expect(TAILWIND_FILES[0]).toContain('html');
  });

  it('scopes rules to UI files', () => {
    const hasScopedConfig = tailwindConfig.some(
      (config: any) => config.files && config.name === 'safeword/tailwind',
    );
    expect(hasScopedConfig).toBe(true);
  });

  describe('correctness rules (3 rules at error)', () => {
    it('better-tailwindcss/no-conflicting-classes is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'better-tailwindcss/no-conflicting-classes'),
      );
      expect(severity).toBe('error');
    });

    it('better-tailwindcss/no-unregistered-classes is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'better-tailwindcss/no-unregistered-classes'),
      );
      expect(severity).toBe('error');
    });

    it('better-tailwindcss/no-restricted-classes is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'better-tailwindcss/no-restricted-classes'),
      );
      expect(severity).toBe('error');
    });
  });

  describe('style rules (8 rules at error)', () => {
    it('better-tailwindcss/enforce-consistent-class-order is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'better-tailwindcss/enforce-consistent-class-order'),
      );
      expect(severity).toBe('error');
    });

    it('better-tailwindcss/enforce-shorthand-classes is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'better-tailwindcss/enforce-shorthand-classes'),
      );
      expect(severity).toBe('error');
    });

    it('better-tailwindcss/no-duplicate-classes is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'better-tailwindcss/no-duplicate-classes'),
      );
      expect(severity).toBe('error');
    });

    it('better-tailwindcss/no-deprecated-classes is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'better-tailwindcss/no-deprecated-classes'),
      );
      expect(severity).toBe('error');
    });

    it('better-tailwindcss/enforce-consistent-line-wrapping is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'better-tailwindcss/enforce-consistent-line-wrapping'),
      );
      expect(severity).toBe('error');
    });

    it('better-tailwindcss/no-unnecessary-whitespace is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'better-tailwindcss/no-unnecessary-whitespace'),
      );
      expect(severity).toBe('error');
    });

    it('better-tailwindcss/enforce-consistent-variable-syntax is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'better-tailwindcss/enforce-consistent-variable-syntax'),
      );
      expect(severity).toBe('error');
    });

    it('better-tailwindcss/enforce-consistent-important-position is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'better-tailwindcss/enforce-consistent-important-position'),
      );
      expect(severity).toBe('error');
    });
  });

  describe('no warn rules (LLMs ignore warnings)', () => {
    it('no better-tailwindcss rules are at warn severity', () => {
      const allRules = getAllRules(tailwindConfig);
      const tailwindRules = Object.entries(allRules).filter(([name]) =>
        name.startsWith('better-tailwindcss/'),
      );

      const warnRules = tailwindRules.filter(([, config]) => {
        const severity = getSeverity(config);
        return severity === 'warn' || severity === 1;
      });

      expect(warnRules).toEqual([]);
    });
  });

  describe('total rule count', () => {
    it('has exactly 11 better-tailwindcss rules configured', () => {
      const allRules = getAllRules(tailwindConfig);
      const tailwindRules = Object.keys(allRules).filter(name =>
        name.startsWith('better-tailwindcss/'),
      );

      // 3 correctness + 8 stylistic = 11 total
      expect(tailwindRules.length).toBe(11);
    });
  });
});
