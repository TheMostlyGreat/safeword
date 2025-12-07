# Test Definitions: Refactoring Skill

**Feature:** Refactoring Skill
**Spec:** `.safeword/planning/specs/feature-refactoring-skill.md`

## Test Categories

### 1. Trigger Accuracy

| ID   | Scenario                             | Expected Behavior                       | Status |
| ---- | ------------------------------------ | --------------------------------------- | ------ |
| T1.1 | User says "refactor this function"   | Skill activates                         |        |
| T1.2 | User says "clean up this code"       | Skill activates (structural cleanup)    |        |
| T1.3 | User says "extract method from this" | Skill activates                         |        |
| T1.4 | User says "rename all usages of X"   | Skill activates                         |        |
| T1.5 | User says "simplify this logic"      | Skill activates                         |        |
| T1.6 | User says "this code smells"         | Skill activates                         |        |
| T1.7 | User says "fix this bug"             | Skill does NOT activate (debugging/TDD) |        |
| T1.8 | User says "add new feature"          | Skill does NOT activate (TDD)           |        |
| T1.9 | User says "format this code"         | Skill does NOT activate (→ /lint)       |        |

### 2. Small-Step Discipline

| ID   | Scenario                               | Expected Behavior                                   | Status |
| ---- | -------------------------------------- | --------------------------------------------------- | ------ |
| T2.1 | Single rename refactoring              | Runs tests immediately after                        |        |
| T2.2 | Extract function                       | Runs tests immediately after                        |        |
| T2.3 | User requests "refactor entire module" | Breaks into small steps, one at a time              |        |
| T2.4 | Test fails after refactoring           | Reverts via `git checkout -- <files>`, investigates |        |
| T2.5 | Multiple refactorings requested        | Does ONE, verifies, commits, then next              |        |
| T2.6 | Successful refactoring                 | Commits with `refactor:` prefix before next step    |        |

### 3. Characterization Tests

| ID   | Scenario                            | Expected Behavior                              | Status |
| ---- | ----------------------------------- | ---------------------------------------------- | ------ |
| T3.1 | Untested function needs refactoring | PROTECT phase: add characterization test first |        |
| T3.2 | Well-tested code                    | Skips PROTECT, proceeds directly to REFACTOR   |        |
| T3.3 | Partial test coverage               | PROTECT phase for untested parts only          |        |

### 4. Refactoring Catalog

| ID   | Scenario              | Expected Behavior                               | Status |
| ---- | --------------------- | ----------------------------------------------- | ------ |
| T4.1 | Duplicated code       | Suggests Extract Function                       |        |
| T4.2 | Long function         | Suggests Extract Function                       |        |
| T4.3 | Complex conditional   | Suggests Decompose Conditional or Guard Clauses |        |
| T4.4 | Magic number          | Suggests Replace Magic Literal                  |        |
| T4.5 | Unused code           | Suggests Remove Dead Code                       |        |
| T4.6 | Poorly named variable | Suggests Rename                                 |        |

### 5. Integration

| ID   | Scenario                              | Expected Behavior                                      | Status |
| ---- | ------------------------------------- | ------------------------------------------------------ | ------ |
| T5.1 | Refactoring breaks tests unexpectedly | Reverts, suggests "Consider using systematic-debugger" |        |
| T5.2 | Refactoring complete                  | Final commit, reports summary                          |        |
| T5.3 | User switches from TDD to refactoring | Skill activates based on "refactor" trigger            |        |

### 6. Anti-Pattern Prevention

| ID   | Scenario                                 | Expected Behavior                      | Status |
| ---- | ---------------------------------------- | -------------------------------------- | ------ |
| T6.1 | Attempt to refactor + add feature        | Refuses, asks to separate concerns     |        |
| T6.2 | Large-scale rewrite attempt              | Warns, breaks into smaller steps       |        |
| T6.3 | Refactoring without tests                | Warns, suggests characterization tests |        |
| T6.4 | Changing test assertions during refactor | Refuses, tests define behavior         |        |

## Acceptance Criteria

- [ ] All T1.x tests pass (correct triggering)
- [ ] All T2.x tests pass (small-step discipline)
- [ ] All T3.x tests pass (characterization tests)
- [ ] All T4.x tests pass (catalog usage)
- [ ] All T5.x tests pass (integration)
- [ ] All T6.x tests pass (anti-patterns)
- [ ] Skill file is under 300 lines
- [ ] Description includes clear triggers
