---
description: Run comprehensive code audit for architecture and dead code
---

# Audit

Run a comprehensive code audit. Execute these commands and report results.

## Instructions

```bash
# 1. Refresh config (detect current architecture)
npx safeword sync-config 2>&1

# 2. Architecture check (circular deps, layer violations)
npx depcruise --output-type err --config .dependency-cruiser.js . 2>&1 || true

# 3. Dead code check + auto-fix (unused exports, deps)
npx knip --fix 2>&1 || true

# 4. Python dead code check (if Python project)
([ -f pyproject.toml ] || [ -f requirements.txt ]) && {
  deadcode . 2>&1 || true
}

# 5. Copy/paste detection (all languages)
npx jscpd . --reporters console 2>&1 || true

# 6. Outdated packages (informational)
npm outdated 2>&1 || true
```

## Report Format

After running, report in this format:

**Fixed:**

- [What knip auto-fixed - unused exports, dependencies]

**Errors (manual fix required):**

- [Circular dependencies - show the cycle path]
- [Layer violations - show the invalid import]
- [Python dead code - unused functions/classes from deadcode]

**Info:**

- [Unused files to review - may be intentional]
- [Code duplicates - blocks detected by jscpd]
- [Outdated packages - optional to update]
