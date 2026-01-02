---
description: Run comprehensive code audit for architecture and dead code
---

# Audit

Run a comprehensive code audit. Execute these commands and report results.

## Instructions

```bash
# 1. Refresh config (detect current architecture)
bunx safeword sync-config 2>&1

# 2. Architecture check (circular deps, layer violations) - TypeScript/JS
[ -f .dependency-cruiser.js ] && {
  bunx depcruise --output-type err --config .dependency-cruiser.js . 2>&1 || true
}

# 3. Dead code + auto-fix - TypeScript/JS
[ -f package.json ] && {
  bunx knip --fix 2>&1 || true
}

# 4. Dead code - Python
([ -f pyproject.toml ] || [ -f requirements.txt ]) && {
  deadcode . 2>&1 || true
}

# 5. Dead code - Go (via golangci-lint)
[ -f go.mod ] && {
  golangci-lint run --enable unused --out-format colored-line-number 2>&1 || true
}

# 6. Copy/paste detection (all languages)
bunx jscpd . --gitignore --min-lines 10 --reporters console 2>&1 || true

# 7. Outdated packages - TypeScript/JS
[ -f package.json ] && {
  bun outdated 2>&1 || npm outdated 2>&1 || true
}

# 8. Outdated packages - Python
([ -f pyproject.toml ] || [ -f requirements.txt ]) && {
  poetry show --outdated 2>&1 || pip list --outdated 2>&1 || true
}

# 9. Outdated packages - Go
[ -f go.mod ] && {
  go list -m -u all 2>&1 | grep '\[' || echo "All Go modules up to date"
}
```

## Report Format

After running, report in this format:

**Fixed:**

- [What knip auto-fixed - unused exports, dependencies]

**Errors (manual fix required):**

- [Circular dependencies - show the cycle path]
- [Layer violations - show the invalid import]
- [Dead code - unused functions/classes from deadcode (Python) or golangci-lint (Go)]

**Info:**

- [Unused files to review - may be intentional]
- [Code duplicates - blocks detected by jscpd]
- [Outdated packages - TS/JS (bun/npm), Python (poetry/pip), Go (go list)]
