# Design: TDD Enforcer Skill

**Guide**: `@./.safeword/guides/design-doc-guide.md`

**Related**:

- SAFEWORD.md Feature Development: `.safeword/SAFEWORD.md`
- Development Workflow: `.safeword/guides/development-workflow.md`
- Test Definitions Guide: `.safeword/guides/test-definitions-guide.md`

## Problem Statement

LLMs skip TDD discipline despite guides. Even "trivial" tasks expand in scope. A skill creates a forcing function that:

1. **Triages** work to pick the right artifact level
2. **Scopes** work before coding starts
3. **Enforces** RED → GREEN → REFACTOR discipline

## Architecture

````text
┌─────────────────────────────────────────────────────────────┐
│                    TDD Enforcer Skill                       │
├─────────────────────────────────────────────────────────────┤
│  Phase 0: TRIAGE     │ What level? Create/read spec         │
│  ↓ gate: scope defined                                      │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: RED        │ Write ONE failing test               │
│  ↓ gate: test fails for RIGHT reason                        │
│  ↓ commit: test                                             │
├─────────────────────────────────────────────────────────────┤
│  Phase 2: GREEN      │ Minimal implementation               │
│  ↓ gate: test passes, no extra code                         │
│  ↓ commit: implementation                                   │
├─────────────────────────────────────────────────────────────┤
│  Phase 3: REFACTOR   │ Improve without changing behavior    │
│  ↓ gate: tests still pass                                   │
│  ↓ commit: refactor (if changes)                            │
├─────────────────────────────────────────────────────────────┤
│  Phase 4: ITERATE    │ Next test or done?                   │
└─────────────────────────────────────────────────────────────┘
```text

## Planning Structure

```text
.safeword/planning/
├── specs/               # All scoping artifacts
│   ├── feature-*.md     # L2/L3: User stories (high-level AC)
│   └── task-*.md        # L0/L1: Task specs (tests inline)
├── test-definitions/    # L2/L3 only: Detailed test suites
│   └── feature-*.md     # Maps to feature specs
└── design/              # L3 only
```text

**Tiered approach:**

- **L0/L1 (Task):** Tests inline in task spec (simple)
- **L2/L3 (Feature/Epic):** Separate test definitions file (detailed)

## Artifact Levels

| Level  | Name    | Artifacts                             | Test Location                   |
| ------ | ------- | ------------------------------------- | ------------------------------- |
| **L3** | Epic    | Feature Spec + Test Defs + Design Doc | `test-definitions/feature-*.md` |
| **L2** | Feature | Feature Spec + Test Defs              | `test-definitions/feature-*.md` |
| **L1** | Task    | Task Spec                             | Inline in spec                  |
| **L0** | Micro   | Task Spec (minimal)                   | Inline in spec                  |

**Why tiered:**

- L2/L3 features need detailed test definitions (status tracking, steps, expected outcomes, coverage summaries)
- L0/L1 tasks don't need 471-line test files for a bug fix

---

## Skill Frontmatter

```yaml
---
name: tdd-enforcer
description: Enforces scoped TDD workflow. Triages work level, ensures spec exists, then enforces RED → GREEN → REFACTOR. Use for any implementation work ('implement', 'add', 'build', 'create', 'fix', 'improve').
allowed-tools: '*'
---
```text

---

## Phase 0: TRIAGE

**Purpose:** Determine work level and ensure scope is defined.

**Protocol:**

```text
1. What type of work?
   ├─ User-facing feature → L2 or L3
   ├─ Bug/improvement/internal → L1
   └─ Typo/config/tiny fix → L0

2. Does spec exist?
   ├─ Yes → Read it, confirm scope
   └─ No → Create it (see templates below)

3. For L2/L3: Do test definitions exist?
   ├─ Yes → Read them
   └─ No → Create them (guide: @.safeword/guides/test-definitions-guide.md)

4. Is scope clear?
   ├─ Yes → Proceed to Phase 1
   └─ No → Clarify with user before proceeding
```text

### Feature Spec (L2/L3)

High-level user story with acceptance criteria. Detailed tests go in separate file.

```markdown
# Feature: [Name]

**User Story:** As a [who], I want [what], so that [why].

**Acceptance Criteria:**

- [ ] [High-level criterion 1]
- [ ] [High-level criterion 2]

