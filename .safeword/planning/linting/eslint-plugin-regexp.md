# eslint-plugin-regexp

- **Version**: 2.10.0 (installed) | 2.10.0 (latest)
- **Preset**: `flat/recommended`
- **Gotcha**: None - preset properly enables ReDoS prevention at error
- **LLM-critical rules**: `no-super-linear-backtracking` at error
- **Overrides**: None needed

## Why This Plugin Matters for LLMs

LLMs generate regex patterns that look correct but have subtle issues:

| Pattern Issue                     | Rule That Catches It                 |
| --------------------------------- | ------------------------------------ |
| Catastrophic backtracking (ReDoS) | `no-super-linear-backtracking`       |
| Patterns that never match         | `no-empty-capturing-group`           |
| Duplicate character classes       | `no-dupe-characters-character-class` |
| Redundant quantifiers             | `no-useless-quantifier`              |
| Invalid escapes                   | `no-invalid-regexp`                  |

## Rule Severity Breakdown

| Severity  | Count | Purpose                        |
| --------- | ----- | ------------------------------ |
| error (2) | 54    | Correctness and security       |
| warn (1)  | 6     | Style/optimization suggestions |
| off (0)   | 0     | None                           |

## Warn-Level Rules (style suggestions)

| Rule                                   | Purpose                |
| -------------------------------------- | ---------------------- |
| `confusing-quantifier`                 | Style clarity          |
| `no-empty-alternative`                 | Style optimization     |
| `no-lazy-ends`                         | Style suggestion       |
| `no-potentially-useless-backreference` | Edge case detection    |
| `no-useless-flag`                      | Code optimization      |
| `optimal-lookaround-quantifier`        | Performance suggestion |

These are appropriately at warn - they're optimizations, not bugs.

## Critical Security Rules (at error)

| Rule                              | Security Impact  |
| --------------------------------- | ---------------- |
| `no-super-linear-backtracking`    | ReDoS prevention |
| `no-control-character`            | Input validation |
| `no-misleading-capturing-group`   | Logic bugs       |
| `no-misleading-unicode-character` | Security bypass  |

## Overlap with Security Plugin

We also have `security/detect-unsafe-regex` from SDL plugin. Both are complementary:

- `security/detect-unsafe-regex`: Flags user-controlled regex
- `regexp/no-super-linear-backtracking`: Analyzes regex complexity

## Current Configuration

```javascript
// Regexp plugin - LLMs generate subtly wrong regex patterns
pluginRegexp.configs["flat/recommended"],
```

## Research

Sources:

- [eslint-plugin-regexp npm](https://www.npmjs.com/package/eslint-plugin-regexp)
- [User Guide](https://ota-meshi.github.io/eslint-plugin-regexp/user-guide/)

**Key findings**:

- `flat/recommended` preset properly configures ReDoS prevention at error
- 6 warn rules are style/optimization - appropriate severity
- No config changes needed
