---
id: '014'
title: Consolidate BDD/TDD documentation to eliminate duplication
type: task
status: ready
priority: medium
created: 2026-01-08
related: ['013']
---

# Consolidate BDD/TDD Documentation

## Problem

Three documents describe the same BDD→TDD workflow at different levels of detail:

| Document           | Lines | Issue                                      |
| ------------------ | ----- | ------------------------------------------ |
| `SKILL.md`         | 630   | Authoritative but over 500-line limit      |
| `bdd-concept.md`   | 782   | **Unreferenced anywhere**, fully redundant |
| `testing-guide.md` | 440   | Duplicates TDD workflow from skill         |

This creates maintenance burden and drift risk.

## Analysis

See [task-bdd-guides-consolidation.md](../specs/task-bdd-guides-consolidation.md) for full analysis.

**Key findings:**

1. `bdd-concept.md` is not referenced anywhere in the codebase
2. The same mock implementation code example appears in both SKILL.md and testing-guide.md
3. SKILL.md must be self-contained per skill-authoring-guide.md
4. Test layering strategies (outside-in vs speed hierarchy) serve different purposes, not a conflict

## Scope

### In Scope

1. Delete `.safeword-project/guides/bdd-concept.md`
2. Remove TDD workflow section from `testing-guide.md` (lines 116-168)
3. Add clarifying note to `testing-guide.md` about test layering contexts

### Out of Scope

- SKILL.md compression (covered by ticket 013)
- Cursor rule splitting (covered by ticket 013)

## Acceptance Criteria

- [ ] `bdd-concept.md` deleted
- [ ] `testing-guide.md` no longer duplicates RED→GREEN→REFACTOR workflow
- [ ] `testing-guide.md` clarifies when to use speed hierarchy vs outside-in
- [ ] No broken references after deletions

## Files to Modify

1. DELETE: `.safeword-project/guides/bdd-concept.md`
2. EDIT: `.safeword/guides/testing-guide.md`
3. EDIT: `packages/cli/templates/guides/testing-guide.md` (template copy)
