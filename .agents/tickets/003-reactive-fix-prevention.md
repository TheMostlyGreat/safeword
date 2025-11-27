---
id: 003
status: todo
---

# Reactive Fix Prevention

**Goal:** Stop agents from falling into "error-fix-error" loops by forcing architectural awareness and planning before changes.

**Why:** Without guardrails, agents fix reactively—creating cascading problems, ignoring root causes, and violating architectural boundaries.

## Work Log

**Purpose:** Track what you've tried so you don't repeat dead ends or lose context.

**CRITICAL: Re-read this ticket before each significant action to stay on track.**

---

- 2025-11-27T12:00:00Z Started: Created ticket based on AI research into reactive fix patterns
- 2025-11-27T12:00:00Z Research: Reviewed MASAI, ProSEA, Factored Agents papers + DEV.to article
- 2025-11-27T12:00:00Z Finding: Documentation alone insufficient—need active enforcement + planning phases
- 2025-11-27T12:00:00Z Created: Research summary at `.agents/planning/006-reactive-fix-prevention-research.md`
- 2025-11-27T12:00:00Z Created: User stories at `.agents/planning/user-stories/003-reactive-fix-prevention.md`

---

## Planning Docs

- `.agents/planning/user-stories/003-reactive-fix-prevention.md`
- `.agents/planning/006-reactive-fix-prevention-research.md`

## Scope

**In scope:**
- Add "Before ANY Error Fix" section to SAFEWORD.md
- Add "Red Flags (Stop and Think)" section to SAFEWORD.md
- Update systematic-debugging skill with architecture context loading
- Add reactive fix prevention guidance to code-philosophy.md
- Sync all changes to packages/cli/templates/

**Out of scope:**
- New tooling (covered by ticket 002)
- CI integration (covered by ticket 002)
- Automated change counting hooks (future enhancement)

## Acceptance Criteria

- [ ] User stories complete and validated
- [ ] "Before ANY Error Fix" section in SAFEWORD.md
- [ ] "Red Flags (Stop and Think)" section in SAFEWORD.md
- [ ] systematic-debugging skill updated with architecture context loading step
- [ ] code-philosophy.md updated with reactive fix prevention
- [ ] Changes synced to packages/cli/templates/
- [ ] User confirms completion
