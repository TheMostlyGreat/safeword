# Feature Spec: Python Support

**Guide**: `.safeword/guides/planning-guide.md`
**Template**: `.safeword/templates/feature-spec-template.md`

**Feature**: Enable safeword to work with Python projects using Ruff + mypy

**Status**: ❌ Not Started (0/4 stories complete)

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

### Design

- [ ] Config generation deferred to Phase 2 (users bring their own ruff.toml initially)
- [ ] Reuse existing reconcile/schema patterns

---

## Story 1: Detect Python Projects

**As a** developer with a Python project
**I want** safeword to recognize my project as Python
**So that** it can apply appropriate tooling

**Acceptance Criteria**:

- [ ] Detect pyproject.toml as Python project
- [ ] Detect requirements.txt as fallback indicator
- [ ] Add `python: boolean` to ProjectType interface
- [ ] Detect framework: django, flask, fastapi, or null
- [ ] Detect package manager: poetry, uv, pip

**Implementation Status**: ❌ Not Started
**Tests**: `packages/cli/src/utils/project-detector.test.ts`

**Files**:
- `packages/cli/src/utils/project-detector.ts`

---

## Story 2: Python-Aware Lint Hook

**As a** developer editing Python files with Claude
**I want** the lint hook to run Ruff on my .py files
**So that** code quality is maintained automatically

**Acceptance Criteria**:

- [ ] Detect file extension in lint hook
- [ ] Run `ruff check --fix` for .py files
- [ ] Run `ruff format` for .py files
- [ ] Continue running ESLint for .js/.ts files
- [ ] Skip linting gracefully if Ruff not installed

**Implementation Status**: ❌ Not Started
**Tests**: `packages/cli/tests/integration/hooks.test.ts`

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

- [ ] Skip ESLint/Prettier install for Python-only projects
- [ ] Show Python-appropriate next steps
- [ ] Still create .safeword directory with guides/templates
- [ ] Still create Claude hooks

**Implementation Status**: ❌ Not Started
**Tests**: `packages/cli/tests/commands/setup-python.test.ts`

**Files**:
- `packages/cli/src/commands/setup.ts`
- `packages/cli/src/utils/install.ts`

---

## Story 4: Lint Command for Python

**As a** developer using Claude Code
**I want** the `/lint` command to work for Python
**So that** I can manually trigger full linting and type checking

**Acceptance Criteria**:

- [ ] `/lint` detects Python project
- [ ] Runs `ruff check --fix` and `ruff format`
- [ ] Runs `mypy` for type checking (analogous to tsc for TypeScript)
- [ ] Falls back to ESLint/tsc for JS/TS projects

**Implementation Status**: ❌ Not Started
**Tests**: Manual testing

**Files**:
- `packages/cli/templates/commands/lint.md` (update command template)

---

## Summary

**Completed**: 0/4 stories (0%)
**Remaining**: 4/4 stories (100%)

### Phase 1: MVP (Stories 1-4)

- Story 1: Python detection
- Story 2: Lint hook with Ruff
- Story 3: Conditional setup
- Story 4: Lint command

### Phase 2: Future (Out of Scope)

- Config generation (add `[tool.ruff]` to pyproject.toml)
- Pre-commit.yaml generation (replaces Husky + lint-staged)
- import-linter config (architecture validation, replaces dependency-cruiser)
- Vulture integration (dead code detection, replaces Knip)
- Python framework-specific configs (Django, FastAPI)

**Next Steps**: Implement Story 1 (Python detection)
