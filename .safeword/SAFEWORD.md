# SAFEWORD Agent Instructions

Core guidance for AI coding agents. Uses imports for detailed workflows.

---

## Quick Reference

| Task                     | Guide                                          |
| ------------------------ | ---------------------------------------------- |
| Feature development      | @./.safeword/guides/development-workflow.md    |
| User stories             | @./.safeword/guides/user-story-guide.md        |
| Test definitions         | @./.safeword/guides/test-definitions-guide.md  |
| TDD patterns / examples  | @./.safeword/guides/tdd-best-practices.md      |
| Design docs              | @./.safeword/guides/design-doc-guide.md        |
| Architecture decisions   | @./.safeword/guides/architecture-guide.md      |
| Data architecture        | @./.safeword/guides/data-architecture-guide.md |
| LLM integration & docs   | @./.safeword/guides/llm-guide.md               |
| Context file maintenance | @./.safeword/guides/context-files-guide.md     |
| Learning extraction      | @./.safeword/guides/learning-extraction.md     |
| Process cleanup          | @./.safeword/guides/zombie-process-cleanup.md  |
| Code standards           | @./.safeword/guides/code-philosophy.md         |
| Safeword CLI             | @./.safeword/guides/cli-reference.md           |

---

## Planning Documentation

**Location:** `.safeword/planning/` at project root

- User stories → `.safeword/planning/user-stories/`
- Test definitions → `.safeword/planning/test-definitions/`
- Design docs → `.safeword/planning/design/`
- Issues → `.safeword/planning/issues/`

**Archive:** Move completed docs to `archive/` subfolder within each.

---

## Ticket System

**Purpose:** Context anchor to prevent LLM loops during complex work.

**Location:** `.safeword/tickets/{id}-{slug}.md`

**Create ticket? Answer IN ORDER, stop at first match:**

1. Multiple attempts likely needed? → Create ticket
2. Multi-step with dependencies? → Create ticket
3. Investigation/debugging required? → Create ticket
4. Risk of losing context mid-session? → Create ticket
5. None of above? → Skip ticket

**Examples:** "Fix typo" → skip. "Debug slow login" → ticket. "Add OAuth" → ticket.

**Minimal structure:**

```markdown
---
id: 001
status: in_progress
---

# [Title]

**Goal:** [one sentence]

## Work Log

- [timestamp] Started: [task]
- [timestamp] Found: [finding]
- [timestamp] Complete: [result]
```

**Rules:**

- Log immediately after each action
- Re-read ticket before significant actions
- **CRITICAL:** Never mark `done` without user confirmation (prevents premature closure)

**Full template:** `.safeword/templates/ticket-template.md`

---

## Feature Development (CRITICAL)

**Always follow this order:**

1. **Check/create ticket** if context-loss risk exists (see decision tree above)
2. **Read user stories** (`.safeword/planning/user-stories/`)
3. **Read test definitions** (`.safeword/planning/test-definitions/`)
4. **Read design doc** if complex (>3 components OR 2+ user stories)
5. **TDD: RED → GREEN → REFACTOR**
6. **Update ticket** with progress, ask user to confirm completion

**Edge cases:**

| Situation                           | Action                            |
| ----------------------------------- | --------------------------------- |
| User stories exist, test defs don't | Create test defs first            |
| Test defs exist, user stories don't | Ask if user stories needed        |
| Neither exist                       | Create both before implementation |

**Full workflow:** @./.safeword/guides/development-workflow.md

---

## Self-Testing (CRITICAL)

**Never ask the user to test what you can test yourself.**

- After fixes → run relevant tests
- After features → run affected tests
- Before completion → verify everything passes

**Anti-patterns:**

- ❌ "Please refresh and test"
- ❌ "Can you verify it works?"
- ✅ "Fixed. Running tests..." → "Tests pass ✓"

---

## Code Quality

**Avoid over-engineering:**

| ❌ Over-engineering               | ✅ Keep it simple   |
| --------------------------------- | ------------------- |
| Utility class for one function    | Single function     |
| Factory/builder for simple object | Direct construction |
| Config file for 2 options         | Hardcode or params  |

**Rules:**

- If feature adds >50 lines for "nice to have", ask user first
- Never swallow errors—include context: `Failed to X: ${e.message}`
- Verify library APIs against package.json version + Context7 (training data is stale)

---

## TodoWrite

**Use for:** 3+ step tasks, non-trivial work, multiple user requests.

**Rules:**

- Create as first tool call
- One task `in_progress` at a time
- Mark completed immediately (don't batch)

---

## Response Format

End every response with:

```json
{"proposedChanges": boolean, "madeChanges": boolean, "askedQuestion": boolean}
```

- `proposedChanges`: suggested changes to files in this response
- `madeChanges`: modified files using Write/Edit tools
- `askedQuestion`: asked question, need response before proceeding

---

## Commit Frequently

- After each GREEN phase
- Before refactoring
- After successful refactor
- When switching tasks

---

## Learning Extraction

**Suggest extraction when ANY apply:**

- 5+ debug cycles on same issue
- 3+ approaches tried
- Undocumented gotcha discovered
- Integration struggle between tools

**Before extracting:** Check `.safeword/learnings/` for existing similar learnings—update, don't duplicate.

**Full workflow:** @./.safeword/guides/learning-extraction.md
