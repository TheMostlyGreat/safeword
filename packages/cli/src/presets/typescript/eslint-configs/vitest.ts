/**
 * ESLint configuration for Vitest tests
 *
 * Applies to test files: *.test.ts, *.spec.ts
 * Enforces test best practices for LLM-generated tests.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages */

import vitestPlugin from "eslint-plugin-vitest";

/**
 * Vitest test linting config
 *
 * Includes recommended rules plus no-focused-tests.
 * All rules at error severity.
 */
export const vitestConfig: any[] = [
  {
    name: "safeword/vitest",
    files: ["**/*.test.{ts,tsx,js,jsx}", "**/*.spec.{ts,tsx,js,jsx}"],
    plugins: {
      vitest: vitestPlugin,
    },
    rules: {
      // Recommended rules (all at error)
      // Allow expect* helper functions (e.g., expectErrorSeverity) as assertion functions
      "vitest/expect-expect": [
        "error",
        { assertFunctionNames: ["expect", "expect*"] },
      ],
      "vitest/no-identical-title": "error",
      "vitest/no-commented-out-tests": "error",
      "vitest/valid-title": "error",
      "vitest/valid-expect": ["error", { maxArgs: 2 }], // Allow custom message: expect(value, 'message')
      "vitest/valid-describe-callback": "error",
      "vitest/require-local-test-context-for-concurrent-snapshots": "error",
      "vitest/no-import-node-test": "error",

      // Additional strict rules
      "vitest/no-focused-tests": "error", // No .only() in CI
      "vitest/max-nested-describe": ["error", { max: 5 }], // Limit describe nesting depth

      // Relax base rules for test files - each override has documented justification:
      //
      // no-empty-function: Tests often need empty callbacks for mocks/stubs:
      //   const mockFn = vi.fn(() => {});  // Valid mock with no implementation
      //   await expect(action).rejects.toThrow(); // Empty catch in expect wrapper
      "@typescript-eslint/no-empty-function": "off",
      //
      // detect-non-literal-fs-filename: Tests read fixtures from known safe paths:
      //   const fixture = readFileSync(join(__dirname, 'fixtures', testCase.input));
      // Test fixtures are developer-controlled, not user input.
      "security/detect-non-literal-fs-filename": "off",
      // Disable max-nested-callbacks for tests - it flags .filter()/.some() inside it() blocks
      // which is a false positive. Use vitest/max-nested-describe for test structure instead.
      "max-nested-callbacks": "off",
    },
  },
];
