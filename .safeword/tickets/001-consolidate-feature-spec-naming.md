---
id: 001
status: done
---

# Consolidate "User Stories" → "Feature Specs" Naming

**Goal:** Rename `user-stories-template.md` → `feature-spec-template.md` and update all references for consistency with TDD Enforcer terminology.

**Spec:** `.safeword/planning/specs/task-consolidate-specs-naming.md`

**Branch:** `feature/consolidate-feature-spec-naming`

---

## Work Log

- [2025-12-05 19:11] Started: Created ticket, on feature branch from latest main
- [2025-12-05 19:11] Plan: 12 files to modify (templates + project docs only)
- [2025-12-05 19:12] Phase 1: Renamed template file, updated L1 and L4 content
- [2025-12-05 19:12] Phase 2: Updated schema.ts (actual lines 187-188, not 155-156 as in plan)
- [2025-12-05 19:15] Phase 3-11: Updated all template references (SAFEWORD.md, TDD skill, guides, README)
- [2025-12-05 19:16] Phase 12: Updated promptfoo.yaml (lines 1221, 1437, 1827, 1836)
- [2025-12-05 19:41] Complete: All phases done, committed (765f625), build passes

---

## Scratch Notes

### Files to modify (from plan):

1. `packages/cli/templates/doc-templates/user-stories-template.md` → RENAME + content
2. `packages/cli/src/schema.ts` (lines 155-156)
3. `packages/cli/templates/SAFEWORD.md` (line 71)
4. `packages/cli/templates/skills/safeword-tdd-enforcer/SKILL.md` (line 54)
5. `packages/cli/templates/doc-templates/task-spec-template.md` (line 151)
6. `packages/cli/templates/guides/tdd-best-practices.md` (lines 15, 24)
7. `packages/cli/templates/guides/user-story-guide.md` (lines 5, 11, 17, 245)
8. `packages/cli/templates/doc-templates/design-doc-template.md` (line 6)
9. `packages/cli/templates/doc-templates/ticket-template.md` (lines 53, 55)
10. `packages/cli/templates/guides/architecture-guide.md` (line ~280)
11. `README.md` (lines 57, 109, 140)
12. `promptfoo.yaml` (lines 1221, 1437, 1827, 1836)

### Commit strategy:

- Commit 1: Phases 1-2 (rename + schema)
- Commit 2: Phases 3-11 (template refs)
- Commit 3: Phase 12 (promptfoo)

---

## Progress Checklist

- [x] Phase 1: Rename template file
- [x] Phase 2: Update schema
- [x] Phase 3: Update SAFEWORD.md
- [x] Phase 4: Update TDD skill
- [x] Phase 5: Update task-spec-template
- [x] Phase 6: Update tdd-best-practices guide
- [x] Phase 7: Update user-story-guide
- [x] Phase 8: Update design-doc-template
- [x] Phase 9: Update ticket-template
- [x] Phase 10: Update architecture-guide
- [x] Phase 11: Update README.md
- [x] Phase 12: Update promptfoo.yaml
- [x] Tests pass
- [x] Build succeeds
