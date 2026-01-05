---
description: Force TDD flow for current task (skip BDD phases, go straight to tests)
---

# Force TDD Flow

Override detection and skip BDD workflow, going directly to TDD.

## When to Use

- Agent detected `feature` but you already have scenarios
- Spec is complete and you want to start implementing
- You know exactly what to build and just need tests

## Behavior

1. Skip BDD phases (0-4)
2. Hand off directly to `safeword-tdd-enforcing` skill
3. Begin with RED phase (write failing tests)

## Example

```
User: Add dark mode toggle
Agent: Feature. Defining behaviors first. `/tdd` to override.
User: /tdd
Agent: Task. Writing tests first...
       What's the first test case?
```
