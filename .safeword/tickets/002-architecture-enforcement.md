---
id: 002
status: in_progress
---

# Architecture Enforcement for SAFEWORD

**Goal:** Add layers/boundaries enforcement to SAFEWORD so AI agents respect architectural boundaries.

**Why:** Without guardrails, AI agents create circular dependencies, god modules, and unsafe refactoring patterns.

## Work Log

- 2025-11-27T00:00:00Z Started: Created plan at `.safeword/planning/005-architecture-enforcement-system.md`
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

- `.safeword/planning/005-architecture-enforcement-system.md` - Full plan with phases, deliverables, tool selection

## User Stories

**Source:** Stories 1-11 from `001-guides-review-user-stories.md` (documentation guidance). Stories 12-19 added for enforcement/tooling.

---

### Story 12: Layer Definition Guidance ✅

**As a** developer setting up a new project
**I want** clear layer definitions (app, domain, infra, shared) with responsibilities
**So that** I know how to organize code from the start

**Acceptance Criteria:**

- [x] Layer definitions table in `architecture-guide.md`
- [x] Each layer has directory and responsibility defined
- [x] `architecture-template.md` includes same structure

---

### Story 13: Dependency Rules ✅

**As a** developer writing cross-layer code
**I want** an allowed dependencies matrix showing what can import what
**So that** I avoid circular dependencies and leaky abstractions

**Acceptance Criteria:**

- [x] Matrix shows from/to/allowed/rationale
- [x] Forbidden imports marked with ❌
- [x] Rationale explains why each rule exists

---

### Story 14: Edge Case Handling ✅

**As a** developer with non-standard project structure
**I want** documented edge cases (brownfield, monorepo, non-3-layer)
**So that** I can adapt boundary rules to my situation

**Acceptance Criteria:**

- [x] Edge cases table in guide
- [x] Solutions for each scenario
- [x] Brownfield adoption path (warnings-only → incremental fix → enforce)

---

### Story 15: Static Boundary Enforcement ✅

**As a** developer
**I want** boundary violations caught by ESLint
**So that** I see errors immediately in IDE and CI

**Acceptance Criteria:**

- [x] `eslint-plugin-boundaries` added by `setup-linting.sh`
- [x] Setup instructions + common issues in `architecture-guide.md`

---

### Story 16: LLM Architecture Review ✅

**As a** developer committing changes
**I want** an LLM to review for architectural anti-patterns
**So that** semantic issues are caught that static analysis misses

**Acceptance Criteria:**

- [x] `arch-review.sh` calls Haiku API
- [x] Returns JSON verdict: `clean` | `minor` | `refactor_needed`
- [x] Reviews against `ARCHITECTURE.md` if present
- [x] Checks for: misplaced logic, god modules, leaky abstractions, tight coupling, boundary violations

---

### Story 17: Pre-commit Enforcement ✅

**As a** developer
**I want** boundary violations to block my commit
**So that** architectural issues are caught before code review

**Acceptance Criteria:**

- [x] Pre-commit hook runs eslint + arch-review.sh
- [x] Lint errors block commit
- [x] `refactor_needed` verdict blocks commit
- [x] `minor` verdict warns but allows commit

---

### Story 18: CI Architecture Check ✅

**As a** team lead
**I want** PRs checked for boundary violations in CI
**So that** architectural issues can't slip through code review

**Acceptance Criteria:**

- [x] `architecture-check.yml` template provided
- [x] Runs tsc, eslint (with boundaries), optional LLM review
- [x] LLM review is non-blocking (advisory only)

---

### Story 19: Architecture Template ✅

**As a** developer starting a new project
**I want** a pre-filled `ARCHITECTURE.md` template
**So that** I have the right structure without starting from scratch

**Acceptance Criteria:**

- [x] All required sections present (Overview, Layers, Data Model, Decisions, Best Practices, Migration)
- [x] Layers & dependencies pre-filled (same rules as guide)
- [x] Key Decisions format: What/Why/Trade-off/Alternatives

---

### Prior Stories (Documentation Guidance)

From `001-guides-review-user-stories.md` → `### architecture-guide.md`:

| #   | Story                                 | Summary                                        | Status |
| --- | ------------------------------------- | ---------------------------------------------- | ------ |
| 1   | Single Comprehensive Architecture Doc | One `ARCHITECTURE.md` per project at root      | ✅     |
| 2   | Design Doc Simplicity                 | Design docs reference arch doc, no duplication | ✅     |
| 3   | Decision Matrix                       | Tech/data → arch doc; feature → design doc     | ✅     |
| 4   | Code References                       | Key patterns linked to files with line ranges  | ✅     |
| 6   | TDD Workflow Integration              | Architecture doc reviewed before coding        | ✅     |
| 8   | Triggers to Update Architecture Doc   | New data models, tech choices trigger updates  | ✅     |
| 9   | Common Mistakes                       | No ADR sprawl; keep one comprehensive doc      | ✅     |
| 11  | Data Architecture Guidance            | Linked guide for data-heavy projects           | ✅     |

---

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
