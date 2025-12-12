/**
 * Tests for React ESLint config - Story 7: React Support
 *
 * Verifies that the React config:
 * - Loads without errors
 * - Includes react and react-hooks plugins
 * - Has correct rule severities configured
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-assignment, security/detect-object-injection, jsdoc/require-returns, jsdoc/require-param-description */

import { describe, expect, it } from 'vitest';

import { recommendedTypeScriptReact } from '../recommended-react.js';

const ERROR = 2;

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

describe('recommendedTypeScriptReact config', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(recommendedTypeScriptReact)).toBe(true);
    expect(recommendedTypeScriptReact.length).toBeGreaterThan(0);
  });

  it('includes react-hooks plugin', () => {
    const hasReactHooks = recommendedTypeScriptReact.some(
      config =>
        typeof config === 'object' &&
        config !== null &&
        'plugins' in config &&
        config.plugins &&
        'react-hooks' in config.plugins,
    );
    expect(hasReactHooks).toBe(true);
  });
});

describe('React hook rules (config severity)', () => {
  it('react-hooks/rules-of-hooks is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptReact, 'react-hooks/rules-of-hooks');
    expect(getSeverity(config)).toBe(ERROR);
  });

  it('react-hooks/exhaustive-deps is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptReact, 'react-hooks/exhaustive-deps');
    expect(getSeverity(config)).toBe(ERROR);
  });
});

describe('React JSX rules (config severity)', () => {
  it('react/jsx-key is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptReact, 'react/jsx-key');
    expect(getSeverity(config)).toBe(ERROR);
  });

  it('react/jsx-no-duplicate-props is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptReact, 'react/jsx-no-duplicate-props');
    expect(getSeverity(config)).toBe(ERROR);
  });

  it('react/no-direct-mutation-state is at error severity', () => {
    const config = getRuleConfig(recommendedTypeScriptReact, 'react/no-direct-mutation-state');
    expect(getSeverity(config)).toBe(ERROR);
  });

  it('react/prop-types is off (TypeScript handles this)', () => {
    const config = getRuleConfig(recommendedTypeScriptReact, 'react/prop-types');
    expect(getSeverity(config)).toBe(0);
  });

  it('react/react-in-jsx-scope is off (React 17+)', () => {
    const config = getRuleConfig(recommendedTypeScriptReact, 'react/react-in-jsx-scope');
    expect(getSeverity(config)).toBe(0);
  });
});
