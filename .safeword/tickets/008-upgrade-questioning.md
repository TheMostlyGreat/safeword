---
id: 008
status: pending
created: 2025-11-27
github: https://github.com/TheMostlyGreat/safeword/issues/4
---

# Upgrade Questioning - Requirements Gathering

**Goal:** Add proactive questioning for requirements gathering BEFORE implementation, not just during quality review.

**Why:** Current questioning only happens in quality review (after changes). Need questioning skill for upfront requirements clarification.

## Problem

Agent often starts implementing without clarifying:

- Ambiguous requirements
- Missing acceptance criteria
- Undefined edge cases
- Technology preferences

**Result:** Rework, wrong direction, wasted cycles.

## Scope

**New capability:** Requirements questioning skill

**Key scenarios:**

1. **Feature request** - Clarify scope, acceptance criteria, constraints
2. **Bug report** - Clarify repro steps, expected behavior, severity
3. **Refactoring** - Clarify goals, constraints, risk tolerance
4. **Design decision** - Clarify priorities, trade-offs, timeline

**Question protocol:**

- Ask upfront (before implementation)
- Limit to 2-3 key questions
- Provide defaults/assumptions if user doesn't answer
- Document answers in ticket/planning docs

## Deliverables

- `framework/skills/requirements-questioning/SKILL.md`
- Integration with ticket system (questions → ticket answers)
- Update SAFEWORD.md workflow with questioning step

## Acceptance Criteria

- [ ] Skill file with clear triggers and protocol
- [ ] Question templates for each scenario
- [ ] Integration with planning docs workflow
- [ ] Maximum question limits to avoid fatigue

## Work Log

- 2025-11-27 Created ticket
