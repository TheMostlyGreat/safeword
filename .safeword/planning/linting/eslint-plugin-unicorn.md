# eslint-plugin-unicorn

- **Version**: 62.0.0 (installed) | 62.0.0 (latest)
- **Preset**: `flat/recommended` with custom overrides
- **Gotcha**: None - config already has thoughtful overrides
- **LLM-critical rules**: Modern JS enforcement at error severity
- **Overrides**: 9 disabled, 3 at warn (documented)

## Why This Plugin Matters for LLMs

LLMs are trained on older codebases and generate outdated patterns. Unicorn enforces modern JavaScript:

| Outdated Pattern LLMs Generate | Modern Alternative (enforced) |
| ------------------------------ | ----------------------------- |
| `arr.indexOf(x) !== -1`        | `arr.includes(x)`             |
| `Object.assign({}, obj)`       | `{ ...obj }`                  |
| `arr.slice().reverse()`        | `arr.toReversed()`            |
| `arr.slice().sort()`           | `arr.toSorted()`              |
| `new Array(n).fill(x)`         | `Array.from({ length: n })`   |

## Rule Severity Breakdown

| Severity  | Count | Purpose                              |
| --------- | ----- | ------------------------------------ |
| error (2) | 116   | Modern JS enforcement                |
| warn (1)  | 3     | Style preferences for human review   |
| off (0)   | 22    | Overly pedantic or context-dependent |

## Our Overrides

### Disabled (off)

| Rule                            | Rationale                               |
| ------------------------------- | --------------------------------------- |
| `prevent-abbreviations`         | `ctx`, `dir`, `pkg`, `err` are standard |
| `no-null`                       | `null` is valid JS                      |
| `no-process-exit`               | CLI apps use `process.exit`             |
| `import-style`                  | Named imports are fine                  |
| `numeric-separators-style`      | Style preference                        |
| `text-encoding-identifier-case` | `utf-8` vs `utf8` doesn't matter        |
| `no-negated-condition`          | Sometimes clearer                       |
| `no-array-for-each`             | `forEach` is fine                       |
| `prefer-module`                 | CJS still valid in some contexts        |

### Warn (human review)

| Rule                 | Rationale                                   |
| -------------------- | ------------------------------------------- |
| `switch-case-braces` | Style preference, auto-fixable              |
| `catch-error-name`   | Style preference, auto-fixable              |
| `no-array-reduce`    | Can be confusing, but sometimes appropriate |

## Current Configuration

```javascript
unicorn.configs["flat/recommended"],
{
  rules: {
    "unicorn/prevent-abbreviations": "off",
    "unicorn/no-null": "off",
    "unicorn/no-process-exit": "off",
    "unicorn/import-style": "off",
    "unicorn/numeric-separators-style": "off",
    "unicorn/text-encoding-identifier-case": "off",
    "unicorn/switch-case-braces": "warn",
    "unicorn/catch-error-name": "warn",
    "unicorn/no-negated-condition": "off",
    "unicorn/no-array-reduce": "warn",
    "unicorn/no-array-for-each": "off",
    "unicorn/prefer-module": "off",
  },
},
```

## Research

Sources:

- [GitHub - eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn)
- [npm - eslint-plugin-unicorn](https://www.npmjs.com/package/eslint-plugin-unicorn)

**Key findings**:

- Config already has thoughtful overrides with documented rationale
- Disabled rules are appropriate for CLI/Node.js contexts
- Warn-level rules are style preferences flagged for human review
- No configuration changes needed
