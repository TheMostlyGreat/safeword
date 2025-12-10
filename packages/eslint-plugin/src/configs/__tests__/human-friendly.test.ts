/**
 * Tests for human-friendly config - Story 6: Human-Friendly
 *
 * Verifies that clean idiomatic code produces 0 errors, 0 warnings.
 * Opinionated rules that annoy humans are turned off.
 */

import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { recommended } from '../recommended.js';

const jsLinter = new Linter({ configType: 'flat' });

/**
 * Lint JS code and return all messages.
 * @param code - Source code to lint
 */
function lintJs(code: string) {
  return jsLinter.verify(code, recommended, { filename: 'test.mjs' });
}

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/strict-boolean-expressions, security/detect-object-injection -- ESLint config types vary across plugins */
/**
 * Get the final rule config from a flat config array.
 * @param config - Array of ESLint flat config objects
 * @param ruleId - Rule ID to find
 * @returns The rule configuration or undefined
 */
function getRuleConfig(config: any[], ruleId: string): unknown {
  for (let i = config.length - 1; i >= 0; i--) {
    const c = config[i];
    if (c && typeof c === 'object' && 'rules' in c && c.rules && ruleId in c.rules) {
      return c.rules[ruleId];
    }
  }
  return undefined;
}

/**
 * Assert a rule is turned off in the config.
 * @param config - ESLint flat config array
 * @param ruleId - Rule ID to check
 */
function expectRuleOff(config: any[], ruleId: string): void {
  const ruleConfig = getRuleConfig(config, ruleId);
  const severity = Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig;
  expect(severity === 'off' || severity === 0).toBe(true);
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/strict-boolean-expressions, security/detect-object-injection */

describe('Story 6: Human-Friendly', () => {
  describe('opinionated unicorn rules are off', () => {
    it('unicorn/no-null is off (null is valid JS)', () => {
      expectRuleOff(recommended, 'unicorn/no-null');
    });

    it('unicorn/prevent-abbreviations is off (ctx, dir, pkg are standard)', () => {
      expectRuleOff(recommended, 'unicorn/prevent-abbreviations');
    });

    it('unicorn/no-array-for-each is off (forEach is fine)', () => {
      expectRuleOff(recommended, 'unicorn/no-array-for-each');
    });
  });

  describe('clean idiomatic code produces 0 errors, 0 warnings', () => {
    it('uses null, abbreviations, and forEach without issues', () => {
      // Code that would trigger errors if opinionated rules were on
      const code = `/**
 * Process items and return results.
 * @param ctx - Context object
 * @param items - Items to process
 * @returns Processed results or null
 */
export function processItems(ctx, items) {
  if (!ctx || !items) {
    return null; // unicorn/no-null would error here
  }

  const results = [];
  items.forEach((item) => { // unicorn/no-array-for-each would error here
    if (item.enabled) {
      results.push(item.value);
    }
  });

  return results.length > 0 ? results : null;
}

// Common abbreviations that are standard
export const pkg = { name: 'test' }; // unicorn/prevent-abbreviations would error
export const ctx = { user: 'admin' };
export const dir = '/tmp';
export const err = new Error('test');
`;
      const messages = lintJs(code);
      const errors = messages.filter(m => m.severity === 2);
      const warnings = messages.filter(m => m.severity === 1);

      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    it('modern JS patterns lint cleanly', () => {
      // Clean modern JS that should pass all rules
      const code = `/**
 * Calculate total from items.
 * @param items - Items with prices
 * @returns Total price
 */
export function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

/**
 * Format currency value.
 * @param value - Numeric value
 * @returns Formatted string
 */
export function formatCurrency(value) {
  return \`$\${value.toFixed(2)}\`;
}
`;
      const messages = lintJs(code);
      const errors = messages.filter(m => m.severity === 2);
      const warnings = messages.filter(m => m.severity === 1);

      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });
  });
});