**Out of Scope:** [Boundaries]

**Test Definitions:** `.safeword/planning/test-definitions/feature-[name].md`

**Design Doc:** [Link if L3, "N/A" if L2]
```text

Location: `.safeword/planning/specs/feature-[name].md`

### Test Definitions (L2/L3)

Detailed test suites with steps, expected outcomes, and status tracking.

- Guide: `@.safeword/guides/test-definitions-guide.md`
- Template: `@.safeword/templates/test-definitions-feature.md`
- Location: `.safeword/planning/test-definitions/feature-[name].md`

Includes:

- Test suites organized by feature area
- Status per test (✅/⏭️/❌/🔴)
- Detailed steps and expected outcomes
- Coverage summary with percentages
- Skipped test rationales
- Execution commands

### Task Spec (L0/L1)

Lightweight spec with tests inline. No separate test definitions file.

```markdown
# Task: [Name]

**Type:** Bug | Improvement | Internal | Refactor | Micro

**Scope:** [1-2 sentences]

**Out of Scope:** [Boundaries - critical for preventing creep]

**Done When:**

- [ ] [Observable outcome 1]
- [ ] [Observable outcome 2]

**Tests:**

- [ ] [Test scenario 1]
- [ ] [Test scenario 2]
```text

Location: `.safeword/planning/specs/task-[name].md`

### Exit Criteria

- [ ] Level identified (L0/L1/L2/L3)
- [ ] Spec exists with clear scope
- [ ] "Out of Scope" explicitly defined
- [ ] For L2/L3: Test definitions file exists
- [ ] For L0/L1: Test scenarios in spec

---

## Phase 1: RED

**Iron Law:** NO IMPLEMENTATION UNTIL TEST FAILS FOR THE RIGHT REASON

**Protocol:**

1. Pick ONE test from spec (L0/L1) or test definitions (L2/L3)
2. Write test code
3. Run test
4. Verify: fails because behavior missing (not syntax error)
5. Commit test

**Exit Criteria:**

- [ ] Test written
- [ ] Test executed
- [ ] Test fails for RIGHT reason
- [ ] Committed: `test: [behavior]`

**Red Flags → STOP:**

| Flag                    | Action                           |
| ----------------------- | -------------------------------- |
| Test passes immediately | Rewrite - you're testing nothing |
| Syntax error            | Fix syntax, not behavior         |
| Wrote implementation    | Delete it, return to test        |
| Multiple tests          | Pick ONE                         |

---

## Phase 2: GREEN

**Iron Law:** ONLY WRITE CODE THE TEST REQUIRES

**Protocol:**

1. Write minimal code to pass test
2. Run test
3. Verify pass
4. Commit implementation

**Exit Criteria:**

- [ ] Test passes
- [ ] No extra code
- [ ] Committed: `feat:` or `fix:`

**Red Flags → STOP:**

| Flag                | Action                                 |
| ------------------- | -------------------------------------- |
| "Just in case" code | Delete it                              |
| Multiple functions  | Delete extras                          |
| Refactoring         | Stop - that's Phase 3                  |
| Test still fails    | Debug (→ systematic-debugger if stuck) |

---

## Phase 3: REFACTOR

**Protocol:**

1. Tests pass before changes
2. Improve code (rename, extract, dedupe)
3. Tests pass after changes
4. Commit if changed

**Exit Criteria:**

- [ ] Tests still pass
- [ ] Code cleaner (or no changes needed)
- [ ] Committed (if changed): `refactor: [improvement]`

**NOT Allowed:**

- New behavior
- Changing assertions
- Adding tests

---

## Phase 4: ITERATE

```text
More tests in spec/test-definitions?
├─ Yes → Return to Phase 1
└─ No → All "Done When" / AC checked?
        ├─ Yes → Complete (update test def status if L2/L3)
        └─ No → Update spec, return to Phase 0
```text

For L2/L3: Update test definition status (✅/⏭️/❌/🔴) as tests pass.

---

## Examples

### L2: Feature

**Request:** "Add VIP discount"

**Phase 0:**

```text
Level: L2 (user-facing feature)
Spec: .safeword/planning/specs/feature-vip-discount.md
Test Defs: .safeword/planning/test-definitions/feature-vip-discount.md
```text

Feature spec (high-level):

```markdown
# Feature: VIP Discount

