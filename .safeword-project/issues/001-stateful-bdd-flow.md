---
id: 001
type: feature
phase: implement
status: in_progress
created: 2026-01-04T15:38:00Z
last_modified: 2026-01-04T15:38:00Z
---

# Stateful BDD Flow

**Goal:** Agent knows where it is in BDD workflow and acts accordingly.

**Why:** Enforce behavior-first development with proper phase gates and outside-in TDD.

## Snowflake Implementation Order

| Iter | Stories         | Capability                 | Deliverable                               |
| ---- | --------------- | -------------------------- | ----------------------------------------- |
| 1    | 1, 11 (partial) | Detection + announcement   | "Feature detected" → handoff to TDD       |
| 2    | 9, 11 (partial) | Phase tracking + resume    | Ticket `phase:` field, resume mid-feature |
| 3    | 4, 5            | Scenarios (Phase 3-4)      | Draft + validate Given/When/Then          |
| 4    | 2, 3, 11        | Discovery (Phase 0-2)      | Context check + optional spitballing      |
| 5    | 6, 7, 8, 11     | Implementation (Phase 5-7) | Outside-in TDD, done checklist            |
| 6    | 10              | Decomposition              | Split suggestions at thresholds           |
| 7    | 12              | Phase-aware quality        | Review adapts to current phase            |

## Planning Docs

- `.safeword-project/specs/feature-stateful-bdd-flow.md`

## Work Log

---

- 2026-01-06T03:05:00Z Complete: Iteration 4 - Phase 0-2 (Context Check & Discovery) - 9 scenarios, added to BDD skill
- 2026-01-06T01:45:00Z Complete: Story 12 - Phase-aware quality review (stop hook reads ticket phase, adapts prompts)
- 2026-01-05T05:55:00Z Refactor: Verified Iteration 3 against LLM guide and skill authoring guide (134 lines, all checks pass)
- 2026-01-05T05:45:00Z Complete: Iteration 3 - Phase 3 & 4 (10 scenarios passing)
- 2026-01-05T05:40:00Z Implement: Added Phase 3 and Phase 4 sections to BDD skill
- 2026-01-05T05:35:00Z Phase 4: Scenarios approved (10 scenarios), entering implementation
- 2026-01-05T03:50:00Z Phase 3: Defined Iteration 3 scenarios (10 scenarios for Phase 3-4 behavior)
- 2026-01-05T00:10:00Z Complete: Iteration 2 - Phase Tracking + Resume (11 scenarios passing)
- 2026-01-05T00:08:00Z Implement: Updated BDD skill with phase tracking and resume logic
- 2026-01-05T00:06:00Z Implement: Added type/phase fields to ticket template with valid values
- 2026-01-05T00:05:00Z Phase 3: Defined Iteration 2 scenarios (11 scenarios for phase tracking + resume)
- 2026-01-04T17:10:00Z Docs: Created schema-registration-guide.md, added /verify-schema command to spec
- 2026-01-04T17:05:00Z Fix: Updated skill-authoring-guide with Schema Registration section to prevent future misses
- 2026-01-04T16:35:00Z Fix: Added BDD skill + /bdd /tdd commands to schema.ts (were missing!), created Cursor rule
- 2026-01-04T16:25:00Z Refactor: Updated all stale references (enforcing-tdd→tdd-enforcing, safeword-bdd→safeword-bdd-orchestrating)
- 2026-01-04T16:20:00Z Refactor: Renamed TDD skill folder to safeword-tdd-enforcing, updated skill authoring guide with keyword-first pattern
- 2026-01-04T16:15:00Z Refactor: Fixed skill name to gerund, removed bloat (139→93 lines)
- 2026-01-04T16:10:00Z Refactor: Simplified /bdd command to match Iter 1 scope, verified cross-refs
- 2026-01-04T16:08:00Z Refactor: Added examples and edge cases to SKILL.md per LLM guide
- 2026-01-04T16:05:00Z Complete: Iteration 1 Walking Skeleton - all 10 scenarios passing
- 2026-01-04T16:00:00Z Created: /bdd and /tdd override commands
- 2026-01-04T15:55:00Z Created: safeword-bdd skill with detection algorithm
- 2026-01-04T15:45:00Z Phase 3: Created test definitions for Iteration 1 (10 scenarios)
- 2026-01-04T15:38:00Z Created: Ticket and Snowflake implementation order

---
