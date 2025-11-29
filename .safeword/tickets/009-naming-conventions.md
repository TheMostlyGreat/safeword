---
id: 009
status: pending
created: 2025-11-27
github: https://github.com/TheMostlyGreat/safeword/issues/5
---

# Fix File Naming Conventions

**Goal:** Standardize naming for tickets vs derived planning docs vs standalone docs.

**Why:** Current naming is inconsistent. Hard to see which planning docs belong to which tickets.

## Naming Rules

| File Type           | Pattern                 | Example                                                |
| ------------------- | ----------------------- | ------------------------------------------------------ |
| **Tickets**         | `{NNN}-{slug}.md`       | `001-fix-login-bug.md`                                 |
| **Derived docs**    | `{NNN}.{XX}-{slug}.md`  | `001.01-user-stories.md`, `001.02-test-definitions.md` |
| **Standalone docs** | `{slug}.md` (no number) | `architecture-enforcement-system.md`                   |

## Rules

1. **Tickets** stay numbered: `001-`, `002-`, etc.
2. **Planning docs derived from a ticket** append `.XX` sub-number
   - First planning doc: `001.01-user-stories.md`
   - Second: `001.02-design-doc.md`
   - Allows sorting while showing relationship
3. **Standalone planning docs** (bigger scope than any ticket) get no number
   - Cross-cutting concerns, research, multi-ticket planning
   - Example: `architecture-enforcement-system.md`

## Acceptance Criteria

- [ ] SAFEWORD.md updated with naming convention
- [ ] Existing files renamed to match
- [ ] Ticket template includes derived doc naming guidance

## Work Log

- 2025-11-27 Created ticket
