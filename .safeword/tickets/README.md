# Tickets

Higher-level feature/epic tracking. Each ticket references planning docs.

## Structure

- `./` - Active tickets (in progress or todo)
- `completed/` - Verified completed tickets (user confirmed)
- `archived/` - Blocked or cancelled tickets

## Naming Convention

**Tickets:** `{id}-{feature-slug}.md`
- Example: `001-user-authentication.md`, `002-payment-flow.md`

**Planning docs share same prefix:**
- User stories: `./.safeword/planning/user-stories/001-user-authentication.md`
- Test definitions: `./.safeword/planning/test-definitions/001-user-authentication.md`
- Design doc: `./.safeword/planning/design/001-user-authentication.md`

This makes it easy to find all related docs by prefix.

## Format

```markdown
---
id: 001
status: todo|in_progress|done|blocked
created: 2025-01-19T14:30:00Z
priority: low|medium|high
planning_refs:
  - ./.safeword/planning/user-stories/001-user-authentication.md
  - ./.safeword/planning/test-definitions/001-user-authentication.md
  - ./.safeword/planning/design/001-user-authentication.md (if complex)
---

# User Authentication System

## Description
{High-level feature description}

## Scope
{What's included in this ticket}

## Acceptance Criteria
- [ ] All user stories completed
- [ ] All tests passing
- [ ] Documentation updated

## Work Log
{Progress notes, decisions, blockers}
```

## Completion Process

**CRITICAL:** Never mark ticket as done or archive without user confirmation.

1. Update status to `done` when work complete
2. **Ask user to confirm** all acceptance criteria met
3. User verifies:
   - All tests passing
   - Feature works as expected
   - No regressions introduced
4. After confirmation: Move to `completed/`
5. Blocked/cancelled tickets: Move to `archived/`

## Relationship

- **Ticket** = Higher-level feature/epic
- **Planning docs** = Detailed specs (user stories, test definitions, design)
- **TodoWrite** = Task-level tracking in current session

See `@./.safeword/SAFEWORD.md` → Ticket System for details.
