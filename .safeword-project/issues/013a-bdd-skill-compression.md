---
id: '013a'
title: BDD skill compression and phase-based splitting
type: feature
status: ready
priority: medium
created: 2026-01-08
parent: '013'
---

# BDD Skill Compression

## Problem

The BDD skill is 630 lines—too large for optimal LLM performance.

## Solution: Phase-Based File Structure + Skill Delegation

Split the monolithic skill into focused, phase-specific files that load on demand.

### Refactoring Delegation

**Remove Phase 6.3 REFACTOR content entirely.** Delegate all refactoring to `/refactor` skill:

| Phase        | Current                                          | Change                                                  |
| ------------ | ------------------------------------------------ | ------------------------------------------------------- |
| 6.3 REFACTOR | 28 lines inline (smells table, protocol, revert) | Replace with: "Run `/refactor` for cleanup after GREEN" |
| 7 Done Gate  | Already says "run /refactor"                     | Keep as-is                                              |

**Rationale:**

- Eliminates duplication between BDD skill and refactoring skill
- Refactoring skill has full catalog (3 tiers), characterization tests, edge cases
- BDD skill stays focused on orchestration, not specialist work

**Line savings:** ~25 lines removed from SKILL.md

### Claude Code Structure (Phase-Based References)

```
.claude/skills/safeword-bdd-orchestrating/
├── SKILL.md           (~150 lines) - Core dispatch, phase overview, resume logic
├── DISCOVERY.md       (~50 lines)  - Phase 0-2 (intake, context, stories)
├── SCENARIOS.md       (~40 lines)  - Phase 3-4 (Given/When/Then, quality gate)
├── DECOMPOSITION.md   (~35 lines)  - Phase 5 (task breakdown)
├── TDD.md             (~70 lines)  - Phase 6 (RED/GREEN, delegate /refactor)
├── DONE.md            (~30 lines)  - Phase 7 (completion checklist)
└── SPLITTING.md       (~40 lines)  - Split protocol (thresholds, examples)
```

Claude Code supports on-demand file references (one level deep). Main SKILL.md dispatches to phase files.

**Structure mirrors Cursor exactly** - same content, different format.

### Cursor Structure (Progressive Disclosure)

```
.cursor/rules/
├── bdd-core.mdc          (~90 lines)  - Dispatch, phases, resume, WHEN to split table
├── bdd-discovery.mdc     (~50 lines)  - Phase 0-2
├── bdd-scenarios.mdc     (~40 lines)  - Phase 3-4
├── bdd-decomposition.mdc (~35 lines)  - Phase 5
├── bdd-tdd.mdc           (~70 lines)  - Phase 6 (RED/GREEN only, REFACTOR delegates)
├── bdd-done.mdc          (~30 lines)  - Phase 7
└── bdd-splitting.mdc     (~40 lines)  - HOW to split (protocol, examples)
```

All files under 100 lines. Agent loads phase-specific rules based on descriptions.

### Description Patterns for Reliable Loading

| File                    | Description                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `bdd-core.mdc`          | "USE WHEN starting feature work, running /bdd, or resuming a BDD ticket. Orchestrates BDD phases."      |
| `bdd-discovery.mdc`     | "USE WHEN in BDD intake phase OR ticket has phase: intake. Guides discovery and context gathering."     |
| `bdd-scenarios.mdc`     | "USE WHEN in BDD define-behavior or scenario-gate phase. Guides Given/When/Then creation."              |
| `bdd-decomposition.mdc` | "USE WHEN in BDD decomposition phase. Guides task breakdown and component analysis."                    |
| `bdd-tdd.mdc`           | "USE WHEN in BDD implement phase. RED/GREEN cycle; run /refactor after GREEN."                          |
| `bdd-done.mdc`          | "USE WHEN in BDD done phase OR all scenarios marked [x]. Completion checklist."                         |
| `bdd-splitting.mdc`     | "USE WHEN BDD thresholds exceeded (2+ stories, >15 scenarios, >20 tasks). Split protocol and examples." |

## Expected Outcome

### Cursor

| Metric           | Before        | After                   |
| ---------------- | ------------- | ----------------------- |
| Files            | 1 (628 lines) | 7 (all under 100 lines) |
| Tokens per phase | ~600 lines    | ~90-160 lines           |
| Under 100 lines  | ❌            | ✅ All files            |

### Claude Code

| Metric            | Before        | After                             |
| ----------------- | ------------- | --------------------------------- |
| Files             | 1 (630 lines) | 7 (SKILL.md ~150 + 6 phase files) |
| SKILL.md lines    | 630           | ~150                              |
| Phase files       | N/A           | All under 100 lines               |
| On-demand loading | ❌            | ✅ Phase files load when needed   |

## Files to Create/Modify

### New Claude Code Files (in `packages/cli/templates/skills/safeword-bdd-orchestrating/`)

1. `DISCOVERY.md` - Phase 0-2
2. `SCENARIOS.md` - Phase 3-4
3. `DECOMPOSITION.md` - Phase 5
4. `TDD.md` - Phase 6
5. `DONE.md` - Phase 7
6. `SPLITTING.md` - Split protocol

### New Cursor Files (in `packages/cli/templates/cursor/rules/`)

1. `bdd-core.mdc`
2. `bdd-discovery.mdc`
3. `bdd-scenarios.mdc`
4. `bdd-decomposition.mdc`
5. `bdd-tdd.mdc`
6. `bdd-done.mdc`
7. `bdd-splitting.mdc`

### Modify

1. `packages/cli/templates/skills/safeword-bdd-orchestrating/SKILL.md` (compress to ~150 lines, add references)
2. `packages/cli/templates/cursor/rules/safeword-bdd-orchestrating.mdc` (delete, replace with split files)
3. `packages/cli/src/schema.ts` (register all new files)

## Minor Consolidation

During implementation, remove Given/When/Then format details from `planning-guide.md` (~20 lines) - BDD skill Phase 3 (bdd-scenarios.mdc) covers scenario drafting operationally.

## Acceptance Criteria

- [ ] Claude Code SKILL.md under 200 lines (dispatcher only)
- [ ] Claude Code phase files all under 100 lines
- [ ] All Cursor rules under 100 lines
- [ ] Phase 6.3 replaced with `/refactor` invocation (both platforms)
- [ ] Phase 7 runs `/refactor` for cross-scenario cleanup (both platforms)
- [ ] Verify `/refactor` skill activates when called from BDD flow
- [ ] Schema updated with all new files (6 Claude + 7 Cursor)
- [ ] Given/When/Then format removed from planning-guide.md (reference bdd-scenarios.mdc)
- [ ] Parity test: Claude and Cursor have equivalent content
