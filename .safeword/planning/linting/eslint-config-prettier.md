# eslint-config-prettier

- **Version**: 10.1.8 (installed) | 10.1.8 (latest)
- **Preset**: N/A - this is a config, not a plugin
- **Gotcha**: Must be placed LAST in config array to override other configs
- **LLM-critical rules**: None - this config only disables rules
- **Overrides**: None needed

## What It Does

Disables all ESLint rules that conflict with Prettier formatting. This includes rules from:

- Core ESLint (`indent`, `quotes`, `semi`, `max-len`, etc.)
- @babel/eslint-plugin
- @stylistic/eslint-plugin
- @typescript-eslint/eslint-plugin
- eslint-plugin-babel
- eslint-plugin-flowtype
- eslint-plugin-react
- eslint-plugin-standard
- eslint-plugin-unicorn
- eslint-plugin-vue

## Configuration

No rules to configure - it's a passthrough config that sets conflicting rules to `"off"`.

### Flat Config Usage

```js
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  // ... other configs
  eslintConfigPrettier, // MUST be last
];
```

Note: The `/flat` import is optional - the default export works for flat config.

### CLI Helper

Check for conflicts with:

```bash
npx eslint-config-prettier path/to/file.js
```

Exit codes:

- 0: No conflicts
- 1: Error
- 2: Conflicts found

Verified clean: `No rules that are unnecessary or conflict with Prettier were found.`

## LLM Relevance: None

This config is invisible to LLMs. It simply prevents ESLint from complaining about formatting that Prettier handles. LLMs should focus on logic and correctness, not formatting.

## Sources

- [GitHub - prettier/eslint-config-prettier](https://github.com/prettier/eslint-config-prettier)
- [npm - eslint-config-prettier](https://www.npmjs.com/package/eslint-config-prettier)
