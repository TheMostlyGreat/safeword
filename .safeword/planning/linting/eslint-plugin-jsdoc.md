# eslint-plugin-jsdoc

- **Version**: 61.5.0 (installed) | 61.5.0 (latest)
- **Preset**: `flat/recommended-typescript`
- **Gotcha**: None - preset uses all warn severity (appropriate for docs)
- **LLM-critical rules**: None - documentation is for human context
- **Overrides**: None needed

## Why This Plugin Matters for LLMs

JSDoc serves a different purpose than other linting plugins:

| Purpose                | Who Benefits | Severity |
| ---------------------- | ------------ | -------- |
| API documentation      | Humans       | warn     |
| LLM context in prompts | LLMs         | warn     |
| IDE IntelliSense       | Both         | warn     |

JSDoc is NOT about catching LLM bugs - it's about providing context that helps LLMs (and humans) understand code intent.

## Rule Severity Breakdown

| Severity  | Count | Purpose                   |
| --------- | ----- | ------------------------- |
| error (2) | 0     | None                      |
| warn (1)  | 34    | Documentation suggestions |
| off (0)   | 41    | Disabled rules            |

**All rules at warn is correct.** Documentation rules should not block LLM development - they're suggestions for human review.

## Why recommended-typescript

The `flat/recommended-typescript` preset is tailored for TypeScript:

| Feature                     | Standard Preset | TypeScript Preset        |
| --------------------------- | --------------- | ------------------------ |
| `@param` type annotations   | Required        | Optional (TS has types)  |
| `@returns` type annotations | Required        | Optional (TS has types)  |
| `@type` annotations         | Required        | Discouraged (`no-types`) |
| TS-specific rules           | Off             | Enabled                  |

Key TypeScript-specific rules enabled:

- `no-types` - Don't duplicate type info in JSDoc
- `reject-any-type` - Avoid `@type {any}`
- `reject-function-type` - Avoid `@type {Function}`
- `ts-no-empty-object-type` - Avoid `@type {{}}`

## LLM Development Considerations

JSDoc helps LLMs understand code in two ways:

1. **In-context documentation**: When LLMs read source files, JSDoc provides intent
2. **IDE assistance**: When humans use Copilot/AI completions, JSDoc informs suggestions

**Why we don't escalate to error:**

From the LLM research doc: "LLMs respond to errors, ignore warnings." This is by design for JSDoc - we WANT documentation to be advisory, not blocking. Forcing LLMs to write documentation on every function would be counterproductive.

## Available Presets

| Preset                              | Description                            |
| ----------------------------------- | -------------------------------------- |
| `flat/recommended`                  | Standard JS projects                   |
| `flat/recommended-error`            | Same but with errors (not recommended) |
| `flat/recommended-typescript`       | TypeScript projects (our choice)       |
| `flat/recommended-typescript-error` | Same but with errors (not recommended) |
| `flat/recommended-mixed`            | Auto-detect based on file extension    |

## Current Configuration

```javascript
import pluginJsdoc from "eslint-plugin-jsdoc";

// JSDoc plugin - helps LLMs understand code context via documentation
pluginJsdoc.configs["flat/recommended-typescript"],
```

## Key Rules

| Rule                | Purpose                             |
| ------------------- | ----------------------------------- |
| `require-jsdoc`     | Suggests docs on exports            |
| `require-param`     | Suggests param docs                 |
| `require-returns`   | Suggests return docs                |
| `check-param-names` | Ensures param names match signature |
| `check-types`       | Validates JSDoc type syntax         |
| `no-types`          | In TS, types come from TS not JSDoc |

## Research

Sources:

- [GitHub - eslint-plugin-jsdoc](https://github.com/gajus/eslint-plugin-jsdoc)
- [npm - eslint-plugin-jsdoc](https://www.npmjs.com/package/eslint-plugin-jsdoc)

**Key findings**:

- v61.5.0 flat/recommended-typescript uses 34 warn rules (0 error)
- All-warn severity is appropriate - documentation is advisory
- TypeScript preset avoids duplicate type annotations
- No configuration changes needed - preset is optimal
