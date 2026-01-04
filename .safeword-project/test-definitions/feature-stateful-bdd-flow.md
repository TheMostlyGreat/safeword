# Test Definitions: Stateful BDD Flow

**Spec**: `.safeword-project/specs/feature-stateful-bdd-flow.md`
**Ticket**: `.safeword-project/issues/001-stateful-bdd-flow.md`

---

## Iteration 1: Walking Skeleton (Detection + Announcement)

### Suite 1: Work Level Detection

#### Scenario 1.1: Detect feature-level work ✅

**Given** user says "add dark mode toggle"
**When** agent analyzes the request
**Then** agent detects `feature` level (3+ files, new state, multiple flows)

#### Scenario 1.2: Detect task-level work ✅

**Given** user says "fix the login error message"
**When** agent analyzes the request
**Then** agent detects `task` level (1-2 files, 1 E2E test sufficient)

#### Scenario 1.3: Detect patch-level work ✅

**Given** user says "fix typo in README"
**When** agent analyzes the request
**Then** agent detects `patch` level (trivial change)

---

### Suite 2: Announcement with Override

#### Scenario 2.1: Feature announcement ✅

**Given** agent detects feature-level work
**When** agent announces
**Then** agent says "Feature. Defining behaviors first. `/tdd` to override."

#### Scenario 2.2: Task announcement ✅

**Given** agent detects task-level work
**When** agent announces
**Then** agent says "Task. Writing tests first. `/bdd` to override."

#### Scenario 2.3: Patch announcement ✅

**Given** agent detects patch-level work
**When** agent announces
**Then** agent says "Patch. Fixing directly."

---

### Suite 3: Override Commands

#### Scenario 3.1: /bdd forces BDD flow ✅

**Given** agent detected task-level work
**When** user runs `/bdd`
**Then** agent switches to BDD flow (Phase 0-2 context check)

#### Scenario 3.2: /tdd forces TDD flow ✅

**Given** agent detected feature-level work
**When** user runs `/tdd`
**Then** agent skips BDD phases, goes directly to TDD

---

### Suite 4: Skill Skeleton

#### Scenario 4.1: safeword-bdd-orchestrating skill exists ✅

**Given** safeword project is initialized
**When** agent invokes safeword-bdd-orchestrating skill
**Then** skill file exists at `packages/cli/templates/skills/safeword-bdd-orchestrating/SKILL.md`

#### Scenario 4.2: BDD skill hands off to TDD ✅

**Given** agent is in safeword-bdd-orchestrating skill
**And** detection complete
**When** no BDD phases implemented yet (Iteration 1)
**Then** skill delegates to safeword-tdd-enforcing

---

## Summary

**Iteration 1 Total**: 10 scenarios

- ✅ Passing: 10
- ❌ Not Implemented: 0

---

## Future Iterations (Not Yet Defined)

- Iteration 2: Phase Tracking (Stories 4, 5)
- Iteration 3: Scenarios (Stories 4, 5)
- Iteration 4: Discovery (Stories 2, 3, 11)
- Iteration 5: Implementation (Stories 6, 7, 8, 11)
- Iteration 6: Decomposition (Story 10)
- Iteration 7: Phase-Aware Quality (Story 12)
