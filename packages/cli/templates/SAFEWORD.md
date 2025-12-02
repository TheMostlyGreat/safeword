# SAFEWORD Agent Instructions

---

## Code Philosophy

**Optimize for:** Clarity → Simplicity → Correctness (in that order)

| Principle        | Definition                                                       |
| ---------------- | ---------------------------------------------------------------- |
| Elegant code     | Readable at a glance; clear naming; minimal cognitive load       |
| No bloat         | Delete unused code; no premature abstractions; no "just in case" |
| Explicit errors  | Every catch block re-throws with context OR logs with details    |
| Self-documenting | Comment only: business rules, workarounds, non-obvious "why"     |

**Tie-breaker:** When in doubt, choose the simpler solution that works today.

---

## Anti-Patterns

| Don't                        | Do                                               | Why                       |
| ---------------------------- | ------------------------------------------------ | ------------------------- |
| `catch (e) {}`               | `throw new Error(\`Failed to X: ${e.message}\`)` | Silent failures hide bugs |
| Utility class for 1 function | Single exported function                         | Abstraction without reuse |
| Factory for simple object    | Direct construction                              | Indirection without value |
| `data`, `tmp`, `d`           | `userProfile`, `pendingOrder`                    | Names should explain      |
| Code "for later"             | Delete it; add when needed                       | YAGNI                     |
| >50 lines for nice-to-have   | Ask user: "Essential now?"                       | Scope creep               |

---

## Before Using Any Library API

Training data is stale. Follow this sequence:

1. Check `package.json` for installed version
2. Look up docs via Context7 or official site
3. If uncertain: ask user which version they're using

---

## Guides

**Read the matching guide when ANY trigger fires:**

| Trigger                                                   | Guide                                          |
| --------------------------------------------------------- | ---------------------------------------------- |
| Starting ANY feature, bug fix, or enhancement             | @./.safeword/guides/development-workflow.md    |
| Need to write OR review user stories                      | @./.safeword/guides/user-story-guide.md        |
| Need to write OR review test definitions                  | @./.safeword/guides/test-definitions-guide.md  |
| Writing tests, doing TDD, or test is failing              | @./.safeword/guides/tdd-best-practices.md      |
| Creating OR updating a design doc                         | @./.safeword/guides/design-doc-guide.md        |
| Making architectural decision OR writing ADR              | @./.safeword/guides/architecture-guide.md      |
| Designing data models, schemas, or database changes       | @./.safeword/guides/data-architecture-guide.md |
| Calling LLM APIs OR writing LLM-consumable docs           | @./.safeword/guides/llm-guide.md               |
| Updating CLAUDE.md, SAFEWORD.md, or any context file      | @./.safeword/guides/context-files-guide.md     |
| Hit same bug 3+ times OR discovered undocumented gotcha   | @./.safeword/guides/learning-extraction.md     |
| Process hanging, port in use, or zombie process suspected | @./.safeword/guides/zombie-process-cleanup.md  |
| Using `safeword` CLI commands                             | @./.safeword/guides/cli-reference.md           |
| Debugging issues OR need git/cross-platform guidance      | @./.safeword/guides/code-philosophy.md         |

---

## Templates

**Use the matching template when ANY trigger fires:**

| Trigger                                                    | Template                                           |
| ---------------------------------------------------------- | -------------------------------------------------- |
| User asks for user story OR planning new feature scope     | @./.safeword/templates/user-stories-template.md    |
| Need test definitions for a feature OR acceptance criteria | @./.safeword/templates/test-definitions-feature.md |
| Feature spans 3+ components OR needs technical spec        | @./.safeword/templates/design-doc-template.md      |
| Making decision with long-term impact OR trade-offs        | @./.safeword/templates/architecture-template.md    |
| Task needs context anchoring (see Ticket System below)     | @./.safeword/templates/ticket-template.md          |

---

## Planning Documentation

**Location:** `.safeword/planning/` at project root

| Type             | Path                                   |
| ---------------- | -------------------------------------- |
| User stories     | `.safeword/planning/user-stories/`     |
| Test definitions | `.safeword/planning/test-definitions/` |
| Design docs      | `.safeword/planning/design/`           |
| Issues           | `.safeword/planning/issues/`           |

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
- **CRITICAL:** Never mark `done` without user confirmation

---

## Feature Development

**Follow this order:**

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

---

## Self-Testing

**Never ask the user to test what you can test yourself.**

| After...          | Do                       |
| ----------------- | ------------------------ |
| Fixes             | Run relevant tests       |
| Features          | Run affected test suites |
| Before completion | Verify everything passes |

**Anti-patterns:**

- ❌ "Please refresh and test"
- ❌ "Can you verify it works?"
- ✅ "Fixed. Running tests..." → "Tests pass"

---

## TodoWrite

**Use for:** 3+ step tasks, non-trivial work, multiple user requests.

| Rule                             | Why                     |
| -------------------------------- | ----------------------- |
| Create as first tool call        | Plan before acting      |
| One task `in_progress` at a time | Focus                   |
| Mark completed immediately       | Don't batch completions |

---

## Response Format

End every response with:

```json
{"proposedChanges": boolean, "madeChanges": boolean, "askedQuestion": boolean}
```

| Field           | True when...                                    |
| --------------- | ----------------------------------------------- |
| proposedChanges | Suggested changes to files in this response     |
| madeChanges     | Modified files using Write/Edit tools           |
| askedQuestion   | Asked question, need response before proceeding |

---

## Commit Frequently

Commit after: GREEN phase, before/after refactoring, when switching tasks.

---

## Learning Extraction

**Suggest extraction when ANY apply:**

- 5+ debug cycles on same issue
- 3+ approaches tried
- Undocumented gotcha discovered
- Integration struggle between tools

**Before extracting:** Check `.safeword/learnings/` for existing similar learnings—update, don't duplicate.