**User Story:** As a customer, I want VIP discounts applied automatically.

**Acceptance Criteria:**

- [ ] VIP users get 20% discount
- [ ] Non-VIP users get no discount

**Out of Scope:** Other tiers, UI changes

**Test Definitions:** `.safeword/planning/test-definitions/feature-vip-discount.md`
```text

Test definitions (detailed):

```markdown
# Test Definitions: VIP Discount

## Test Suite 1: Discount Calculation

### Test 1.1: VIP users receive 20% discount ❌

**Status**: ❌ Not Implemented
**Steps**:

1. Create order with amount 100
2. Apply discount for VIP user
3. Verify final amount

**Expected**:

- Final amount = 80
- Discount applied = 20
```text

**Phase 1:** Write test 1.1 → FAIL → commit → update status to 🔴

**Phase 2:** Minimal implementation → PASS → commit → update status to ✅

**Phase 3:** No changes needed

**Phase 4:** More tests? Yes → Phase 1

---

### L1: Bug Fix

**Request:** "Fix login timeout after 30 minutes"

**Phase 0:**

```text
Level: L1 (bug fix)
Spec: .safeword/planning/specs/task-fix-login-timeout.md
(No separate test definitions - tests inline)
```text

```markdown
# Task: Fix login timeout after 30 minutes

**Type:** Bug

**Scope:** Session refresh logic in auth middleware

**Out of Scope:** Session duration, auth flow, UI changes

**Done When:**

- [ ] User stays logged in if active within session window
- [ ] Session refreshes on API calls

**Tests:**

- [ ] Unit: session refresh extends expiry
- [ ] Unit: inactive session expires correctly
```text

**Phase 1:** Write test → FAIL → commit

**Phase 2:** Fix → PASS → commit

---

### L0: Micro

**Request:** "Fix typo in error message"

**Phase 0:**

```text
Level: L0 (micro)
Spec: .safeword/planning/specs/task-fix-typo-error-msg.md
```text

```markdown
# Task: Fix typo in error message

**Type:** Micro

**Scope:** Typo in auth error ("authetication" → "authentication")

**Out of Scope:** Error handling logic, other messages

**Done When:**

- [ ] Typo fixed

**Tests:**

- [ ] Existing auth tests pass
```text

**Phase 1:** Existing tests cover this → no new test needed

**Phase 2:** Fix typo → tests pass → commit `fix: typo in auth error`

---

## Integration

| Scenario                | Handoff               |
| ----------------------- | --------------------- |
| Test fails unexpectedly | → systematic-debugger |
| Review needed           | → quality-reviewer    |
| Scope expanding         | → Update spec first   |

---

## Key Decisions

### 1. Tiered test definitions

**What:** L0/L1 tests inline, L2/L3 get separate test definitions file
**Why:** Bug fixes don't need 471-line test files. Features do.
**Trade-off:** Two patterns, but right-sized for each level

### 2. L0 still gets scoped

**What:** Even "trivial" tasks create a minimal spec
**Why:** Scope creep happens. "Fix typo" becomes "refactor error handling."
**Trade-off:** Small overhead, prevents rabbit holes

### 3. Test definitions track status

**What:** L2/L3 test definitions use ✅/⏭️/❌/🔴 status per test
**Why:** Visibility into progress, matches existing workflow
**Trade-off:** Requires updating test def file as tests pass

### 4. Triage is part of the skill

**What:** Phase 0 determines level before TDD starts
**Why:** Scoping prevents scope creep. Prerequisite, not separate.
**Trade-off:** Skill does more, but workflow is cohesive

---

## Implementation

**Skill file:** `packages/cli/templates/skills/safeword-tdd-enforcer/SKILL.md`

**New template:** `.safeword/templates/task-spec-template.md`

**Existing template:** `.safeword/templates/test-definitions-feature.md` (keep as-is)

**Update:** SAFEWORD.md planning folder references

---

## Success Criteria

1. Triage catches scope creep before coding
2. L2/L3 features get detailed test definitions
3. L0/L1 tasks get lightweight inline tests
4. RED phase verifies test fails for right reason
5. GREEN phase produces minimal code
6. Each phase commits appropriately
7. LLM states current phase explicitly
````
