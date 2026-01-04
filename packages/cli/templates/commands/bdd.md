---
description: Force BDD flow for current task (use when task should be treated as feature)
---

# Force BDD Flow

Override detection and use BDD workflow for this task.

## When to Use

- Agent detected `task` but you know it's actually a feature
- You want discovery/scenarios before implementation
- Task will require multiple E2E tests

## Behavior

1. Switch to `safeword-bdd-orchestrating` skill
2. Hand off to TDD for implementation

Future iterations will add: context check, discovery, scenarios, validation, decomposition.

## Example

```
User: Change the auth flow to use OAuth
Agent: Task. Writing tests first. `/bdd` to override.
User: /bdd
Agent: Feature. Defining behaviors first. `/tdd` to override.
       [hands off to TDD for implementation]
```
