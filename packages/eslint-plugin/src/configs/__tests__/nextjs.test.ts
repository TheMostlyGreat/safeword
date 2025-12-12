/**
 * Tests for Next.js ESLint config - Story 8: Next.js Support
 *
 * Verifies that the Next.js config:
 * - Extends React config (inherits hooks + JSX rules)
 * - Includes @next/eslint-plugin-next
 * - All rules at error severity (LLMs ignore warnings)
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-assignment, security/detect-object-injection, jsdoc/require-returns */

import { describe, expect, it } from 'vitest';

import { recommendedTypeScriptNext } from '../recommended-nextjs.js';

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

describe('recommendedTypeScriptNext config', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(recommendedTypeScriptNext)).toBe(true);
    expect(recommendedTypeScriptNext.length).toBeGreaterThan(0);
  });

  it('includes @next/next plugin', () => {
    const hasNextPlugin = recommendedTypeScriptNext.some(
      config =>
        typeof config === 'object' &&
        config !== null &&
        'plugins' in config &&
        config.plugins &&
        '@next/next' in config.plugins,
    );
    expect(hasNextPlugin).toBe(true);
  });
});

describe('Next.js inherits React config', () => {
  it('includes react-hooks plugin', () => {
    const hasReactHooks = recommendedTypeScriptNext.some(
      config =>
        typeof config === 'object' &&
        config !== null &&
        'plugins' in config &&
        config.plugins &&
        'react-hooks' in config.plugins,
    );
    expect(hasReactHooks).toBe(true);
  });

  it('react-hooks/rules-of-hooks is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptNext, 'react-hooks/rules-of-hooks');
    expect(getSeverity(config)).toBe(ERROR);
  });
});

describe('Next.js critical rules at error severity', () => {
  it('@next/next/no-img-element is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptNext, '@next/next/no-img-element');
    expect(getSeverity(config)).toBe(ERROR);
  });

  it('@next/next/no-html-link-for-pages is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptNext, '@next/next/no-html-link-for-pages');
    expect(getSeverity(config)).toBe(ERROR);
  });

  it('@next/next/no-head-element is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptNext, '@next/next/no-head-element');
    expect(getSeverity(config)).toBe(ERROR);
  });

  it('@next/next/no-sync-scripts is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptNext, '@next/next/no-sync-scripts');
    expect(getSeverity(config)).toBe(ERROR);
  });
});

describe('No warnings allowed (LLMs ignore warnings)', () => {
  it('no @next/next rules are at warn severity', () => {
    const allRules = getAllRules(recommendedTypeScriptNext);
    const nextRulesAtWarn = Object.entries(allRules)
      .filter(([ruleId]) => ruleId.startsWith('@next/next/'))
      .filter(([, config]) => getSeverity(config) === WARN);

    expect(nextRulesAtWarn).toEqual([]);
  });
});
