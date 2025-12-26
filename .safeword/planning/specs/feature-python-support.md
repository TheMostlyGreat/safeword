# Feature Spec: Python Support

**Guide**: `.safeword/guides/planning-guide.md`
**Template**: `.safeword/templates/feature-spec-template.md`

**Feature**: Enable safeword to work with Python projects using Ruff + mypy

**Status**: ✅ Complete (4/4 stories complete)

---

## Context

Safeword's core value propositions:
1. **Philosophy/guides** (language-agnostic) - already works for Python
2. **Claude hooks** (mostly language-agnostic) - already works except lint hook
3. **Linting infrastructure** (JS/TS-specific) - needs Python support

Since Claude Code runs on Node.js, the Node dependency is not a concern - users already have it.

## Technical Constraints

### Compatibility

- [ ] Support pyproject.toml (PEP 518/621)
- [ ] Support requirements.txt (legacy detection)
- [ ] Support mixed JS/Python projects (polyglot)

### Dependencies

- [ ] Ruff for linting and formatting (de facto Python standard)
- [ ] mypy for type checking
- [ ] No new npm dependencies for Python detection

### Ruff Rule Selection (mirrors ESLint philosophy)

```toml
[tool.ruff.lint]
select = [
  "E",      # pycodestyle errors (matches @eslint/js)
  "F",      # pyflakes (matches @eslint/js)
  "B",      # bugbear (matches sonarjs)
  "S",      # bandit security (matches eslint-plugin-security)
  "SIM",    # simplify (matches sonarjs + unicorn)
  "UP",     # pyupgrade (matches unicorn)
  "I",      # isort (matches import-x)
  "ASYNC",  # async rules (matches promise plugin)
  "C90",    # complexity (matches max-complexity)
  "PT",     # pytest style (matches vitest)
]

[tool.ruff.lint.mccabe]
max-complexity = 10
```

### Design

- [ ] Config generation deferred to Phase 2 (users bring their own ruff.toml initially)
- [ ] Reuse existing reconcile/schema patterns

### Architecture Note

Current code assumes package.json exists (`ensurePackageJson()` creates one, `detectProjectType()` requires `PackageJson` input). For Python-only projects:
- Detect language before assuming JS tooling
- Skip package.json creation for Python-only projects
- Add `detectLanguages()` layer above `detectProjectType()`

---

## Story 1: Detect Python Projects

**As a** developer with a Python project
**I want** safeword to recognize my project as Python
**So that** it can apply appropriate tooling

**Acceptance Criteria**:

- [x] Detect pyproject.toml as Python project
- [x] Detect requirements.txt as fallback indicator
- [x] Add `python: boolean` to Languages interface
- [x] Detect framework: django, flask, fastapi, or null
- [x] Detect package manager: poetry, uv, pip
- [x] Work without package.json (Python-only projects)

**Implementation Status**: ✅ Complete
**Tests**: `packages/cli/src/utils/project-detector.test.ts`

**Files**:
- `packages/cli/src/utils/project-detector.ts`

---

## Story 2: Python-Aware Lint Hook

**As a** developer editing Python files with Claude
**I want** the lint hook to run Ruff on my .py files
**So that** code quality is maintained automatically

**Acceptance Criteria**:

- [x] Detect file extension in lint hook
- [x] Run `ruff check --fix` for .py files
- [x] Run `ruff format` for .py files
- [x] Continue running ESLint for .js/.ts files (polyglot support)
- [x] Skip Ruff gracefully if not installed
- [x] Skip ESLint gracefully if not installed (Python-only projects)

**Implementation Status**: ✅ Complete (pre-existing)
**Tests**: Manual verification

**Files**:
- `packages/cli/templates/hooks/lib/lint.ts`
- `packages/cli/templates/hooks/post-tool-lint.ts`

**Notes**: Ruff only in hook (fast, per-file). mypy runs in /lint command (slow, full project).

---

## Story 3: Conditional Setup for Python Projects

**As a** developer running `safeword setup` in a Python-only project
**I want** setup to skip ESLint installation
**So that** I don't get unnecessary JS tooling

**Acceptance Criteria**:

- [x] Skip ESLint/Prettier install for Python-only projects
- [x] Skip package.json creation for Python-only projects
- [x] Show Python-appropriate next steps (e.g., "pip install ruff mypy")
- [x] Still create .safeword directory with guides/templates
- [x] Still create Claude hooks

**Implementation Status**: ✅ Complete
**Tests**: `packages/cli/tests/commands/setup-python.test.ts` (6 tests)

**Files**:
- `packages/cli/src/commands/setup.ts`
- `packages/cli/src/schema.ts` (generators return null for Python-only)
- `packages/cli/src/reconcile.ts` (null check for generators)
- `packages/cli/src/utils/context.ts` (auto-detects languages)

---

## Story 4: Lint Command for Python

**As a** developer using Claude Code
**I want** the `/lint` command to work for Python
**So that** I can manually trigger full linting and type checking

**Acceptance Criteria**:

- [x] `/lint` detects Python project
- [x] Runs `ruff check --fix` and `ruff format`
- [x] Runs `mypy` for type checking (analogous to tsc for TypeScript)
- [x] Falls back to ESLint/tsc for JS/TS projects

**Implementation Status**: ✅ Complete
**Tests**: Manual testing

**Files**:
- `packages/cli/templates/commands/lint.md` (update command template)

---

## Summary

**Completed**: 4/4 stories (100%)
**Remaining**: 0/4 stories (0%)

### Phase 1: MVP (Stories 1-4)

- Story 1: Python detection ✅
- Story 2: Lint hook with Ruff ✅
- Story 3: Conditional setup ✅
- Story 4: Lint command ✅

### Phase 2: Tooling Parity (Out of Scope)

| Tool | Purpose | JS Equivalent |
|------|---------|---------------|
| [Ruff](https://docs.astral.sh/ruff/) | Config generation (`[tool.ruff]`) | eslint.config.mjs |
| [pre-commit](https://pre-commit.com/) | Git hooks | Husky + lint-staged |
| [import-linter](https://github.com/seddonym/import-linter) | Architecture validation | dependency-cruiser |
| [deadcode](https://github.com/albertas/deadcode) | Dead code detection (has `--fix`, requires Python ≥3.10) | Knip |
| [jscpd](https://github.com/kucherenko/jscpd) | Copy/paste detection | (also jscpd) |

**Note:** deadcode has `--fix` for auto-removal, aligning with safeword's philosophy.

### Phase 3: Rule Optimization (Out of Scope)

- Analyze which Ruff rules catch the most LLM-generated issues
- Remove rules with high false-positive rates
- Add new rules as Ruff evolves (track releases)
- Tune severity levels based on real-world usage
- Cross-pollinate insights between ESLint and Ruff rule sets
- Document rule selection rationale (like `.safeword/planning/linting/`)
