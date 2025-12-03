---
description: Run linters and formatters to fix code style issues
---

# Lint

Run the full linting and formatting suite using the npm scripts configured by safeword.

## Instructions

Run these npm scripts in order. Each script is configured in package.json by `safeword setup`.

````bash
# 1. ESLint - fix code quality issues
npm run lint 2>&1 || true

# 2. Prettier - format all files
npm run format 2>&1 || true

# 3. Markdownlint - fix markdown issues
npm run lint:md 2>&1 || true

# 4. TypeScript type check (if tsconfig.json exists)
[ -f tsconfig.json ] && npx tsc --noEmit 2>&1 || true
```text

## Summary

After running, report:

1. Any ESLint errors that couldn't be auto-fixed
2. Any formatting issues
3. Type errors (if TypeScript)

Note: File patterns are defined in the npm scripts (single source of truth), not here.
````
