# @eslint/js

- **Version**: 9.39.1 (installed) | 9.39.1 (latest)
- **Preset**: `configs.recommended`
- **Gotcha**: None - this is the core ESLint rules package
- **LLM-critical rules**: `no-eval`, `no-new-func`, `no-empty` at error
- **Overrides**: None needed

## Why This Plugin Matters for LLMs

@eslint/js provides the foundational JavaScript rules. While specialized plugins catch domain-specific issues, these core rules catch universal JS mistakes:

| LLM Behavior                     | Rule That Catches It |
| -------------------------------- | -------------------- |
| Uses `eval()` for dynamic code   | `no-eval`            |
| Creates functions from strings   | `no-new-func`        |
| Leaves debug statements in code  | `no-debugger`        |
| Empty catch blocks               | `no-empty`           |
| Swallows exceptions silently     | `no-useless-catch`   |
| Uses var instead of let/const    | `no-var`             |
| Forgets to update loop direction | `for-direction`      |
| Falls through switch cases       | `no-fallthrough`     |

## Rule Severity Breakdown

| Severity  | Count | Purpose                |
| --------- | ----- | ---------------------- |
| error (2) | 46    | Core JS correctness    |
| warn (1)  | 0     | None                   |
| off (0)   | 116   | Style/deprecated rules |

Note: Many disabled rules are superseded by TypeScript-ESLint equivalents that provide type-aware checking.

## Overlap with TypeScript-ESLint

typescript-eslint extends and replaces many core rules:

| Core Rule              | typescript-eslint Equivalent              |
| ---------------------- | ----------------------------------------- |
| `no-unused-vars`       | `@typescript-eslint/no-unused-vars`       |
| `no-use-before-define` | `@typescript-eslint/no-use-before-define` |
| `no-redeclare`         | `@typescript-eslint/no-redeclare`         |
| `no-shadow`            | `@typescript-eslint/no-shadow`            |

The TypeScript versions are preferred because they understand type-only imports, interfaces, and other TS constructs.

## LLM-Relevant Security Rules (at error)

| Rule                    | Why It Matters                           |
| ----------------------- | ---------------------------------------- |
| `no-eval`               | LLMs suggest eval() for "flexibility"    |
| `no-new-func`           | LLMs create Function() for dynamic code  |
| `no-caller`             | Deprecated, but LLMs trained on old code |
| `no-prototype-builtins` | Prototype pollution prevention           |

## Modern JS Enforcement (at error)

| Rule                    | Enforces                  |
| ----------------------- | ------------------------- |
| `no-var`                | Use let/const             |
| `prefer-const`          | const where possible      |
| `prefer-rest-params`    | ...args over arguments    |
| `prefer-spread`         | spread over .apply()      |
| `prefer-regex-literals` | /regex/ over new RegExp() |

## Current Configuration

```javascript
import js from "@eslint/js";

js.configs.recommended,
```

This is the minimal configuration. The recommended preset provides sensible defaults that work well for both human and LLM-generated code.

## Research

Sources:

- [ESLint Configuration Files](https://eslint.org/docs/latest/use/configure/configuration-files)
- [ESLint Rules Reference](https://eslint.org/docs/latest/rules/)
- [Flat Config with Extends (March 2025)](https://eslint.org/blog/2025/03/flat-config-extends-define-config-global-ignores/)

**Key findings**:

- v9.39.1 configs.recommended provides 46 error rules (0 warn)
- All rules at error severity - aligns with LLM principle
- Many disabled rules are covered by TypeScript-ESLint
- No configuration changes needed - preset is optimal
