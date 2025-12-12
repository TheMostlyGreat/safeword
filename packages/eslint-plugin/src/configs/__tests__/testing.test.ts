/**
 * Tests for Test Linting configs - Story 10: Vitest + Playwright
 *
 * Verifies that test configs:
 * - Include appropriate plugins
 * - Target test file patterns
 * - Have correct rule severities (error except no-skipped-test)
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, security/detect-object-injection, jsdoc/require-returns, jsdoc/require-param-description */

import { describe, expect, it } from 'vitest';

import { playwrightConfig } from '../playwright.js';
import { vitestConfig } from '../vitest.js';

const ERROR = 2;
const WARN = 1;

/**
 * Get the final rule config from a flat config array.
 * @param config
 * @param ruleId
 */
function getRuleConfig(config: any[], ruleId: string): unknown {
  for (let index = config.length - 1; index >= 0; index--) {
    const c = config[index];
    if (c && typeof c === 'object' && 'rules' in c && c.rules && ruleId in c.rules) {
      return c.rules[ruleId];
    }
  }
  return undefined;
}

/**
 * Get severity from rule config.
 * @param ruleConfig
 */
function getSeverity(ruleConfig: unknown): number {
  if (typeof ruleConfig === 'number') return ruleConfig;
  if (typeof ruleConfig === 'string') {
    if (ruleConfig === 'error') return 2;
    if (ruleConfig === 'warn') return 1;
    return 0;
  }
  if (Array.isArray(ruleConfig) && ruleConfig.length > 0) {
    return getSeverity(ruleConfig[0]);
  }
  return 0;
}

/**
 * Get all rules from a flat config array.
 * @param config
 */
function getAllRules(config: any[]): Record<string, unknown> {
  const rules: Record<string, unknown> = {};
  for (const c of config) {
    if (c && typeof c === 'object' && 'rules' in c && c.rules) {
      Object.assign(rules, c.rules);
    }
  }
  return rules;
}

// ============ VITEST CONFIG ============

describe('vitestConfig', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(vitestConfig)).toBe(true);
    expect(vitestConfig.length).toBeGreaterThan(0);
  });

  it('includes vitest plugin', () => {
    const hasVitest = vitestConfig.some(
      config =>
        typeof config === 'object' &&
        config !== null &&
        'plugins' in config &&
        config.plugins &&
        'vitest' in config.plugins,
    );
    expect(hasVitest).toBe(true);
  });

  it('targets test files', () => {
    const hasTestFilePattern = vitestConfig.some(
      config =>
        typeof config === 'object' &&
        config !== null &&
        'files' in config &&
        Array.isArray(config.files) &&
        config.files.some((f: string) => f.includes('.test.') || f.includes('.spec.')),
    );
    expect(hasTestFilePattern).toBe(true);
  });
});

describe('Vitest critical rules at error', () => {
  it('vitest/expect-expect is at error', () => {
    expect(getSeverity(getRuleConfig(vitestConfig, 'vitest/expect-expect'))).toBe(ERROR);
  });

  it('vitest/no-focused-tests is at error', () => {
    expect(getSeverity(getRuleConfig(vitestConfig, 'vitest/no-focused-tests'))).toBe(ERROR);
  });

  it('vitest/no-identical-title is at error', () => {
    expect(getSeverity(getRuleConfig(vitestConfig, 'vitest/no-identical-title'))).toBe(ERROR);
  });

  it('vitest/valid-expect is at error', () => {
    expect(getSeverity(getRuleConfig(vitestConfig, 'vitest/valid-expect'))).toBe(ERROR);
  });
});

// ============ PLAYWRIGHT CONFIG ============

describe('playwrightConfig', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(playwrightConfig)).toBe(true);
    expect(playwrightConfig.length).toBeGreaterThan(0);
  });

  it('includes playwright plugin', () => {
    const hasPlaywright = playwrightConfig.some(
      config =>
        typeof config === 'object' &&
        config !== null &&
        'plugins' in config &&
        config.plugins &&
        'playwright' in config.plugins,
    );
    expect(hasPlaywright).toBe(true);
  });

  it('targets test files', () => {
    const hasTestFilePattern = playwrightConfig.some(
      config =>
        typeof config === 'object' &&
        config !== null &&
        'files' in config &&
        Array.isArray(config.files) &&
        config.files.some(
          (f: string) => f.includes('.test.') || f.includes('.spec.') || f.includes('.e2e.'),
        ),
    );
    expect(hasTestFilePattern).toBe(true);
  });
});

describe('Playwright critical rules at error', () => {
  it('playwright/expect-expect is at error', () => {
    expect(getSeverity(getRuleConfig(playwrightConfig, 'playwright/expect-expect'))).toBe(ERROR);
  });

  it('playwright/no-focused-test is at error', () => {
    expect(getSeverity(getRuleConfig(playwrightConfig, 'playwright/no-focused-test'))).toBe(ERROR);
  });

  it('playwright/valid-expect is at error', () => {
    expect(getSeverity(getRuleConfig(playwrightConfig, 'playwright/valid-expect'))).toBe(ERROR);
  });

  it('playwright/no-wait-for-timeout is at error', () => {
    expect(getSeverity(getRuleConfig(playwrightConfig, 'playwright/no-wait-for-timeout'))).toBe(
      ERROR,
    );
  });

  it('playwright/no-page-pause is at error', () => {
    expect(getSeverity(getRuleConfig(playwrightConfig, 'playwright/no-page-pause'))).toBe(ERROR);
  });
});

describe('Playwright no-skipped-test exception', () => {
  it('playwright/no-skipped-test stays at warn (TDD exception)', () => {
    expect(getSeverity(getRuleConfig(playwrightConfig, 'playwright/no-skipped-test'))).toBe(WARN);
  });
});

describe('Playwright no other warnings (except no-skipped-test)', () => {
  it('no playwright rules at warn except no-skipped-test', () => {
    const allRules = getAllRules(playwrightConfig);
    const rulesAtWarn = Object.entries(allRules)
      .filter(([ruleId]) => ruleId.startsWith('playwright/'))
      .filter(
        ([ruleId, config]) =>
          ruleId !== 'playwright/no-skipped-test' && getSeverity(config) === WARN,
      );

    expect(rulesAtWarn).toEqual([]);
  });
});
