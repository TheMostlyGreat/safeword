# eslint-plugin-playwright

- **Version**: 2.4.0 (installed) | 2.4.0 (latest)
- **Preset**: `flat/recommended` rules
- **Gotcha**: None - preset uses appropriate error/warn split
- **LLM-critical rules**: `missing-playwright-await`, `no-focused-test`, `valid-expect`
- **Overrides**: None needed

## Why This Plugin Matters for LLMs

LLMs make frequent Playwright-specific mistakes:

| LLM Behavior                          | Rule That Catches It          |
| ------------------------------------- | ----------------------------- |
| Forgets `await` on page actions       | `missing-playwright-await`    |
| Leaves `.only` in committed tests     | `no-focused-test`             |
| Uses `.skip` without tracking         | `no-skipped-test`             |
| Conditional assertions (flaky tests)  | `no-conditional-expect`       |
| Uses deprecated element handles       | `no-element-handle`           |
| Uses `waitForNavigation` (deprecated) | `no-wait-for-navigation`      |
| Uses `waitForSelector` (deprecated)   | `no-wait-for-selector`        |
| Uses arbitrary `waitForTimeout`       | `no-wait-for-timeout`         |
| Uses `{ force: true }` to bypass      | `no-force-option`             |
| Uses `page.$eval` (security risk)     | `no-eval`                     |
| Waits for `networkidle` (flaky)       | `no-networkidle`              |
| Forgets assertions in test body       | `expect-expect`               |
| Uses non-web-first assertions         | `prefer-web-first-assertions` |

## Rule Severity Breakdown

| Severity  | Count | Key Rules                                        |
| --------- | ----- | ------------------------------------------------ |
| error (2) | 13    | Critical: missing-await, no-focused, valid-\*    |
| warn (1)  | 14    | Advisory: expect-expect, no-skip, deprecated API |

### Error-Level Rules (Critical)

| Rule                          | Purpose                             |
| ----------------------------- | ----------------------------------- |
| `missing-playwright-await`    | Prevents race conditions (fixable)  |
| `no-focused-test`             | Prevents skipping other tests       |
| `no-networkidle`              | Prevents flaky tests                |
| `no-standalone-expect`        | Expect must be in test block        |
| `no-unsafe-references`        | Prevents closure bugs in evaluate() |
| `no-unused-locators`          | Dead code detection                 |
| `no-wait-for-navigation`      | Deprecated API                      |
| `prefer-web-first-assertions` | Modern Playwright patterns          |
| `valid-describe-callback`     | Syntax errors                       |
| `valid-expect`                | Proper expect usage                 |
| `valid-expect-in-promise`     | Async assertion correctness         |
| `valid-test-tags`             | Proper tag format                   |
| `valid-title`                 | Non-empty test titles               |

### Warn-Level Rules (Advisory)

| Rule                     | Purpose                          |
| ------------------------ | -------------------------------- |
| `expect-expect`          | Tests should have assertions     |
| `max-nested-describe`    | Readability                      |
| `no-conditional-expect`  | Prevents flaky conditional logic |
| `no-conditional-in-test` | Prevents flaky test logic        |
| `no-element-handle`      | Use locators instead             |
| `no-eval`                | Security/maintenance             |
| `no-force-option`        | Forces indicate selector issues  |
| `no-nested-step`         | Simplify step structure          |
| `no-page-pause`          | Debug artifact                   |
| `no-skipped-test`        | Track skipped tests              |
| `no-useless-await`       | Unnecessary awaits               |
| `no-useless-not`         | Use specific matchers            |
| `no-wait-for-selector`   | Use web-first assertions         |
| `no-wait-for-timeout`    | Use proper waits                 |

## LLM-Specific Concerns

### Missing Await (Most Common LLM Bug)

LLMs frequently forget `await` on Playwright actions:

```typescript
// LLM mistake: missing await
test('login flow', async ({ page }) => {
  page.goto('/login'); // Missing await!
  page.fill('#email', 'test@example.com'); // Race condition!
});
```

`missing-playwright-await` catches this and auto-fixes it.

### Deprecated Waiters

LLMs trained on older Playwright docs use deprecated patterns:

```typescript
// LLM mistake: deprecated waiters
await page.waitForSelector('.loaded'); // Warn
await page.waitForNavigation(); // Error
await page.waitForTimeout(1000); // Warn - arbitrary waits
```

Modern Playwright uses web-first assertions instead:

```typescript
// Correct: web-first assertion
await expect(page.locator('.loaded')).toBeVisible();
```

### Force Option Abuse

LLMs use `{ force: true }` to bypass flaky selectors:

```typescript
// LLM mistake: forcing clicks
await page.click('button', { force: true }); // Hides real issues
```

`no-force-option` encourages fixing the underlying selector problem.

## Configuration

```javascript
// Playwright for e2e tests (always included - safeword sets up Playwright)
configs.push({
  name: 'playwright',
  files: ['**/e2e/**', '**/*.e2e.{js,ts,jsx,tsx}', '**/playwright/**'],
  ...playwright.configs['flat/recommended'],
});
```

Key features:

- **Always included** - Unlike other framework plugins, Playwright is always loaded (safeword manages Playwright setup)
- **Scoped to e2e files** - Only applies to e2e test directories
- **Spread preset** - Uses full flat/recommended config

## Potential Enhancements

Consider escalating some warn rules to error for LLM development:

```javascript
rules: {
  "playwright/expect-expect": "error",     // Tests must have assertions
  "playwright/no-focused-test": "error",   // Already error
  "playwright/no-conditional-expect": "error", // Prevent flaky tests
}
```

**Current decision:** Keep recommended severities (matches Playwright team's defaults)

## Research

Sources:

- [GitHub - eslint-plugin-playwright](https://github.com/playwright-community/eslint-plugin-playwright)
- [eslint-plugin-playwright - npm](https://www.npmjs.com/package/eslint-plugin-playwright)

**Key findings**:

- v2.4.0 flat/recommended uses 27 rules (13 error, 14 warn)
- `missing-playwright-await` at error is critical for LLMs
- Config properly scoped to e2e directories
- Always loaded (unlike conditional framework plugins)
- No configuration changes needed
