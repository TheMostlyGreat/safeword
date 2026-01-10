---
id: 016e
type: task
phase: implement
status: ready
created: 2026-01-10T18:47:00Z
last_modified: 2026-01-10T19:51:00Z
---

# Document user-focused ticket naming conventions

**Goal:** Add guidance on writing user-focused ticket names to AGENTS.md or a planning guide.

**Why:** Technical ticket names like "Add .vscode/settings.json" don't communicate user value. Names like "Format and lint on save for customer projects" are clearer for prioritization and communication.

**Category:** Process improvement (standalone - not part of a technical epic).

## Naming Principles

| Pattern                      | Bad Example                     | Good Example                                    |
| ---------------------------- | ------------------------------- | ----------------------------------------------- |
| Describe user value          | "Add permissions.deny"          | "Block unsafe git operations from LLMs"         |
| Use action verbs             | "Hook wiring"                   | "Protect config files from accidental changes"  |
| Name the beneficiary         | "Customer template"             | "Format and lint on save for customer projects" |
| Avoid implementation details | "Wire pre-tool-config-guard.ts" | "Require approval before config changes"        |

## Implementation Plan

Add to `.safeword/guides/planning-guide.md` or `AGENTS.md`:

```markdown
## Ticket Naming

Write ticket names that describe **user value**, not implementation:

**Pattern:** `<Action verb> <benefit> for <beneficiary>`

| Instead of...             | Write...                                     |
| ------------------------- | -------------------------------------------- |
| Add .vscode/settings.json | Format and lint on save for developers       |
| Wire PreToolUse hooks     | Protect config files from accidental changes |
| Customer template vscode  | Auto-configure IDE for customer projects     |

**Test:** Can a non-technical stakeholder understand what the ticket delivers?
```

## Acceptance Criteria

- [ ] Ticket naming guidance added to planning guide or AGENTS.md
- [ ] Includes before/after examples
- [ ] "User value test" included

## Work Log

---

- 2026-01-10T19:51:00Z Renumbered: 016d → 016e (execution priority - lowest urgency, process doc)
- 2026-01-10T19:45:00Z Refactored: Made standalone (removed from epic 016 - process improvement doesn't fit technical epic)
- 2026-01-10T18:47:00Z Created: Document ticket naming conventions

---
