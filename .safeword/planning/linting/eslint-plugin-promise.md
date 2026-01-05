# eslint-plugin-promise

- **Version**: 7.2.1 (installed) | 7.2.1 (latest)
- **Preset**: `flat/recommended`
- **Gotcha**: `no-multiple-resolved` exists but NOT in recommended preset
- **LLM-critical rules**: Error-level rules properly configured
- **Overrides**: Added `no-multiple-resolved: "error"`

## Recommended Preset Rules

| Rule                     | Severity | Why it matters for LLMs                                  |
| ------------------------ | -------- | -------------------------------------------------------- |
| `always-return`          | error    | LLMs forget to return in promise chains                  |
| `no-return-wrap`         | error    | LLMs unnecessarily wrap values in Promise.resolve/reject |
| `param-names`            | error    | LLMs use wrong parameter names in new Promise()          |
| `catch-or-return`        | error    | LLMs forget error handling                               |
| `no-new-statics`         | error    | LLMs call `new Promise.resolve()` incorrectly            |
| `no-nesting`             | warn     | LLMs create deeply nested promise chains                 |
| `no-promise-in-callback` | warn     | LLMs mix promises and callbacks                          |
| `no-callback-in-promise` | warn     | LLMs mix callbacks inside promises                       |
| `no-return-in-finally`   | warn     | LLMs return values in finally blocks                     |
| `valid-params`           | warn     | LLMs pass wrong number of params                         |
| `no-native`              | off      | Not needed (we use native promises)                      |
| `avoid-new`              | off      | `new Promise()` is valid                                 |

## Missing Rule: `no-multiple-resolved`

**Status**: Available in plugin but NOT in recommended preset

**What it catches**: Code paths that could resolve/reject a promise multiple times:

```javascript
// Bad - LLMs write this frequently
new Promise((resolve) => {
  if (!cache) {
    resolve(null); // No return! Execution continues
  }
  resolve(cache.get("key")); // Called again
});
```

**LLM relevance**: HIGH - LLMs frequently forget to `return` after resolve/reject.

**Recommendation**: Enable at error severity - catches real bugs.

## Rules NOT Enabled (by design)

| Rule                        | Why NOT enabled                              |
| --------------------------- | -------------------------------------------- |
| `prefer-await-to-then`      | Style preference, both are valid             |
| `prefer-await-to-callbacks` | High false-positive rate with event emitters |
| `spec-only`                 | For Promise spec compliance testing          |
| `prefer-catch`              | Style preference                             |

## Overlap with typescript-eslint

For TypeScript projects, these rules overlap:

| promise rule      | typescript-eslint equivalent                                   |
| ----------------- | -------------------------------------------------------------- |
| `catch-or-return` | `@typescript-eslint/no-floating-promises` (stricter)           |
| -                 | `@typescript-eslint/no-misused-promises` (additional coverage) |
| -                 | `@typescript-eslint/await-thenable` (additional coverage)      |

**Both plugins are complementary** - promise plugin catches issues in non-async code (Promise chains), while typescript-eslint catches issues in async/await code.

## Research

Sources:

- [GitHub - eslint-community/eslint-plugin-promise](https://github.com/eslint-community/eslint-plugin-promise)
- [no-multiple-resolved feature](https://github.com/eslint-community/eslint-plugin-promise/issues/222)
- [prefer-await-to-then docs](https://github.com/eslint-community/eslint-plugin-promise/blob/main/docs/rules/prefer-await-to-then.md)
- Internal: `.safeword/learnings/llm-coding-agents-linting.md` (lines 159-176, 330)

**Key findings**:

- Preset properly enables rules (no SDL-style trap)
- `no-multiple-resolved` is valuable but not in recommended - **add to config**
- Warning-level rules are appropriate (stylistic, not bugs)
- Good overlap with typescript-eslint for comprehensive promise coverage

## Alignment with LLM Research

From `llm-coding-agents-linting.md`:

- **Line 330**: Plugin listed as "Must-Have" - "No-floating-promises critical"
- **Lines 159-176**: Documents LLM async/await failures this plugin catches
- **Core insight**: "LLMs Ignore Warnings, Only Respond to Errors" (line 7)

The promise plugin's error-level rules (`always-return`, `catch-or-return`, etc.) align with our principle of using `error` for correctness issues.

## Config Change (Applied)

Added `no-multiple-resolved` at error severity to catch the missing-return-after-resolve bug:

```javascript
// After pluginPromise.configs["flat/recommended"]
{
  rules: {
    "promise/no-multiple-resolved": "error",
  },
}
```
