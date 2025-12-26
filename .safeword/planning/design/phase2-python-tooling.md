# Design: Python Tooling Parity (Phase 2)

**Related**: Spec: `.safeword/planning/specs/feature-python-support.md` | Tests: `.safeword/planning/test-definitions/phase2-python-tooling.md` | Architecture: `ARCHITECTURE.md`

**TDD Note**: Each component references its test suite from Test Definitions.

**Status**: GREEN Phase (complete - all 8 tests pass)

---

## Architecture

Extends Phase 1 Python support with tooling parity to JS ecosystem. Adds config generation for Ruff, pre-commit hooks, architecture validation, and audit capabilities.

```text
safeword setup (extended)        safeword audit (new)
       ↓                                ↓
RuffConfigGenerator              DeadcodeIntegration
PreCommitGenerator               JscpdIntegration
ImportLinterIntegration
```

---

## Components

### Component 5: RuffConfigGenerator

**What**: Generates `[tool.ruff]` section mirroring ESLint rule philosophy
**Where**: `packages/cli/src/schema.ts` (new managedFile), `packages/cli/src/utils/toml.ts` (new)
**Interface**:

```typescript
// New managedFile generator
managedFiles['pyproject.toml [tool.ruff]'] = (ctx) => {
  if (!ctx.languages.python) return { content: null };
  return { content: generateRuffConfig() };
};

// TOML section merge (similar to JSON merge)
function mergeTomlSection(existing: string, section: string, content: string): string;
```

**Dependencies**: Node.js `fs`, no TOML parser (line-based merge)
**Tests**: Suite 1 (Test 1.1)

**Config Content** (from spec):
```toml
[tool.ruff.lint]
select = ["E", "F", "B", "S", "SIM", "UP", "I", "ASYNC", "C90", "PT"]

[tool.ruff.lint.mccabe]
max-complexity = 10
```

### Component 6: PreCommitGenerator

**What**: Generates `.pre-commit-config.yaml` with Ruff hooks
**Where**: `packages/cli/src/schema.ts` (new managedFile)
**Interface**:

```typescript
managedFiles['.pre-commit-config.yaml'] = (ctx) => {
  if (!ctx.languages.python) return { content: null };
  if (!ctx.isGitRepo) return { content: null };
  return { content: generatePreCommitConfig() };
};
```

**Dependencies**: Git repo detection (existing)
**Tests**: Suite 2 (Test 2.1)

**Config Content**:
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.14.10  # update to latest at implementation time
    hooks:
      - id: ruff-check
        args: [--fix]
      - id: ruff-format
```

### Component 7: ImportLinterIntegration

**What**: Generates `[tool.importlinter]` contracts for layer architecture
**Where**: `packages/cli/src/schema.ts` (new managedFile section)
**Interface**:

```typescript
// Only for projects with detected layer structure
managedFiles['pyproject.toml [tool.importlinter]'] = (ctx) => {
  if (!ctx.languages.python) return { content: null };
  const layers = detectLayers(ctx.cwd); // domain, services, api, etc.
  if (!layers.length) return { content: null };
  return { content: generateImportLinterConfig(layers) };
};
```

**Dependencies**: Layer detection heuristic (new), import-linter CLI (Python ≥3.10)
**Tests**: Suite 3 (Test 3.1)

### Component 8: DeadcodeIntegration

**What**: Runs deadcode in `/audit` command for Python projects
**Where**: `packages/cli/templates/commands/audit.md`
**Interface**:

```bash
# In /audit skill
([ -f pyproject.toml ] || [ -f requirements.txt ]) && {
  deadcode . 2>&1 || true
  # Optional: deadcode --fix . (prompts user first)
}
```

**Dependencies**: deadcode CLI (Python ≥3.10 required)
**Tests**: Suite 4 (Test 4.1)

### Component 9: JscpdIntegration

**What**: Runs jscpd in `/audit` command for all projects
**Where**: `packages/cli/templates/commands/audit.md`
**Interface**:

```bash
# In /audit skill (language-agnostic)
npx jscpd . --reporters console 2>&1 || true
```

**Dependencies**: jscpd (npm, works with 150+ languages)
**Tests**: Suite 5 (Test 5.1)

---

## Component Interaction

**Setup Flow (extended)**:

```text
setup()
  → languages = detectLanguages(cwd)
  → if languages.python:
      → mergeTomlSection(pyproject.toml, '[tool.ruff]', ruffConfig)
      → if isGitRepo: write .pre-commit-config.yaml
      → if hasLayers: mergeTomlSection(pyproject.toml, '[tool.importlinter]', contracts)
  → existing setup flow...
```

**Audit Flow**:

```text
/audit skill invoked
  → Python detected? → deadcode .
  → npx jscpd . (always, language-agnostic)
  → existing knip/dependency-cruiser for JS
```

---

## User Flow

### Python project setup
1. User runs `safeword setup` with pyproject.toml
2. System adds `[tool.ruff]` config to pyproject.toml
3. System creates `.pre-commit-config.yaml` (if git repo)
4. User sees: "Run `pre-commit install`"

### Audit command
1. User runs `/audit`
2. System runs deadcode (Python) + jscpd (all) + knip (JS)
3. User sees unused code + duplicates report

---

## Key Decisions

### Decision 1: deadcode Over Vulture

**What**: Use deadcode instead of Vulture for dead code detection
**Why**: Has `--fix` flag for auto-removal; actively maintained; similar detection
**Trade-off**: Requires Python ≥3.10

### Decision 2: jscpd as Language-Agnostic

**What**: Use jscpd for all projects, not just Python
**Why**: Works with 150+ languages; consistent audit experience
**Trade-off**: Requires Node.js (but Claude Code already requires it)

---

## Implementation Notes

**Architecture Reference**: TOML parsing approach in `ARCHITECTURE.md` → "TOML Parsing Without Dependencies"

**Constraints**:
- No TOML parser dependency
- deadcode and import-linter require Python ≥3.10
- pre-commit only for git repos
- Interface code is illustrative; adapt to actual schema patterns during implementation

**Error Handling**:
- Missing tools skip silently (consistent with Phase 1)
- Invalid pyproject.toml → warn, don't crash

**Gotchas**:
- pre-commit file is `.pre-commit-config.yaml` (not `pre-commit.yaml`)
- deadcode exit code non-zero when finding dead code (not an error)
- jscpd is detection-only (no auto-fix)
- `npx jscpd` works without package.json (downloads to cache)

**Open Questions**:
- [x] Layer detection heuristic - **RESOLVED**: Mirror `boundaries.ts` approach with predefined Python layers:
  - `domain`: domain/, models/, entities/, core/
  - `services`: services/, usecases/, application/
  - `infra`: infra/, infrastructure/, adapters/, repositories/
  - `api`: api/, routes/, handlers/, views/, controllers/
- [ ] pre-commit rev pinning - auto-update mechanism?

---

## References

- Ruff: https://docs.astral.sh/ruff/
- pre-commit: https://pre-commit.com/
- import-linter: https://github.com/seddonym/import-linter
- deadcode: https://github.com/albertas/deadcode
- jscpd: https://github.com/kucherenko/jscpd
