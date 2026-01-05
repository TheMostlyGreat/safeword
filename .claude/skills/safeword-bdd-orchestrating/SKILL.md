---
name: bdd-orchestrating
description: BDD orchestrator for feature-level work requiring multiple scenarios. Use when user says 'add', 'implement', 'build', 'feature', 'iteration', 'phase', or work touches 3+ files with new state/flows. Also use when user runs /bdd. Do NOT use for bug fixes, typos, config changes, or 1-2 file tasks—use safeword-tdd-enforcing directly.
allowed-tools: '*'
---

# BDD Orchestrator

Behavior-first development for features. Discovery → Scenarios → Implementation.

**Iron Law:** DEFINE BEHAVIOR BEFORE IMPLEMENTATION

## Phase Tracking

Features progress through phases. Track in ticket frontmatter:

```yaml
---
type: feature
phase: implement # intake | define-behavior | scenario-gate | decomposition | implement | done
---
```

**Phase meanings:**

| Phase             | What happens                         |
| ----------------- | ------------------------------------ |
| `intake`          | Context check, discovery (Phase 0-2) |
| `define-behavior` | Writing Given/When/Then (Phase 3)    |
| `scenario-gate`   | Validating scenarios (Phase 4)       |
| `decomposition`   | Task breakdown (Phase 5)             |
| `implement`       | Outside-in TDD (Phase 6)             |
| `done`            | Cleanup, verification (Phase 7)      |

**Update phase when:**

- Completing a BDD phase → set next phase
- Handing off to TDD → set `implement`
- All scenarios pass → set `done`

---

## Resume Logic

When user references a ticket, resume work:

1. **Read ticket** → get current `phase:`
2. **Find progress** → first unchecked `[ ]` in test-definitions
3. **Check context** → read last work log entry
4. **Announce resume** → "Resuming at [phase]. Last: [log entry]."

**Resume by phase:**

| Phase             | Resume action                          |
| ----------------- | -------------------------------------- |
| `intake`          | Start context check (Phase 0-2)        |
| `define-behavior` | Continue drafting scenarios            |
| `scenario-gate`   | Continue validating scenarios          |
| `decomposition`   | Continue task breakdown                |
| `implement`       | Find first unchecked scenario, run TDD |
| `done`            | Run /verify and /audit checks          |

---

## Phase 3: Define Behavior

**Entry:** Agent enters `define-behavior` phase (after detection or resume)

**Prerequisite check:**

- If no spec exists → create minimal spec (goal, scope from user request)
- If no ticket exists → create ticket with `phase: define-behavior`

**Draft scenarios:**

1. Read spec goal/scope
2. Draft Given/When/Then scenarios covering:
   - Happy path (main success)
   - Failure modes (what can go wrong)
   - Edge cases (boundaries, empty states)
3. Present scenarios to user
4. User can add/modify/remove scenarios
5. Save to `.safeword-project/test-definitions/feature-{slug}.md`
6. Each scenario gets `[ ]` checkbox for implementation tracking

**Exit:** User approves scenario list → update ticket to `phase: scenario-gate`

---

## Phase 4: Scenario Quality Gate

**Entry:** Agent enters `scenario-gate` phase

**Validate each scenario against three criteria:**

| Criterion         | Check                          | Red flag                        |
| ----------------- | ------------------------------ | ------------------------------- |
| **Atomic**        | Tests ONE behavior             | Multiple When/Then pairs        |
| **Observable**    | Has externally visible outcome | Internal state only             |
| **Deterministic** | Same result on repeated runs   | Time/random/external dependency |

**Report issues:**

- Group by type (atomicity, observability, determinism)
- Suggest fix for each issue
- Example: "Scenario 3 tests login AND session creation. Split into two scenarios."

**Exit options:**

- All pass → update ticket to `decomposition`
- Issues found → user fixes or acknowledges → update ticket to `decomposition`

---

## Current Behavior (Iteration 3)

1. Detect work level (see SAFEWORD.md "Work Level Detection")
2. Announce with override hint
3. **If ticket exists:** Read phase, resume at appropriate point
4. **Phase 3:** Draft scenarios from spec, save to test-definitions
5. **Phase 4:** Validate scenarios (atomic, observable, deterministic)
6. **Update phase** in ticket when transitioning
7. Delegate to `safeword-tdd-enforcing` for implementation (Phase 6)
8. **REFACTOR:** Verify against guides before marking iteration complete

Future iterations add: context check, discovery, decomposition.

---

## Key Takeaways

- **patch/task** → delegate to TDD immediately
- **feature** → BDD phases first, track in ticket `phase:` field
- **Resume** → read ticket, find first unchecked scenario, continue
- When unsure → default to task, user can `/bdd` to override
