# eslint-plugin-import-x

- **Version**: 4.16.1 (installed) | 4.16.1 (latest)
- **Preset**: `flatConfigs.recommended` + `flatConfigs.typescript`
- **Gotcha**: None - preset works correctly
- **LLM-critical rules**: `no-unresolved`, `export`, `named` at error
- **Overrides**: `order` disabled (using simple-import-sort instead)

## Why This Plugin Matters for LLMs

LLMs generate import statements that look correct but have subtle issues:

| LLM Behavior                    | Rule That Catches It  |
| ------------------------------- | --------------------- |
| Imports from non-existent paths | `no-unresolved`       |
| Re-exports same name twice      | `export`              |
| Imports non-existent named      | `named`               |
| Uses default where named exists | `no-named-as-default` |
| Duplicate import statements     | `no-duplicates`       |
| Imports from wrong namespace    | `namespace`           |

## Rule Severity Breakdown

| Severity  | Count | Purpose                   |
| --------- | ----- | ------------------------- |
| error (2) | 4     | Import/export correctness |
| warn (1)  | 3     | Naming conventions        |
| off (0)   | 2     | Disabled (order, first)   |

## Why We Use import-x Over eslint-plugin-import

import-x is a performance-focused fork:

| Feature          | eslint-plugin-import | eslint-plugin-import-x |
| ---------------- | -------------------- | ---------------------- |
| Dependencies     | 117                  | 16                     |
| Resolver         | `resolve` (slow)     | `unrs-resolver` (Rust) |
| exports field    | Not supported        | First-class support    |
| ESLint 9 support | Limited              | Full flat config       |

## Rules Not in Recommended (Intentionally Skipped)

| Rule                 | Purpose         | Why Not Enabled                          |
| -------------------- | --------------- | ---------------------------------------- |
| `no-cycle`           | Circular deps   | Computationally expensive, slows linting |
| `no-unused-modules`  | Unused exports  | High false positives, requires config    |
| `no-dynamic-require` | Dynamic imports | Already covered by security plugin       |

### On `no-cycle`

From the docs: "This rule is comparatively computationally expensive. If you are pressed for lint time, you may not want this rule enabled."

For LLM development, fast feedback loops are critical. The trade-off isn't worth it unless circular deps are a known issue.

## Current Configuration

```javascript
import { importX } from "eslint-plugin-import-x";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";

// Recommended preset
importX.flatConfigs.recommended,
{
  settings: {
    "import-x/resolver-next": [createTypeScriptImportResolver()],
  },
},

// TypeScript support (conditional)
importX.flatConfigs.typescript,

// Override: use simple-import-sort instead
{
  rules: {
    "import-x/order": "off",
  },
},
```

## Overlap with Other Plugins

| import-x             | Other Plugin                          | Overlap?             |
| -------------------- | ------------------------------------- | -------------------- |
| `no-unresolved`      | TypeScript path errors                | Complementary        |
| `order`              | `simple-import-sort`                  | Disabled for sort    |
| `no-dynamic-require` | `security/detect-non-literal-require` | Security covers this |

## Research

Sources:

- [GitHub - eslint-plugin-import-x](https://github.com/un-ts/eslint-plugin-import-x)
- [npm - eslint-plugin-import-x](https://www.npmjs.com/package/eslint-plugin-import-x)
- [no-cycle rule docs](https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-cycle.md)

**Key findings**:

- v4.16.1 flat/recommended with TypeScript resolver works correctly
- `order` disabled in favor of `simple-import-sort` (auto-fixable)
- `no-cycle` intentionally not enabled due to performance cost
- No configuration changes needed
