---
description: Run linters and formatters to fix code style issues (project)
---

# Lint

Run the full linting and formatting suite for the detected project type(s).

## Instructions

Run these commands based on project type. Both Python and JS commands run for polyglot projects.

```bash
# Python linting (if pyproject.toml or requirements.txt exists)
([ -f pyproject.toml ] || [ -f requirements.txt ]) && {
  # Ruff - fix code quality issues
  ruff check --fix . 2>&1 || true
  # Ruff - format all files
  ruff format . 2>&1 || true
  # mypy - type check
  mypy . 2>&1 || true
}

# JS/TS linting (if package.json exists)
[ -f package.json ] && {
  # ESLint - fix code quality issues
  bun run lint 2>&1 || true
  # Prettier - format all files
  bun run format --if-present 2>&1 || true
  # TypeScript type check (if tsconfig.json exists)
  [ -f tsconfig.json ] && bunx tsc --noEmit 2>&1 || true
}
```

## Summary

After running, report:

1. Any linting errors that couldn't be auto-fixed (Ruff or ESLint)
2. Any formatting issues
3. Type errors (mypy or TypeScript)
