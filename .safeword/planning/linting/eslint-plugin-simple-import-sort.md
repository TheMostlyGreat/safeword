# eslint-plugin-simple-import-sort

- **Version**: 12.1.1 (installed) | 12.1.1 (latest)
- **Preset**: None (no presets available)
- **Gotcha**: None - intentionally simple plugin with minimal config options
- **LLM-critical rules**: None - purely auto-fixable formatting rules
- **Overrides**: None needed

## Rules

| Rule                         | Severity | Auto-fix   | Purpose                |
| ---------------------------- | -------- | ---------- | ---------------------- |
| `simple-import-sort/imports` | error    | Yes (100%) | Sort import statements |
| `simple-import-sort/exports` | error    | Yes (100%) | Sort export statements |

## Research

### Why `error` is correct for LLM workflows

Both rules are 100% auto-fixable with deterministic output. Using `error` ensures:

1. Fixes are applied on save (editor integration) or commit (pre-commit hooks)
2. LLMs don't waste context trying to manually sort imports
3. Consistent import ordering reduces merge conflicts

### Configuration

The plugin has a single optional `groups` option for custom import grouping via regex patterns. Default grouping:

1. Side effect imports (`import "./styles"`)
2. Node.js builtins with `node:` prefix
3. External packages (`@scope/pkg`, `pkg`)
4. Absolute imports
5. Relative imports (`./`, `../`)

Our config uses defaults - no custom grouping needed.

### Incompatibilities

Must disable conflicting rules:

- `sort-imports` (core ESLint) - not enabled
- `import/order` (eslint-plugin-import) - disabled in our config

### LLM Relevance: Low

This plugin exists to reduce noise, not catch bugs. LLMs don't need to understand import sorting - they just need to write imports and let the auto-fix handle ordering.

## Sources

- [GitHub - lydell/eslint-plugin-simple-import-sort](https://github.com/lydell/eslint-plugin-simple-import-sort)
- [npm - eslint-plugin-simple-import-sort](https://www.npmjs.com/package/eslint-plugin-simple-import-sort)
