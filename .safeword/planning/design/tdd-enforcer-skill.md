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
│  ↓ gate: test passes, no extra code, no mocks               │
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
│   ├── feature-*.md     # L2: User stories (high-level AC)
│   └── task-*.md        # L0/L1: Task specs (tests inline)
├── test-definitions/    # L2 only: Detailed test suites
│   └── feature-*.md     # Maps to feature specs
└── design/              # Complex features only
```text

## Artifact Levels

| Level  | Name    | Artifacts                                          | Test Location                         |
| ------ | ------- | -------------------------------------------------- | ------------------------------------- |
| **L2** | Feature | Feature Spec + Test Defs (+ Design Doc if complex) | `test-definitions/feature-*.md`       |
| **L1** | Task    | Task Spec                                          | Inline in spec                        |
| **L0** | Micro   | Task Spec (minimal)                                | Existing tests (no new test required) |

**Key points:**

- L2 features need detailed test definitions (status tracking, steps, expected outcomes)
- L1 tasks have inline test scenarios
- L0 micro tasks are scoped but can rely on existing tests
- Design Doc is optional within L2 (add if 3+ components or architectural)

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

Answer IN ORDER. Stop at first match:

```text
1. User-facing feature with business value? → L2 Feature
2. Bug, improvement, internal, or refactor? → L1 Task
3. Typo, config, or trivial change? → L0 Micro
```text

Then:

```text
2. Does spec exist?
   ├─ Yes → Read it, confirm scope
   └─ No → Create it (see templates below)

3. For L2: Do test definitions exist?
   ├─ Yes → Read them
   └─ No → Create them (guide: @.safeword/guides/test-definitions-guide.md)

4. For L2: Is this complex (3+ components, new schema, architectural)?
   ├─ Yes → Create/read Design Doc
   └─ No → Skip Design Doc

5. Is scope clear?
   ├─ Yes → Proceed to Phase 1
   └─ No → Clarify with user before proceeding
```text

### Feature Spec (L2)

```markdown
# Feature: [Name]

**User Story:** As a [who], I want [what], so that [why].

**Acceptance Criteria:**

- [ ] [High-level criterion 1]
- [ ] [High-level criterion 2]

**Out of Scope:** [Boundaries]

**Test Definitions:** `.safeword/planning/test-definitions/feature-[name].md`

**Design Doc:** [Link if complex, "N/A" if straightforward]
```text

Location: `.safeword/planning/specs/feature-[name].md`

### Task Spec (L1)

```markdown
# Task: [Name]

**Type:** Bug | Improvement | Internal | Refactor

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

### Task Spec - Micro (L0)

```markdown
# Task: [Name]

**Type:** Micro

**Scope:** [One sentence - what exactly is changing]

**Out of Scope:** [Boundaries - prevents scope creep]

**Done When:**

- [ ] [Single observable outcome]

**Tests:**

- [ ] Existing tests pass (no new test needed)
```text

Location: `.safeword/planning/specs/task-[name].md`

### Exit Criteria

- [ ] Level identified (L0/L1/L2)
- [ ] Spec exists with clear scope
- [ ] "Out of Scope" explicitly defined
- [ ] For L2: Test definitions file exists
- [ ] For L1: Test scenarios in spec
- [ ] For L0: Existing test coverage confirmed

---

## Phase 1: RED

**Iron Law:** NO IMPLEMENTATION UNTIL TEST FAILS FOR THE RIGHT REASON

**Protocol:**

1. Pick ONE test from spec (L1) or test definitions (L2)
2. Write test code
3. Run test
4. Verify: fails because behavior missing (not syntax error)
5. Commit test

**For L0:** If existing tests cover the behavior, skip to Phase 2. The spec scopes the work; new tests aren't required for trivial changes.

**Exit Criteria:**

- [ ] Test written (or existing test confirmed for L0)
- [ ] Test executed
- [ ] Test fails for RIGHT reason (or passes for L0 existing test)
- [ ] Committed: `test: [behavior]` (skip for L0)

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
- [ ] No hardcoded/mock values
- [ ] Committed: `feat:` or `fix:`

**Red Flags → STOP:**

