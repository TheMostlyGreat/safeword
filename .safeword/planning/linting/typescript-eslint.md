# typescript-eslint

- **Version**: 8.48.1 (installed) | 8.49.0 (latest)
- **Preset**: `strictTypeChecked` + `stylisticTypeChecked`
- **Gotcha**: None - presets properly enable all rules
- **LLM-critical rules**: All at error severity (see below)
- **Overrides**: `consistent-type-definitions: off`, `strict-boolean-expressions` with custom options

## LLM-Critical Rules (all enabled at error)

| Rule                         | Why it matters for LLMs                              |
| ---------------------------- | ---------------------------------------------------- |
| `no-explicit-any`            | LLMs use `any` when stuck - forces `unknown` instead |
| `no-unsafe-argument`         | Catches passing `any` typed values to functions      |
| `no-unsafe-assignment`       | Catches assigning `any` to variables                 |
| `no-unsafe-call`             | Catches calling values typed as `any`                |
| `no-unsafe-member-access`    | Catches accessing properties on `any`                |
| `no-unsafe-return`           | Catches returning `any` from functions               |
| `no-floating-promises`       | LLMs forget to await promises                        |
| `no-misused-promises`        | Catches promises in non-promise contexts             |
| `await-thenable`             | Catches awaiting non-promise values                  |
| `require-await`              | Flags async functions without await                  |
| `strict-boolean-expressions` | LLMs use truthy checks when they should be explicit  |

## Our Custom `strict-boolean-expressions` Config

```javascript
"@typescript-eslint/strict-boolean-expressions": ["error", {
  allowString: true,      // Allow string checks (common pattern)
  allowNumber: false,     // Disallow number checks (0 is falsy bug)
  allowNullableObject: true,
  allowNullableBoolean: true,
  allowNullableString: true,
  allowNullableNumber: false,
  allowAny: false,
}]
```

**Rationale**: LLMs frequently write `if (count)` when they should write `if (count > 0)`. The `allowNumber: false` option catches this bug while allowing common string truthiness patterns.

## Overrides

| Rule                          | Setting                    | Why                                                                    |
| ----------------------------- | -------------------------- | ---------------------------------------------------------------------- |
| `consistent-type-definitions` | `off`                      | Both `type` and `interface` are valid; no strong reason to enforce one |
| `no-unsafe-*` rules           | `off` in config files only | Config files use dynamic imports that are inherently untyped           |

## Config File Override

```javascript
// Disable no-unsafe-* rules for config files only
files: ["*.config.mjs", "*.config.ts", ".safeword/*.mjs"],
rules: {
  "@typescript-eslint/no-unsafe-argument": "off",
  "@typescript-eslint/no-unsafe-assignment": "off",
  "@typescript-eslint/no-unsafe-call": "off",
  "@typescript-eslint/no-unsafe-member-access": "off",
  "@typescript-eslint/no-unsafe-return": "off",
}
```

## Why `strictTypeChecked` over `strict`

Type-checked rules are essential for LLM code quality:

1. **Promise handling**: `no-floating-promises`, `no-misused-promises`, `await-thenable` all require type information
2. **Type safety**: `no-unsafe-*` rules need type context to detect `any` usage
3. **Better bug detection**: Type info enables rules that catch real bugs vs style issues

**Performance note**: Type-checked linting is slower (requires TypeScript compilation), but the safety benefits outweigh the cost for LLM-generated code.

## Research

Sources:

- [Shared Configs | typescript-eslint](https://typescript-eslint.io/users/configs/)
- [Linting with Type Information | typescript-eslint](https://typescript-eslint.io/getting-started/typed-linting/)
- [Rules Overview | typescript-eslint](https://typescript-eslint.io/rules/)

**Key findings**:

- `strictTypeChecked` includes all of `recommended`, `recommended-type-checked`, and `strict`
- Config is NOT semver-stable - rules may change in minor versions
- Type-checked rules can slow linting 30x on large codebases, but necessary for catching LLM mistakes
- Our config already uses the strictest available preset with type checking
