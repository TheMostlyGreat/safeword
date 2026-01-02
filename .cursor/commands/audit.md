---
description: Run comprehensive code audit for architecture and dead code
---

# Audit

Run a comprehensive code audit. Execute these commands and report results.

## Instructions

```bash
# 1. Refresh config (detect current architecture)
bunx safeword sync-config 2>&1

# =========================================================================
# ARCHITECTURE CHECKS (circular deps, layer violations)
# =========================================================================

# 2a. Architecture - TypeScript/JS (depcruise)
[ -f .dependency-cruiser.js ] && {
  bunx depcruise --output-type err --config .dependency-cruiser.js . 2>&1 || true
}

# 2b. Architecture - Python
# Note: Python circular imports cause ImportError at runtime.
# If your Python code runs, it has no blocking circular imports.
# For static analysis, consider: pip install import-linter

# 2c. Architecture - Go
# Note: Go compiler prevents circular imports between packages at build time.
# If your Go project builds, it has no circular dependencies.

# =========================================================================
# DEAD CODE DETECTION
# =========================================================================

# 3a. Dead code - TypeScript/JS (knip with auto-fix)
[ -f package.json ] && {
  bunx knip --fix 2>&1 || true
}

# 3b. Dead code - Python (deadcode)
([ -f pyproject.toml ] || [ -f requirements.txt ]) && {
  deadcode . 2>&1 || true
}

# 3c. Dead code - Go (golangci-lint unused)
[ -f go.mod ] && {
  golangci-lint run --enable unused --out-format colored-line-number 2>&1 || true
}

# =========================================================================
# CODE DUPLICATION
# =========================================================================

# 4. Copy/paste detection (all languages)
bunx jscpd . --gitignore --min-lines 10 --reporters console 2>&1 || true

# =========================================================================
# OUTDATED DEPENDENCIES
# =========================================================================

# 5a. Outdated - TypeScript/JS
[ -f package.json ] && {
  bun outdated 2>&1 || npm outdated 2>&1 || true
}

# 5b. Outdated - Python (uv > poetry > pip)
([ -f pyproject.toml ] || [ -f requirements.txt ]) && {
  uv pip list --outdated 2>&1 || poetry show --outdated 2>&1 || pip list --outdated 2>&1 || true
}

# 5c. Outdated - Go
[ -f go.mod ] && {
  go list -m -u all 2>&1 | grep '\[' || echo "All Go modules up to date"
}
```

## Report Format

After running, report in this format:

**Architecture:**

- Circular dependencies: [None / show cycle path]
- Layer violations: [None / show invalid import]

**Dead Code:**

- Fixed by knip: [list of auto-fixed items]
- Python (deadcode): [unused functions/classes]
- Go (unused): [unused code from golangci-lint]

**Duplication:**

- Clone count: X (Y% of codebase)
- [List significant duplicates if any]

**Outdated Packages:**

- TS/JS: [list or "all up to date"]
- Python (uv/poetry/pip): [list or "all up to date"]
- Go: [list or "all up to date"]
