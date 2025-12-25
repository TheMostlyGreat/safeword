# Safeword Architecture

**Version:** 1.0
**Last Updated:** 2025-12-24
**Status:** Proposed

---

## Table of Contents

- [Overview](#overview)
- [CLI Structure](#cli-structure)
- [Language Detection](#language-detection)
- [Key Decisions](#key-decisions)
- [Best Practices](#best-practices)
- [Migration Strategy](#migration-strategy)

---

## Overview

Safeword is a CLI tool that configures linting, hooks, and development guides for Claude Code projects. It supports JavaScript/TypeScript projects (ESLint, Prettier) and Python projects (Ruff, mypy).

### Tech Stack

| Category        | Choice     | Rationale                                  |
|-----------------|------------|--------------------------------------------|
| Runtime         | Bun        | Fast startup, TypeScript native            |
| Package Manager | npm/bun    | Standard for JS ecosystem                  |
| JS Linting      | ESLint     | Industry standard, extensive rule set      |
| Python Linting  | Ruff       | Fast, replaces flake8/black/isort          |
| Type Checking   | tsc / mypy | Native type checkers for each language     |

---

## CLI Structure

```text
packages/cli/
├── src/
│   ├── commands/       # CLI commands (setup, upgrade, check)
│   ├── utils/          # Detection, file ops, git
│   └── reconcile.ts    # Schema-based file management
├── templates/
│   ├── hooks/          # Claude Code hooks
│   └── commands/       # Slash command templates
```

---

## Language Detection

### Pattern: Detect Languages Before Framework

Language detection runs FIRST, before any framework-specific detection. This prevents side effects like creating package.json for Python-only projects.

```text
detectLanguages(cwd)     →  Languages { javascript, python }
       ↓
detectProjectType()      →  JS framework details (if javascript)
detectPythonType()       →  Python framework details (if python)
```

### Data Model

```typescript
// Language detection result
interface Languages {
  javascript: boolean;  // package.json exists
  python: boolean;      // pyproject.toml OR requirements.txt exists
}

// Python-specific detection
interface PythonProjectType {
  framework: 'django' | 'flask' | 'fastapi' | null;
  packageManager: 'poetry' | 'uv' | 'pip';
}

// Extended ProjectContext (packages/cli/src/schema.ts)
// Note: projectType stays REQUIRED - returns all-false for Python-only projects
interface ProjectContext {
  cwd: string;
  projectType: ProjectType;       // Unchanged - handles missing package.json
  developmentDeps: Record<string, string>;
  isGitRepo: boolean;
  languages: Languages;           // NEW
  pythonType?: PythonProjectType; // NEW - only if languages.python
}
```

**Implementation:** `packages/cli/src/utils/project-detector.ts`

---

## Key Decisions

### Graceful Linter Fallback

**Status:** Proposed
**Date:** 2025-12-24

| Field        | Value |
|--------------|-------|
| What         | Skip linter silently if not installed, rather than error |
| Why          | Hook should never block Claude's workflow; users may not have tools installed immediately |
| Trade-off    | User may not realize linting is skipped |
| Alternatives | Error on missing linter (rejected: blocks Claude), warn always (rejected: noisy) |

### TOML Parsing Without Dependencies

**Status:** Proposed
**Date:** 2025-12-24

| Field        | Value |
|--------------|-------|
| What         | Use line-based extraction for pyproject.toml instead of full TOML parser |
| Why          | No new npm dependencies; only need section detection (`[tool.poetry]`, `[tool.uv]`) |
| Trade-off    | May fail on complex TOML edge cases |
| Alternatives | @iarna/toml (rejected: adds dependency), toml-js (rejected: adds dependency) |

### Ruff in Hook, mypy in Command Only

**Status:** Proposed
**Date:** 2025-12-24

| Field        | Value |
|--------------|-------|
| What         | Lint hook runs Ruff (fast); /lint command runs mypy (slow) |
| Why          | Ruff: ms per file, safe for hooks. mypy: seconds for whole project, would block Claude |
| Trade-off    | Type errors not caught until explicit /lint run |
| Alternatives | mypy in hook with caching (rejected: still too slow), skip mypy entirely (rejected: loses value) |

---

## Best Practices

### File Extension Routing

**What:** Route files to correct linter based on extension
**Why:** Polyglot projects need both ESLint and Ruff
**Example:** See `packages/cli/templates/hooks/lib/lint.ts`

```typescript
const JS_EXTENSIONS = new Set(['js', 'jsx', 'ts', 'tsx', ...]);
const PYTHON_EXTENSIONS = new Set(['py', 'pyi']);
// Route to ESLint or Ruff based on extension
```

### Silent Linter Execution

**What:** Run linters with `.nothrow().quiet()` (Bun shell pattern)
**Why:** Matches current ESLint behavior; tool missing = silent skip, no explicit `which` check needed
**Example:** `await $\`ruff check --fix ${file}\`.nothrow().quiet();`

### Schema Language Awareness

**What:** Schema generators check `ctx.languages.javascript` before creating JS-specific files
**Why:** Prevents eslint.config.mjs, knip.json, package.json merges for Python-only projects
**Files affected:**
- `packages/cli/src/schema.ts` - managedFiles generators, jsonMerges, packages.base

---

## Migration Strategy

### From JS-Only to Polyglot Support

**Trigger:** Implementation of Python support feature

**Steps:**
1. Add `detectLanguages()` layer above `detectProjectType()`
2. Extend lint hook with Python extension routing
3. Make setup command conditional on detected languages
4. Update /lint command template with Python tooling

**Rollback:** Revert to previous version; no breaking changes to JS-only projects

---

## References

- Feature Spec: `.safeword/planning/specs/feature-python-support.md`
- Design Doc: `.safeword/planning/design/python-support.md`
- Ruff docs: https://docs.astral.sh/ruff/
- PEP 621: https://peps.python.org/pep-0621/
