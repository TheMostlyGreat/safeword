/**
 * Tests for TanStack Query ESLint config
 *
 * Verifies that the TanStack Query config:
 * - Includes the @tanstack/query plugin
 * - Has all 7 rules configured at error severity
 * - Exports correctly from the plugin
 */

import { describe, expect, it } from 'vitest';

import { tanstackQueryConfig } from '../tanstack-query.js';
import { getAllRules, getRuleConfig, getSeverityNumber } from './test-utilities.js';

const ERROR = 2;

describe('tanstackQueryConfig', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(tanstackQueryConfig)).toBe(true);
    expect(tanstackQueryConfig.length).toBeGreaterThan(0);
  });

  it('includes @tanstack/query plugin', () => {
    const hasPlugin = tanstackQueryConfig.some(
      (config) =>
        typeof config === 'object' &&
        config !== null &&
        'plugins' in config &&
        config.plugins &&
        '@tanstack/query' in config.plugins,
    );
    expect(hasPlugin).toBe(true);
  });
});

describe('TanStack Query rules at error severity', () => {
  it('@tanstack/query/exhaustive-deps is at error', () => {
    expect(
      getSeverityNumber(getRuleConfig(tanstackQueryConfig, '@tanstack/query/exhaustive-deps')),
    ).toBe(ERROR);
  });

  it('@tanstack/query/stable-query-client is at error', () => {
    expect(
      getSeverityNumber(getRuleConfig(tanstackQueryConfig, '@tanstack/query/stable-query-client')),
    ).toBe(ERROR);
  });

  it('@tanstack/query/no-void-query-fn is at error', () => {
    expect(
      getSeverityNumber(getRuleConfig(tanstackQueryConfig, '@tanstack/query/no-void-query-fn')),
    ).toBe(ERROR);
  });

  it('@tanstack/query/no-rest-destructuring is at error', () => {
    expect(
      getSeverityNumber(
        getRuleConfig(tanstackQueryConfig, '@tanstack/query/no-rest-destructuring'),
      ),
    ).toBe(ERROR);
  });

  it('@tanstack/query/no-unstable-deps is at error', () => {
    expect(
      getSeverityNumber(getRuleConfig(tanstackQueryConfig, '@tanstack/query/no-unstable-deps')),
    ).toBe(ERROR);
  });

  it('@tanstack/query/infinite-query-property-order is at error', () => {
    expect(
      getSeverityNumber(
        getRuleConfig(tanstackQueryConfig, '@tanstack/query/infinite-query-property-order'),
      ),
    ).toBe(ERROR);
  });

  it('@tanstack/query/mutation-property-order is at error', () => {
    expect(
      getSeverityNumber(
        getRuleConfig(tanstackQueryConfig, '@tanstack/query/mutation-property-order'),
      ),
    ).toBe(ERROR);
  });
});

describe('TanStack Query has all 7 rules configured', () => {
  it('has exactly 7 @tanstack/query rules', () => {
    const allRules = getAllRules(tanstackQueryConfig);
    const queryRules = Object.keys(allRules).filter((rule) => rule.startsWith('@tanstack/query/'));
    expect(queryRules).toHaveLength(7);
  });

  it('all rules are at error severity (no warnings)', () => {
    const allRules = getAllRules(tanstackQueryConfig);
    const rulesNotAtError = Object.entries(allRules)
      .filter(([ruleId]) => ruleId.startsWith('@tanstack/query/'))
      .filter(([, config]) => getSeverityNumber(config) !== ERROR);

    expect(rulesNotAtError).toEqual([]);
  });
});
