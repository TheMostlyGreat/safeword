/**
 * Tests for ESLint warning severity - Story 5: Warns on Suspicious
 *
 * Verifies that suspicious-but-not-bug rules are at warning severity (1)
 * so humans can review them without blocking CI.
 */

import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { recommended } from '../recommended.js';

const WARN = 1;

const jsLinter = new Linter({ configType: 'flat' });

/**
 * Lint JS code and return messages for a specific rule.
 * @param code - Source code to lint
 * @param ruleId - Rule ID to filter for
 */
function lintJs(code: string, ruleId: string) {
  const results = jsLinter.verify(code, recommended, { filename: 'test.mjs' });
  return results.filter(r => r.ruleId === ruleId);
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
 * Assert a rule is configured at warning severity in the config.
 * @param config - ESLint flat config array
 * @param ruleId - Rule ID to check
 */
function expectWarnSeverity(config: any[], ruleId: string): void {
  const ruleConfig = getRuleConfig(config, ruleId);
  expect(ruleConfig).toBeDefined();
  const severity = Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig;
  expect(severity === 'warn' || severity === WARN).toBe(true);
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/strict-boolean-expressions, security/detect-object-injection */

describe('Story 5: Warns on Suspicious', () => {
  describe('security rules with high false-positive rate (recommended)', () => {
    it('security/detect-object-injection warns on bracket notation', () => {
      // This often triggers false positives on normal object access
      const code = `const key = 'prop';
const obj = { prop: 1 };
const value = obj[key];
export { value };
`;
      const warnings = lintJs(code, 'security/detect-object-injection');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].severity).toBe(WARN);
    });

    it('security/detect-possible-timing-attacks is configured at warn severity', () => {
      // This rule only triggers on specific patterns (password/secret comparisons)
      // We verify config severity instead of runtime detection
      expectWarnSeverity(recommended, 'security/detect-possible-timing-attacks');
    });

    it('security/detect-buffer-noassert is configured at warn severity', () => {
      expectWarnSeverity(recommended, 'security/detect-buffer-noassert');
    });

    it('security/detect-new-buffer is configured at warn severity', () => {
      expectWarnSeverity(recommended, 'security/detect-new-buffer');
    });

    it('security/detect-pseudoRandomBytes is configured at warn severity', () => {
      expectWarnSeverity(recommended, 'security/detect-pseudoRandomBytes');
    });
  });

  describe('confirms warning vs error distinction', () => {
    it('security/detect-eval-with-expression is error (not warn)', () => {
      // Confirm dangerous rules stay at error
      const code = `const userInput = 'code';
eval(userInput);
`;
      const errors = lintJs(code, 'security/detect-eval-with-expression');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(2); // ERROR, not WARN
    });
  });
});
