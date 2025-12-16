/**
 * Tests for TanStack Query ESLint config
 *
 * Verifies that the TanStack Query config:
 * - Includes the @tanstack/query plugin
 * - Has all 7 rules configured at error severity
 * - Exports correctly from the plugin
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, security/detect-object-injection, jsdoc/require-returns, jsdoc/require-param-description */

import { describe, expect, it } from 'vitest';

import { tanstackQueryConfig } from '../tanstack-query.js';

const ERROR = 2;

/**
 * Get the final rule config from a flat config array.
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

describe('tanstackQueryConfig', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(tanstackQueryConfig)).toBe(true);
    expect(tanstackQueryConfig.length).toBeGreaterThan(0);
  });

  it('includes @tanstack/query plugin', () => {
    const hasPlugin = tanstackQueryConfig.some(
      config =>
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
    expect(getSeverity(getRuleConfig(tanstackQueryConfig, '@tanstack/query/exhaustive-deps'))).toBe(
      ERROR,
    );
  });

  it('@tanstack/query/stable-query-client is at error', () => {
    expect(
      getSeverity(getRuleConfig(tanstackQueryConfig, '@tanstack/query/stable-query-client')),
    ).toBe(ERROR);
  });

  it('@tanstack/query/no-void-query-fn is at error', () => {
    expect(
      getSeverity(getRuleConfig(tanstackQueryConfig, '@tanstack/query/no-void-query-fn')),
    ).toBe(ERROR);
  });

  it('@tanstack/query/no-rest-destructuring is at error', () => {
    expect(
      getSeverity(getRuleConfig(tanstackQueryConfig, '@tanstack/query/no-rest-destructuring')),
    ).toBe(ERROR);
  });

  it('@tanstack/query/no-unstable-deps is at error', () => {
    expect(
      getSeverity(getRuleConfig(tanstackQueryConfig, '@tanstack/query/no-unstable-deps')),
    ).toBe(ERROR);
  });

  it('@tanstack/query/infinite-query-property-order is at error', () => {
    expect(
      getSeverity(
        getRuleConfig(tanstackQueryConfig, '@tanstack/query/infinite-query-property-order'),
      ),
    ).toBe(ERROR);
  });

  it('@tanstack/query/mutation-property-order is at error', () => {
    expect(
      getSeverity(getRuleConfig(tanstackQueryConfig, '@tanstack/query/mutation-property-order')),
    ).toBe(ERROR);
  });
});

describe('TanStack Query has all 7 rules configured', () => {
  it('has exactly 7 @tanstack/query rules', () => {
    const allRules = getAllRules(tanstackQueryConfig);
    const queryRules = Object.keys(allRules).filter(rule => rule.startsWith('@tanstack/query/'));
    expect(queryRules).toHaveLength(7);
  });

  it('all rules are at error severity (no warnings)', () => {
    const allRules = getAllRules(tanstackQueryConfig);
    const rulesNotAtError = Object.entries(allRules)
      .filter(([ruleId]) => ruleId.startsWith('@tanstack/query/'))
      .filter(([, config]) => getSeverity(config) !== ERROR);

    expect(rulesNotAtError).toEqual([]);
  });
});
