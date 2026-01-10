# Phase 3-4: Define Behavior & Scenario Gate

## Phase 3: Define Behavior

**Entry:** Agent enters `define-behavior` phase (after discovery or resume)

**Draft scenarios:**

1. Read spec goal/scope
2. Draft Given/When/Then scenarios covering:
   - Happy path (main success)
   - Failure modes (what can go wrong)
   - Edge cases (boundaries, empty states)
3. Present scenarios to user
4. User can add/modify/remove scenarios
5. Save to `.safeword-project/tickets/{id}-{slug}/test-definitions.md`
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
