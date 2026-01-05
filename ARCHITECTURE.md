# Safeword Architecture

**Version:** 1.3
**Last Updated:** 2026-01-05
**Status:** Production

---

## Table of Contents

- [Overview](#overview)
- [Monorepo Structure](#monorepo-structure)
- [CLI Structure](#cli-structure)
- [Language Packs](#language-packs)
- [Language Detection](#language-detection)
- [Key Decisions](#key-decisions)
- [Best Practices](#best-practices)
- [Migration Strategy](#migration-strategy)

---

## Overview

Safeword is a CLI tool that configures linting, hooks, and development guides for Claude Code projects. It supports JavaScript/TypeScript projects (ESLint, Prettier), Python projects (Ruff, mypy), and Go projects (golangci-lint).

### Tech Stack

| Category        | Choice        | Rationale                              |
| --------------- | ------------- | -------------------------------------- |
| Runtime         | Bun           | Fast startup, TypeScript native        |
| Package Manager | npm/bun       | Standard for JS ecosystem              |
| JS Linting      | ESLint        | Industry standard, extensive rule set  |
| Python Linting  | Ruff          | Fast, replaces flake8/black/isort      |
| Go Linting      | golangci-lint | Aggregates 100+ linters, fast          |
| Type Checking   | tsc / mypy    | Native type checkers for each language |

---

## Monorepo Structure

```text
packages/
├── cli/            # Main CLI tool (bunx safeword)
├── eslint-plugin/  # ESLint plugin with LLM-optimized rules
└── website/        # Documentation site (Astro/Starlight)
```

| Package                   | Purpose                                           | Published As             |
| ------------------------- | ------------------------------------------------- | ------------------------ |
| `packages/cli/`           | CLI that installs hooks, guides, linting configs  | `safeword`               |
| `packages/eslint-plugin/` | ESLint plugin with rules optimized for LLM agents | `eslint-plugin-safeword` |
| `packages/website/`       | Documentation website                             | Private (not published)  |

**Dependency:** CLI depends on eslint-plugin (`eslint-plugin-safeword: workspace:^`)

---

## CLI Structure

```text
packages/cli/
├── src/
│   ├── commands/       # CLI commands (setup, upgrade, check, diff, reset)
│   ├── packs/          # Language packs + registry
│   │   ├── {lang}/     # index.ts, files.ts, setup.ts per language
│   │   ├── registry.ts # Central pack registry and detection
│   │   ├── config.ts   # Pack config management (.safeword/config.json)
│   │   ├── install.ts  # Pack installation logic
│   │   └── types.ts    # Shared type definitions
│   ├── templates/      # Template content helpers
│   ├── utils/          # Detection, file ops, git, version
│   ├── schema.ts       # Single source of truth for all managed files
│   └── reconcile.ts    # Schema-based file management
├── templates/
│   ├── SAFEWORD.md     # Core instructions (installed to .safeword/)
│   ├── AGENTS.md       # Project context template
│   ├── commands/       # Slash commands (/lint, /audit, /drift)
│   ├── cursor/         # Cursor IDE rules (.mdc files)
│   ├── doc-templates/  # Feature specs, design docs, tickets
│   ├── guides/         # Methodology guides (TDD, planning, etc.)
│   ├── hooks/          # Claude Code hooks (lint, quality review)
│   ├── prompts/        # Prompt templates for commands
│   ├── scripts/        # Shell scripts (cleanup, bisect)
│   └── skills/         # Claude Code skills (debugging, TDD, etc.)
```

---

## Language Packs

### Pattern: Modular Language Support

Language-specific tooling (detection, config generation, setup) is encapsulated in **language packs**. Each pack implements a standard interface, enabling consistent multi-language support.

```typescript
interface LanguagePack {
  id: string; // e.g., 'python', 'typescript', 'golang'
  name: string; // e.g., 'Python', 'TypeScript', 'Go'
  extensions: string[]; // e.g., ['.py', '.pyi']
  detect: (cwd: string) => boolean; // Is this language present?
  setup: (cwd: string, ctx: SetupContext) => SetupResult;
}

// Registry
const LANGUAGE_PACKS: Record<string, LanguagePack> = {
  python: pythonPack,
  typescript: typescriptPack,
  golang: golangPack,
};
```

### Pack File Structure

**Root files** (shared infrastructure):

| File          | Purpose                                              |
| ------------- | ---------------------------------------------------- |
| `registry.ts` | Central registry, `detectLanguages()`, pack lookup   |
| `config.ts`   | Read/write `.safeword/config.json` (installed packs) |
| `install.ts`  | Pack installation orchestration                      |
| `types.ts`    | Shared types (`LanguagePack`, `ProjectContext`)      |

**Per-language packs** (3-file pattern):

```text
packs/{lang}/
├── index.ts   # LanguagePack interface implementation
├── files.ts   # ownedFiles, managedFiles, jsonMerges exports
└── setup.ts   # Setup utilities (language-specific tooling)
```

**Exports from files.ts:**

- `{lang}OwnedFiles` - Files overwritten on upgrade
- `{lang}ManagedFiles` - Files created if missing
- `{lang}JsonMerges` - JSON keys to merge (TypeScript only)
- `{lang}Packages` - NPM packages to install (TypeScript only)

These exports are spread into `schema.ts` for the reconciliation engine.

**Implementation:** `packages/cli/src/packs/`

### Config Schema

Installed packs tracked in `.safeword/config.json`:

```json
{
  "version": "0.15.0",
  "installedPacks": ["python", "typescript", "golang"]
}
```

---

## Language Detection

### Pattern: Detect Languages Before Framework

Language detection runs FIRST, before any framework-specific detection. This prevents side effects like creating package.json for Python-only projects.

```text
detectLanguages(cwd)     →  Languages { javascript, python, golang }
       ↓
detectProjectType()      →  ProjectType (if javascript)
detectPythonType()       →  PythonProjectType (if python)
```

### Data Model

```typescript
// Detection functions
function detectLanguages(cwd: string): Languages;
function detectPythonType(cwd: string): PythonProjectType | undefined;

// Language detection result
interface Languages {
  javascript: boolean; // package.json exists
  python: boolean; // pyproject.toml OR requirements.txt exists
  golang: boolean; // go.mod exists
}

// Python-specific detection (returned only if languages.python)
interface PythonProjectType {
  framework: 'django' | 'flask' | 'fastapi' | null;
  packageManager: 'poetry' | 'uv' | 'pip';
}

// Extended ProjectContext (packages/cli/src/schema.ts)
// Note: projectType stays REQUIRED - returns all-false for Python-only projects
interface ProjectContext {
  cwd: string;
  projectType: ProjectType; // Unchanged - handles missing package.json
  developmentDeps: Record<string, string>;
  isGitRepo: boolean;
  languages: Languages; // NEW
  // pythonType?: PythonProjectType; // Phase 2 - for framework-specific configs
}
```

**Implementation:** `packages/cli/src/utils/project-detector.ts`

---

## Key Decisions

### Graceful Linter Fallback

**Status:** Accepted
**Date:** 2025-12-24

| Field          | Value                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| What           | Skip linter silently if not installed, rather than error                                  |
| Why            | Hook should never block Claude's workflow; users may not have tools installed immediately |
| Trade-off      | User may not realize linting is skipped                                                   |
| Alternatives   | Error on missing linter (rejected: blocks Claude), warn always (rejected: noisy)          |
| Implementation | `packages/cli/templates/hooks/lib/lint.ts` - uses `.nothrow().quiet()`                    |

### TOML Parsing Without Dependencies

**Status:** Accepted
**Date:** 2025-12-24

| Field          | Value                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| What           | Use line-based extraction for pyproject.toml instead of full TOML parser            |
| Why            | No new npm dependencies; only need section detection (`[tool.poetry]`, `[tool.uv]`) |
| Trade-off      | May fail on complex TOML edge cases                                                 |
| Alternatives   | @iarna/toml (rejected: adds dependency), toml-js (rejected: adds dependency)        |
| Implementation | `packages/cli/src/utils/project-detector.ts`                                        |

### Ruff in Hook, mypy in Command Only

**Status:** Accepted
**Date:** 2025-12-24

| Field          | Value                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| What           | Lint hook runs Ruff (fast); /lint command runs mypy (slow)                                           |
| Why            | Ruff: ms per file, safe for hooks. mypy: seconds for whole project, would block Claude               |
| Trade-off      | Type errors not caught until explicit /lint run                                                      |
| Alternatives   | mypy in hook with caching (rejected: still too slow), skip mypy entirely (rejected: loses value)     |
| Implementation | Hook: `packages/cli/templates/hooks/lib/lint.ts`; Command: `packages/cli/templates/commands/lint.md` |

### Bundled Language Packs (No External Packages)

**Status:** Accepted
**Date:** 2025-12-26

| Field          | Value                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| What           | Language packs are bundled in safeword core, not separate npm packages                                  |
| Why            | Simpler distribution, no version matrix, always in sync with CLI                                        |
| Trade-off      | Can't add languages without safeword release                                                            |
| Alternatives   | Separate npm packages (rejected: version coordination complexity), user-defined packs (deferred: YAGNI) |
| Implementation | `packages/cli/src/packs/*.ts`                                                                           |

---

## Best Practices

### File Extension Routing

**What:** Route files to correct linter based on extension
**Why:** Polyglot projects need ESLint, Ruff, and golangci-lint
**Example:** See `packages/cli/templates/hooks/lib/lint.ts`

```typescript
const JS_EXTENSIONS = new Set(['js', 'jsx', 'ts', 'tsx', ...]);
const PYTHON_EXTENSIONS = new Set(['py', 'pyi']);
const GO_EXTENSIONS = new Set(['go']);
// Route to ESLint, Ruff, or golangci-lint based on extension
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

- Feature Spec (Python): `.safeword/planning/specs/feature-python-support.md`
- Feature Spec (Language Packs): `.safeword/planning/specs/feature-language-packs.md`
- Design Doc (Language Packs): `.safeword/planning/design/language-packs.md`
- Language Pack Spec: `packages/cli/src/packs/LANGUAGE_PACK_SPEC.md`
- Ruff docs: https://docs.astral.sh/ruff/
- golangci-lint docs: https://golangci-lint.run/
- PEP 621: https://peps.python.org/pep-0621/
