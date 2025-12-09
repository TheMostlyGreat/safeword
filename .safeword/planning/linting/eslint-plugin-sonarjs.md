# eslint-plugin-sonarjs

- **Version**: 3.0.5 (installed) | 3.0.5 (latest)
- **Preset**: `recommended`
- **Gotcha**: None - v3.0 preset properly enables 201 rules at error severity
- **LLM-critical rules**: All bug detection rules at error severity
- **Overrides**: None needed

## Why This Plugin Matters for LLMs

LLMs exhibit specific coding behaviors that sonarjs catches:

| LLM Behavior                              | Rule That Catches It           |
| ----------------------------------------- | ------------------------------ |
| Generates overly nested/complex functions | `cognitive-complexity`         |
| Copy-pastes comparisons with subtle bugs  | `no-identical-expressions`     |
| Duplicates if/else branches               | `no-all-duplicated-branches`   |
| Overwrites array elements unintentionally | `no-element-overwrite`         |
| Creates collections but never uses them   | `no-empty-collection`          |
| Generates near-duplicate functions        | `no-identical-functions`       |
| Passes wrong number of arguments          | `no-extra-arguments`           |
| Uses void return values                   | `no-use-of-empty-return-value` |

## Version 3.0 Changes

**Important**: v3.0.5 is fundamentally different from v1.x:

| Version | Rules     | Source                |
| ------- | --------- | --------------------- |
| ^1.0.0  | 34 rules  | Subset of SonarJS     |
| >=2.0.0 | 266 rules | Full SonarJS analyzer |

The GitHub README still describes v1.x. v3.0 includes all rules from the SonarJS analyzer.

## Rule Severity Breakdown

| Severity  | Count | Purpose                                      |
| --------- | ----- | -------------------------------------------- |
| error (2) | 201   | Bug detection, code smells                   |
| off (0)   | 65    | Style preferences, high false-positive rules |
| warn (1)  | 0     | None                                         |

Using only error/off (no warn) aligns with our principle: LLMs respond to blocking errors, not warnings.

## Overlap with typescript-eslint

Verified minimal overlap - the plugins are complementary:

| sonarjs                    | typescript-eslint                | Overlap?      |
| -------------------------- | -------------------------------- | ------------- |
| `no-identical-expressions` | -                                | No equivalent |
| `no-duplicate-string`      | -                                | No equivalent |
| -                          | `no-duplicate-enum-values`       | Type-specific |
| -                          | `no-duplicate-type-constituents` | Type-specific |

sonarjs catches runtime code issues; typescript-eslint catches type-specific issues.

## Rules Disabled in Recommended

| Rule                        | Why disabled             |
| --------------------------- | ------------------------ |
| `no-duplicate-string`       | High false positive rate |
| `elseif-without-else`       | Style preference         |
| `no-inverted-boolean-check` | Style preference         |

## Current Configuration

```javascript
import sonarjs from "eslint-plugin-sonarjs";

// Using recommended preset with no overrides
sonarjs.configs.recommended,
```

## Research

Sources:

- [GitHub - eslint-plugin-sonarjs](https://github.com/SonarSource/eslint-plugin-sonarjs)
- [npm - eslint-plugin-sonarjs](https://www.npmjs.com/package/eslint-plugin-sonarjs)
- [cognitive-complexity rule docs](https://github.com/SonarSource/eslint-plugin-sonarjs/blob/master/docs/rules/cognitive-complexity.md)

**Key findings**:

- v3.0 recommended preset is well-configured for LLM usage
- Uses error severity for all enabled rules (no warnings)
- `cognitive-complexity` default threshold of 15 is reasonable
- Complementary to typescript-eslint (minimal overlap)
- No configuration changes needed
