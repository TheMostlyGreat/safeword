/**
 * Tests for Test Linting configs - Story 10: Vitest + Playwright
 *
 * Verifies that test configs:
 * - Include appropriate plugins
 * - Target test file patterns
 * - Have correct rule severities (error except no-skipped-test)
 */

import { describe, expect, it } from 'vitest';

import { playwrightConfig } from '../playwright.js';
import { vitestConfig } from '../vitest.js';
import { getAllRules, getRuleConfig, getSeverityNumber } from './test-utils.js';

const ERROR = 2;
const WARN = 1;

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
    expect(getSeverityNumber(getRuleConfig(vitestConfig, 'vitest/expect-expect'))).toBe(ERROR);
  });

  it('vitest/no-focused-tests is at error', () => {
    expect(getSeverityNumber(getRuleConfig(vitestConfig, 'vitest/no-focused-tests'))).toBe(ERROR);
  });

  it('vitest/no-identical-title is at error', () => {
    expect(getSeverityNumber(getRuleConfig(vitestConfig, 'vitest/no-identical-title'))).toBe(ERROR);
  });

  it('vitest/valid-expect is at error', () => {
    expect(getSeverityNumber(getRuleConfig(vitestConfig, 'vitest/valid-expect'))).toBe(ERROR);
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
    expect(getSeverityNumber(getRuleConfig(playwrightConfig, 'playwright/expect-expect'))).toBe(
      ERROR,
    );
  });

  it('playwright/no-focused-test is at error', () => {
    expect(getSeverityNumber(getRuleConfig(playwrightConfig, 'playwright/no-focused-test'))).toBe(
      ERROR,
    );
  });

  it('playwright/valid-expect is at error', () => {
    expect(getSeverityNumber(getRuleConfig(playwrightConfig, 'playwright/valid-expect'))).toBe(
      ERROR,
    );
  });

  it('playwright/no-wait-for-timeout is at error', () => {
    expect(
      getSeverityNumber(getRuleConfig(playwrightConfig, 'playwright/no-wait-for-timeout')),
    ).toBe(ERROR);
  });

  it('playwright/no-page-pause is at error', () => {
    expect(getSeverityNumber(getRuleConfig(playwrightConfig, 'playwright/no-page-pause'))).toBe(
      ERROR,
    );
  });
});

describe('Playwright no-skipped-test exception', () => {
  it('playwright/no-skipped-test stays at warn (TDD exception)', () => {
    expect(getSeverityNumber(getRuleConfig(playwrightConfig, 'playwright/no-skipped-test'))).toBe(
      WARN,
    );
  });
});

describe('Playwright no other warnings (except no-skipped-test)', () => {
  it('no playwright rules at warn except no-skipped-test', () => {
    const allRules = getAllRules(playwrightConfig);
    const rulesAtWarn = Object.entries(allRules)
      .filter(([ruleId]) => ruleId.startsWith('playwright/'))
      .filter(
        ([ruleId, config]) =>
          ruleId !== 'playwright/no-skipped-test' && getSeverityNumber(config) === WARN,
      );

    expect(rulesAtWarn).toEqual([]);
  });
});