| Flag                         | Action                                 |
| ---------------------------- | -------------------------------------- |
| "Just in case" code          | Delete it                              |
| Multiple functions           | Delete extras                          |
| Refactoring                  | Stop - that's Phase 3                  |
| Test still fails             | Debug (→ systematic-debugger if stuck) |
| Hardcoded value to pass test | Implement real logic (see below)       |

### Anti-Pattern: Mock Implementations

LLMs sometimes write hardcoded values to pass tests. This is not TDD.

```typescript
// ❌ BAD - Hardcoded to pass test
function calculateDiscount(amount, tier) {
  return 80; // Passes test but isn't real
}

// ✅ GOOD - Actual logic
function calculateDiscount(amount, tier) {
  if (tier === 'VIP') return amount * 0.8;
  return amount;
}
```text

**If you wrote a hardcoded value:** The next test cycle will catch it (different input will fail). But fix it now - mocks are technical debt.

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
        ├─ Yes → Complete (update test def status if L2)
        └─ No → Update spec, return to Phase 0
```text

For L2: Update test definition status (✅/⏭️/❌/🔴) as tests pass.

**Note:** Multiple test cycles naturally catch mock implementations. If you hardcoded `return 80` for the first test, the second test with different input will fail.

---

## Examples

### L2: Feature

**Request:** "Add VIP discount"

**Phase 0:**

```text
Level: L2 (user-facing feature)
Spec: .safeword/planning/specs/feature-vip-discount.md
Test Defs: .safeword/planning/test-definitions/feature-vip-discount.md
Design Doc: N/A (single component)
```text

**Phase 1:** Write test → FAIL → commit

**Phase 2:** Minimal implementation → PASS → commit

**Phase 3:** No changes needed

**Phase 4:** More tests? Yes → Phase 1 (second test catches any hardcoding)

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

**Out of Scope:** Error handling logic, other messages, refactoring

**Done When:**

- [ ] Typo fixed

**Tests:**

- [ ] Existing auth tests pass
```text

**Phase 1:** Existing tests cover behavior → skip new test

**Phase 2:** Fix typo → run existing tests → PASS → commit `fix: typo in auth error`

**Why L0 still needs a spec:** "Fix typo" can become "refactor error handling" without explicit boundaries. The spec prevents scope creep even when no new test is needed.

---

## Integration

| Scenario                | Handoff               |
| ----------------------- | --------------------- |
| Test fails unexpectedly | → systematic-debugger |
| Review needed           | → quality-reviewer    |
| Scope expanding         | → Update spec first   |

---

## Key Decisions

### 1. Three levels (not four)

**What:** L0 (Micro), L1 (Task), L2 (Feature). Design Doc is optional within L2.
**Why:** L2 vs L3 distinction was only "has Design Doc." Simpler to make it optional.
**Trade-off:** Less granularity, but clearer triage.

### 2. L0 can skip new tests

**What:** Micro tasks rely on existing test coverage
**Why:** Writing a test for a typo fix is ceremony without value
**Trade-off:** Must confirm existing tests actually cover the change

### 3. L0 still gets scoped

**What:** Even "trivial" tasks create a minimal spec
**Why:** Scope creep happens. "Fix typo" becomes "refactor error handling."
**Trade-off:** Small overhead, prevents rabbit holes

### 4. Mock implementation warning

**What:** Explicit red flag for hardcoded values in Phase 2
**Why:** LLMs optimize for "make test pass" - may hardcode values
**Trade-off:** Iterate cycle catches mocks anyway, but explicit warning helps

---

## Implementation

**Skill file:** `packages/cli/templates/skills/safeword-tdd-enforcer/SKILL.md`

**New template:** `.safeword/templates/task-spec-template.md`

**Existing template:** `.safeword/templates/test-definitions-feature.md` (keep as-is)

**Update:** SAFEWORD.md planning folder references

**Size target:** SKILL.md should be <300 lines for efficient loading

---

## Success Criteria

1. Triage catches scope creep before coding
2. L2 features get detailed test definitions
3. L1 tasks get inline test scenarios
4. L0 micro tasks are scoped but skip new tests
5. RED phase verifies test fails for right reason
6. GREEN phase produces minimal code (no mocks)
7. Each phase commits appropriately
8. LLM states current phase explicitly
````
