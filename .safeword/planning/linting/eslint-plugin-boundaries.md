# eslint-plugin-boundaries

- **Version**: 5.3.0 (installed) | 5.3.1 (latest)
- **Preset**: Custom config (not using recommended/strict presets)
- **Gotcha**: None - config is well-designed for LLM usage
- **LLM-critical rules**: `element-types: "error"` (correctly set)
- **Overrides**: `no-unknown`, `no-unknown-files` disabled for flexibility

## Alignment with LLM Research

From `llm-coding-agents-linting.md`:

- **Line 226**: "Architecture boundaries guide behavior" - LLMs follow explicit patterns well
- **Line 329**: Listed as "Must-Have" - "Prevents convenient imports"
- **Lines 490-492**: Anti-pattern #4 - "LLMs generate 'convenient' imports"
- **Core insight**: "LLMs Ignore Warnings, Only Respond to Errors" (line 7)

Our config explicitly implements this principle (see line 29 comment).

## Current Configuration

```javascript
{
  plugins: { boundaries },
  settings: {
    'boundaries/elements': [
      { type: 'utils', pattern: 'packages/cli/src/utils/**', mode: 'full' },
      { type: 'app', pattern: 'packages/cli/src/commands/**', mode: 'full' },
    ],
  },
  rules: {
    'boundaries/element-types': [
      'error',  // LLMs only respond to blocking errors
      {
        default: 'disallow',
        rules: [{ from: ['app'], allow: ['utils'] }],
      },
    ],
    'boundaries/no-unknown': 'off',
    'boundaries/no-unknown-files': 'off',
  },
}
```

## Why This Config Works for LLMs

| Decision                  | Why                                                               |
| ------------------------- | ----------------------------------------------------------------- |
| `element-types: "error"`  | LLMs ignore warnings; errors force compliance                     |
| `default: "disallow"`     | Explicit allowlist > implicit denylist for LLMs                   |
| `no-unknown: "off"`       | Allows incremental adoption; doesn't block on uncategorized files |
| `no-unknown-files: "off"` | Same - flexibility for existing codebases                         |

## Available Rules

| Rule               | Purpose                                     | Our Setting                 |
| ------------------ | ------------------------------------------- | --------------------------- |
| `element-types`    | Enforce import boundaries                   | `error` with explicit rules |
| `no-unknown`       | Flag imports from unrecognized elements     | `off`                       |
| `no-unknown-files` | Flag files not matching any element pattern | `off`                       |
| `no-ignored`       | Flag imports from ignored files             | Not set (default)           |
| `entry-point`      | Enforce entry point constraints             | Not set                     |
| `external`         | Control external dependency imports         | Not set                     |
| `no-private`       | Prevent importing private elements          | Not set                     |

## When to Enable Stricter Rules

For greenfield projects or after full architecture cleanup:

```javascript
'boundaries/no-unknown': 'error',       // All imports must be recognized
'boundaries/no-unknown-files': 'error', // All files must match an element
```

For LLM development, these would ensure LLMs can't create files outside the defined architecture.

## Research

Sources:

- [GitHub - eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries)
- [element-types rule docs](https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/docs/rules/element-types.md)
- [no-unknown rule docs](https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/docs/rules/no-unknown.md)
- Internal: `.safeword/learnings/llm-coding-agents-linting.md` (lines 226, 329, 490-492)

**Key findings**:

- Config correctly uses `error` severity (not `warn`)
- `default: "disallow"` with explicit allowlist is correct pattern
- `no-unknown*` rules correctly disabled for flexibility
- No changes needed - config is optimal for LLM usage
