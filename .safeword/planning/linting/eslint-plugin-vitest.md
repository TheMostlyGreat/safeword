# @vitest/eslint-plugin

- **Version**: Latest 1.5.2 (dynamically imported when Vitest detected)
- **Preset**: `recommended` rules
- **Gotcha**: None - preset uses error severity for all rules
- **LLM-critical rules**: `expect-expect`, `no-focused-tests`, `no-conditional-expect`
- **Overrides**: None needed

## Why This Plugin Matters for LLMs

LLMs frequently make test mistakes that silently pass:

| LLM Behavior                       | Rule That Catches It     |
| ---------------------------------- | ------------------------ |
| Tests without assertions           | `expect-expect`          |
| Leaves `.only` in committed code   | `no-focused-tests`       |
| Conditional expects (flaky tests)  | `no-conditional-expect`  |
| Skips tests without explanation    | `no-disabled-tests`      |
| Imports from wrong test framework  | `no-import-node-test`    |
| Same test name in same describe    | `no-identical-title`     |
| Expect outside test block          | `no-standalone-expect`   |
| Comments out tests instead of skip | `no-commented-out-tests` |

## Recommended Rules (All at Error)

| Rule                              | Purpose                              |
| --------------------------------- | ------------------------------------ |
| `expect-expect`                   | Ensure tests have assertions         |
| `no-commented-out-tests`          | Don't comment out, use `.skip`       |
| `no-conditional-expect`           | Avoid conditional assertion logic    |
| `no-disabled-tests`               | Track skipped tests                  |
| `no-focused-tests`                | Prevent `.only` from being committed |
| `no-identical-title`              | Unique test names for debugging      |
| `no-import-node-test`             | Don't mix node:test with Vitest      |
| `no-mocks-import`                 | Don't import from `__mocks__`        |
| `no-standalone-expect`            | Expect must be inside test           |
| `prefer-called-exactly-once-with` | Use specific mock assertions         |

## Configuration

```javascript
// Vitest support (scoped to test files)
if (deps.vitest) {
  const vitest = await import("@vitest/eslint-plugin");
  configs.push({
    name: "vitest",
    files: [
      "**/*.test.{js,ts,jsx,tsx}",
      "**/*.spec.{js,ts,jsx,tsx}",
      "**/tests/**",
    ],
    plugins: { vitest: vitest.default },
    languageOptions: {
      globals: { ...vitest.default.environments.env.globals },
    },
    rules: { ...vitest.default.configs.recommended.rules },
  });
}
```

Key features:

- **Scoped to test files** - Only runs on `*.test.*`, `*.spec.*`, and `tests/` directories
- **Globals included** - Vitest globals like `describe`, `it`, `expect` are recognized
- **Conditional loading** - Only when `vitest` is in project dependencies

## LLM-Specific Concerns

### Tests Without Assertions

LLMs often generate tests that "pass" but test nothing:

```typescript
// LLM mistake: no actual assertion
it("should handle errors", async () => {
  const result = await doSomething();
  console.log(result); // No expect!
});
```

`expect-expect` catches this pattern.

### Focused Tests Left in Code

LLMs sometimes leave `.only` when iterating:

```typescript
// LLM mistake: focused test
it.only("debug this one", () => {
  // Will skip all other tests!
});
```

`no-focused-tests` at error prevents this from being committed.

### Conditional Test Logic

LLMs generate flaky tests with conditional assertions:

```typescript
// LLM mistake: conditional expect
it("handles both cases", () => {
  const result = maybeGetValue();
  if (result) {
    expect(result).toBe("value");
  }
  // Passes when result is null - no assertion!
});
```

`no-conditional-expect` enforces consistent assertion paths.

## Additional Rules to Consider

These rules aren't in recommended but may be valuable:

| Rule                     | Purpose                     |
| ------------------------ | --------------------------- |
| `no-conditional-in-test` | No if/switch in test bodies |
| `prefer-each`            | Use `.each` over loops      |
| `prefer-hooks-on-top`    | Hooks before test cases     |
| `no-duplicate-hooks`     | One beforeEach per describe |

**Current decision:** Keep recommended only (matches minimal config approach)

## Research

Sources:

- [GitHub - vitest-dev/eslint-plugin-vitest](https://github.com/vitest-dev/eslint-plugin-vitest)
- [@vitest/eslint-plugin - npm](https://www.npmjs.com/package/@vitest/eslint-plugin)

**Key findings**:

- v1.5.2 recommended preset uses ~10 error rules (0 warn)
- All rules at error severity - aligns with LLM principle
- Config correctly scopes to test files with proper globals
- Dynamically loaded when Vitest detected
- No configuration changes needed
