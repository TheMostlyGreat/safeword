---
description: Systematic refactoring with small-step discipline (project)
---

# Refactor

Apply systematic refactoring with test-driven discipline.

## Instructions

When the user invokes this command:

1. **Identify the target** - Ask what code to refactor if not specified
2. **Assess** - Is this actually refactoring? (Not a bug fix, feature, or formatting)
3. **Protect** - Verify test coverage exists, or add characterization tests first
4. **Refactor** - ONE change at a time, smallest scope first
5. **Verify** - Run tests after each change, commit on green, revert on red
6. **Iterate** - Repeat until complete, then run `/audit`

**Iron Law:** ONE REFACTORING → TEST → COMMIT. Never batch changes.

## Example Usage

```text
/refactor
```

Then: "Clean up the processOrder function" or "Extract the validation logic from UserService"
