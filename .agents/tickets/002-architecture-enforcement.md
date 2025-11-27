---
id: 002
status: in_progress
---

# Architecture Enforcement for SAFEWORD

**Goal:** Add layers/boundaries enforcement to SAFEWORD so AI agents respect architectural boundaries.

**Why:** Without guardrails, AI agents create circular dependencies, god modules, and unsafe refactoring patterns.

## Work Log

- 2025-11-27T00:00:00Z Started: Created plan at `.agents/planning/005-architecture-enforcement-system.md`
- 2025-11-27T00:00:00Z Decision: Extend `setup-linting.sh` for eslint-plugin-boundaries (not new script)
- 2025-11-27T00:00:00Z Decision: Add layers/boundaries section to existing `architecture-guide.md`
- 2025-11-27T00:00:00Z Decision: Create `prompts/` folder, extract existing quality-review prompt from `setup-quality.sh`
- 2025-11-27T00:00:00Z Decision: Drop Biome support entirely, ESLint-only with eslint-plugin-boundaries
- 2025-11-27 Implementation completed:
  - Phase 1: Added Layers & Boundaries section to `architecture-guide.md`, created `templates/architecture-template.md`
  - Phase 2: Updated `setup-linting.sh` - removed Biome mode, added eslint-plugin-boundaries to all ESLint modes
  - Phase 3: Created `framework/prompts/` with quality-review.md and arch-review.md, created `scripts/arch-review.sh`, updated setup-safeword.sh and setup-quality.sh
  - Phase 4: Created `templates/ci/architecture-check.yml`

---

## Planning Docs

- `.agents/planning/005-architecture-enforcement-system.md` - Full plan with phases, deliverables, tool selection

## Scope

**In scope:**
- Phase 1: Add layers/boundaries section to `architecture-guide.md` + create `templates/architecture-template.md`
- Phase 2: Add `eslint-plugin-boundaries` to `setup-linting.sh` + remove `--biome` mode (breaking change)
- Phase 3: Create `prompts/` folder + `arch-review.sh` script + git pre-commit hook
- Phase 4: CI workflow template `templates/ci/architecture-check.yml`

**Out of scope:**
- Phase 5 (Drift detection) - Deferred
- Python support - Future phase
- Biome support (dropped - ESLint only)

## Acceptance Criteria

- [x] `architecture-guide.md` has Layers & Boundaries section with:
  - [x] Layer definitions table
  - [x] Allowed dependencies matrix
  - [x] Edge cases (non-3-layer, brownfield, shared utilities)
- [x] `templates/architecture-template.md` created with layers/boundaries section
- [x] `setup-linting.sh` adds `eslint-plugin-boundaries` to all ESLint modes
- [x] `setup-linting.sh` removes `--biome` mode (breaking change)
- [x] `architecture-guide.md` includes boundary rule setup instructions
- [x] `framework/prompts/` folder created (copied to `.safeword/prompts/` by setup)
- [x] `prompts/quality-review.md` extracted from `setup-quality.sh`
- [x] `prompts/arch-review.md` - semantic architecture review prompt
- [x] `scripts/arch-review.sh` - calls Haiku API for arch review
- [x] Git pre-commit hook runs `eslint` + `arch-review.sh` on staged files
- [x] `setup-safeword.sh` updated to copy `prompts/` folder + install pre-commit hook
- [x] `setup-quality.sh` updated to reference `.safeword/prompts/quality-review.md`
- [x] `templates/ci/architecture-check.yml` GitHub Actions workflow
- [ ] All tests pass
- [ ] User confirms completion

## Implementation Notes

**Key Design Decisions:**
- ESLint-only (drop Biome support) - simpler, better IDE integration
- Boundaries via `eslint-plugin-boundaries` - integrated with existing linting
- Add to existing `architecture-guide.md` rather than new guide (single source of truth)
- Prompts return structured JSON (per `llm-prompting.md` best practices)
- Template allows direct app→infra (note hexagonal alternative)

