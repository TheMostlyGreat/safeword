/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/strict-boolean-expressions, sonarjs/function-return-type, security/detect-object-injection, jsdoc/require-param-description, jsdoc/require-returns */
import { describe, expect, it } from 'vitest';

import { tailwindConfig } from '../tailwind.js';

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

  it('includes eslint-plugin-tailwindcss', () => {
    const hasTailwindPlugin = tailwindConfig.some(
      (config: any) => config.plugins && 'tailwindcss' in config.plugins,
    );
    expect(hasTailwindPlugin).toBe(true);
  });

  describe('correctness rules (4 rules at error)', () => {
    it('tailwindcss/no-contradicting-classname is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'tailwindcss/no-contradicting-classname'),
      );
      expect(severity).toBe('error');
    });

    it('tailwindcss/no-custom-classname is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'tailwindcss/no-custom-classname'),
      );
      expect(severity).toBe('error');
    });

    it('tailwindcss/no-unnecessary-arbitrary-value is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'tailwindcss/no-unnecessary-arbitrary-value'),
      );
      expect(severity).toBe('error');
    });

    it('tailwindcss/enforces-negative-arbitrary-values is error', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'tailwindcss/enforces-negative-arbitrary-values'),
      );
      expect(severity).toBe('error');
    });
  });

  describe('style rules (2 rules at error)', () => {
    it('tailwindcss/classnames-order is error', () => {
      const severity = getSeverity(getRuleConfig(tailwindConfig, 'tailwindcss/classnames-order'));
      expect(severity).toBe('error');
    });

    it('tailwindcss/enforces-shorthand is error', () => {
      const severity = getSeverity(getRuleConfig(tailwindConfig, 'tailwindcss/enforces-shorthand'));
      expect(severity).toBe('error');
    });
  });

  describe('disabled rules', () => {
    it('tailwindcss/migration-from-tailwind-2 is off', () => {
      const severity = getSeverity(
        getRuleConfig(tailwindConfig, 'tailwindcss/migration-from-tailwind-2'),
      );
      expect(severity).toBe('off');
    });

    it('tailwindcss/no-arbitrary-value is off', () => {
      const severity = getSeverity(getRuleConfig(tailwindConfig, 'tailwindcss/no-arbitrary-value'));
      expect(severity).toBe('off');
    });
  });

  describe('no warn rules (LLMs ignore warnings)', () => {
    it('no tailwindcss rules are at warn severity', () => {
      const allRules = getAllRules(tailwindConfig);
      const tailwindRules = Object.entries(allRules).filter(([name]) =>
        name.startsWith('tailwindcss/'),
      );

      const warnRules = tailwindRules.filter(([, config]) => {
        const severity = getSeverity(config);
        return severity === 'warn' || severity === 1;
      });

      expect(warnRules).toEqual([]);
    });
  });

  describe('total rule count', () => {
    it('has exactly 8 tailwindcss rules configured', () => {
      const allRules = getAllRules(tailwindConfig);
      const tailwindRules = Object.keys(allRules).filter(name => name.startsWith('tailwindcss/'));

      // 6 enabled + 2 explicitly disabled = 8 total
      expect(tailwindRules.length).toBe(8);
    });
  });
});
