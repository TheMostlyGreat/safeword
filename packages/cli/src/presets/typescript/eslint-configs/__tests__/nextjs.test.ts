/**
 * Tests for Next.js ESLint config - Story 8: Next.js Support
 *
 * Verifies that the Next.js config:
 * - Extends React config (inherits hooks + JSX rules)
 * - Includes @next/eslint-plugin-next
 * - All rules at error severity (LLMs ignore warnings)
 */

import { describe, expect, it } from 'vitest';

import { recommendedTypeScriptNext } from '../recommended-nextjs.js';
import { getAllRules, getRuleConfig, getSeverityNumber } from './test-utilities.js';

const ERROR = 2;
const WARN = 1;

describe('recommendedTypeScriptNext config', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(recommendedTypeScriptNext)).toBe(true);
    expect(recommendedTypeScriptNext.length).toBeGreaterThan(0);
  });

  it('includes @next/next plugin', () => {
    const hasNextPlugin = recommendedTypeScriptNext.some(
      (config) =>
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
      (config) =>
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
    expect(getSeverityNumber(config)).toBe(ERROR);
  });
});

describe('Next.js critical rules at error severity', () => {
  it('@next/next/no-img-element is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptNext, '@next/next/no-img-element');
    expect(getSeverityNumber(config)).toBe(ERROR);
  });

  it('@next/next/no-html-link-for-pages is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptNext, '@next/next/no-html-link-for-pages');
    expect(getSeverityNumber(config)).toBe(ERROR);
  });

  it('@next/next/no-head-element is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptNext, '@next/next/no-head-element');
    expect(getSeverityNumber(config)).toBe(ERROR);
  });

  it('@next/next/no-sync-scripts is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptNext, '@next/next/no-sync-scripts');
    expect(getSeverityNumber(config)).toBe(ERROR);
  });
});

describe('No warnings allowed (LLMs ignore warnings)', () => {
  it('no @next/next rules are at warn severity', () => {
    const allRules = getAllRules(recommendedTypeScriptNext);
    const nextRulesAtWarn = Object.entries(allRules)
      .filter(([ruleId]) => ruleId.startsWith('@next/next/'))
      .filter(([, config]) => getSeverityNumber(config) === WARN);

    expect(nextRulesAtWarn).toEqual([]);
  });
});
