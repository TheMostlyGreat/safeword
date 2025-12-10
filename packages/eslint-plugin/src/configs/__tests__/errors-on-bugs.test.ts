/**
 * Tests for ESLint error severity - Story 4: Errors on Bugs
 *
 * Verifies that bug-catching rules are at error severity (2)
 * so LLMs must fix them before moving on.
 */

/* eslint-disable jsdoc/require-returns -- Test file with dynamic config introspection */

import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { recommended } from '../recommended.js';
import { recommendedTypeScript } from '../recommended-typescript.js';

const ERROR = 2;

const jsLinter = new Linter({ configType: 'flat' });

/**
 * Lint JS code and return errors for a specific rule.
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
 * Assert a rule is configured at error severity in the config.
 * @param config - ESLint flat config array
 * @param ruleId - Rule ID to check
 */
function expectErrorSeverity(config: any[], ruleId: string): void {
  const ruleConfig = getRuleConfig(config, ruleId);
  expect(ruleConfig).toBeDefined();
  const severity = Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig;
  expect(severity === 'error' || severity === ERROR).toBe(true);
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/strict-boolean-expressions, security/detect-object-injection */

describe('Story 4: Errors on Bugs', () => {
  describe('security rules (recommended)', () => {
    it('security/detect-eval-with-expression errors on dynamic eval', () => {
      const code = `const userInput = 'alert(1)';
eval(userInput);
`;
      const errors = lintJs(code, 'security/detect-eval-with-expression');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(ERROR);
    });

    it('security/detect-non-literal-regexp errors on dynamic regex', () => {
      const code = `const pattern = userInput;
const regex = new RegExp(pattern);
`;
      const errors = lintJs(code, 'security/detect-non-literal-regexp');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(ERROR);
    });

    it('security/detect-non-literal-fs-filename errors on dynamic file path', () => {
      const code = `import fs from 'node:fs';
const filePath = userInput;
fs.readFile(filePath, () => {});
`;
      const errors = lintJs(code, 'security/detect-non-literal-fs-filename');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(ERROR);
    });

    it('security/detect-child-process errors on require child_process', () => {
      // Note: This rule only triggers on require(), not ES module import
      const code = `const { exec } = require('child_process');
exec(cmd);
`;
      const errors = lintJs(code, 'security/detect-child-process');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(ERROR);
    });
  });

  describe('sonarjs rules (recommended)', () => {
    it('sonarjs/os-command errors on exec with variable', () => {
      // Note: security/detect-child-process only works with require(), not import
      const code = `import { exec } from 'node:child_process';
const cmd = 'rm -rf /';
exec(cmd);
`;
      const errors = lintJs(code, 'sonarjs/os-command');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(ERROR);
    });
  });

  describe('promise rules (recommended)', () => {
    it('promise/no-multiple-resolved errors on resolve after resolve', () => {
      const code = `new Promise((resolve, reject) => {
  resolve(1);
  resolve(2);
});
`;
      const errors = lintJs(code, 'promise/no-multiple-resolved');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(ERROR);
    });

    it('promise/no-nesting errors on nested promise', () => {
      const code = `Promise.resolve().then(() => {
  return Promise.resolve().then(() => {
    return 1;
  });
});
`;
      const errors = lintJs(code, 'promise/no-nesting');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(ERROR);
    });

    it('promise/valid-params errors on invalid Promise.all usage', () => {
      const code = `Promise.all(promise1, promise2);
`;
      const errors = lintJs(code, 'promise/valid-params');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(ERROR);
    });
  });

  describe('safeword rules (recommended)', () => {
    it('safeword/no-incomplete-error-handling errors on catch without rethrow', () => {
      const code = `try {
  doSomething();
} catch (error) {
  console.log(error);
}
`;
      const errors = lintJs(code, 'safeword/no-incomplete-error-handling');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(ERROR);
    });
  });

  describe('unicorn rules (recommended)', () => {
    it('unicorn/no-array-reduce errors on complex reduce', () => {
      // Note: Rule allows simple operations like `(acc, n) => acc + n`
      // Complex reduce with object manipulation triggers the rule
      const code = `const grouped = items.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {});
export { grouped };
`;
      const errors = lintJs(code, 'unicorn/no-array-reduce');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(ERROR);
    });
  });

  describe('sonarjs code quality rules (recommended)', () => {
    it('sonarjs/no-identical-expressions errors on copy-paste bugs', () => {
      const code = `const result = a === b && a === b;
export { result };
`;
      const errors = lintJs(code, 'sonarjs/no-identical-expressions');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(ERROR);
    });
  });

  describe('design constraint rules (recommended)', () => {
    it('max-depth errors on deeply nested code', () => {
      // Depth 5: if > if > if > if > if (exceeds max-depth 4)
      const code = `function deep(a, b, c, d, e) {
  if (a) {
    if (b) {
      if (c) {
        if (d) {
          if (e) {
            return true;
          }
        }
      }
    }
  }
  return false;
}
export { deep };
`;
      const errors = lintJs(code, 'max-depth');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(ERROR);
    });

    it('max-params errors on functions with too many parameters', () => {
      // 6 params exceeds max-params 5
      const code = `function tooMany(a, b, c, d, e, f) {
  return a + b + c + d + e + f;
}
export { tooMany };
`;
      const errors = lintJs(code, 'max-params');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe(ERROR);
    });
  });

  describe('typescript-eslint rules (recommendedTypeScript)', () => {
    // Type-checked rules require TypeScript's type system which isn't
    // available in standalone Linter. We verify config severity instead.

    it('@typescript-eslint/no-explicit-any is configured at error severity', () => {
      expectErrorSeverity(recommendedTypeScript, '@typescript-eslint/no-explicit-any');
    });

    it('@typescript-eslint/no-floating-promises is configured at error severity', () => {
      expectErrorSeverity(recommendedTypeScript, '@typescript-eslint/no-floating-promises');
    });

    it('@typescript-eslint/no-misused-promises is configured at error severity', () => {
      // Catches: if (promise) {} or passing promise to non-async callback
      expectErrorSeverity(recommendedTypeScript, '@typescript-eslint/no-misused-promises');
    });

    it('@typescript-eslint/await-thenable is configured at error severity', () => {
      // Catches: await 5 or await "string" (awaiting non-promises)
      expectErrorSeverity(recommendedTypeScript, '@typescript-eslint/await-thenable');
    });

    it('@typescript-eslint/require-await is configured at error severity', () => {
      // Catches: async function with no await (pointless async)
      expectErrorSeverity(recommendedTypeScript, '@typescript-eslint/require-await');
    });

    it('@typescript-eslint/no-unnecessary-condition is configured at error severity', () => {
      // Catches: redundant null checks due to LLM type blindness
      expectErrorSeverity(recommendedTypeScript, '@typescript-eslint/no-unnecessary-condition');
    });
  });
});
