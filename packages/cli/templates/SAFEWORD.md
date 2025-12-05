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
| Planning new feature scope OR creating feature spec        | @./.safeword/templates/feature-spec-template.md    |
| Bug, improvement, refactor, or internal task               | @./.safeword/templates/task-spec-template.md       |
| Need test definitions for a feature OR acceptance criteria | @./.safeword/templates/test-definitions-feature.md |
| Feature spans 3+ components OR needs technical spec        | @./.safeword/templates/design-doc-template.md      |
| Making decision with long-term impact OR trade-offs        | @./.safeword/templates/architecture-template.md    |
| Task needs context anchoring (see Ticket System below)     | @./.safeword/templates/ticket-template.md          |
| Starting execution of a plan, ticket, or spec              | @./.safeword/templates/work-log-template.md        |

---

## Planning Documentation

**Location:** `.safeword/planning/` at project root

| Type             | Path                                   | Contents                          |
| ---------------- | -------------------------------------- | --------------------------------- |
| Specs            | `.safeword/planning/specs/`            | `feature-*.md` and `task-*.md`    |
| Test definitions | `.safeword/planning/test-definitions/` | `feature-*.md` (L2 features only) |
| Design docs      | `.safeword/planning/design/`           | Complex features (3+ components)  |
| Issues           | `.safeword/planning/issues/`           | Issue tracking                    |

**Artifact Levels:**

| Level  | Artifacts                                            | Test Location       |
| ------ | ---------------------------------------------------- | ------------------- |
| **L2** | Feature Spec + Test Definitions (+ Design Doc if 3+) | `test-definitions/` |
| **L1** | Task Spec                                            | Inline in spec      |
| **L0** | Task Spec (minimal)                                  | Existing tests      |

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
- For detailed scratch notes, use a separate work log (see Work Logs below)
- **CRITICAL:** Never mark `done` without user confirmation

---

## Work Logs

**Purpose:** Scratch pad and working memory during execution. Think hard. Keep notes.

**Location:** `.safeword/logs/{artifact-type}-{slug}.md`

**Naming convention:**

| Working on...         | Log file name            |
| --------------------- | ------------------------ |
| Ticket `001-fix-auth` | `ticket-001-fix-auth.md` |
| Spec `task-add-cache` | `spec-task-add-cache.md` |
| Design doc `oauth`    | `design-oauth.md`        |

**One artifact = one log.** If log exists, append a new session. Don't spawn multiple logs for the same work.

**When to create:**

- Starting execution of a plan, ticket, or spec
- Investigation or debugging that may span multiple attempts
- Any work where you might lose context

**Think hard behaviors:**

1. **Re-read the log** before each major action
2. **Pause to review** your approach periodically
3. **Log findings** as you discover them, not after
4. **Note dead ends** so you don't repeat them

**Log what helps you stay on track:** findings, decisions, hypotheses, blockers, scratch calculations. Use your discretion.

---

## Feature Development

**Triage first - answer IN ORDER, stop at first match:**

| Question                                 | Level          | Artifacts                    |
| ---------------------------------------- | -------------- | ---------------------------- |
| User-facing feature with business value? | **L2 Feature** | Spec + Test Defs (+ Design)  |
| Bug, improvement, internal, or refactor? | **L1 Task**    | Spec with inline tests       |
| Typo, config, or trivial change?         | **L0 Micro**   | Minimal spec, existing tests |

**Then follow this order:**

1. **Check/create ticket** if context-loss risk exists (see decision tree above)
2. **Read/create spec** (`.safeword/planning/specs/`)
3. **Read/create test definitions** (L2 only: `.safeword/planning/test-definitions/`)
4. **Read/create design doc** if complex (3+ components)
5. **TDD: RED → GREEN → REFACTOR**
6. **Update ticket** with progress, ask user to confirm completion

**Edge cases:**

| Situation                 | Action                  |
| ------------------------- | ----------------------- |
| Spec exists, no test defs | Create test defs (L2)   |
| Test defs exist, no spec  | Create spec first       |
| Neither exist             | Create spec, then tests |
| L0/L1 task                | Inline tests in spec    |

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

## Code Fence Languages (MD040)

When markdown lint reports MD040 (missing language), choose:

| Content Type             | Language Hint                |
| ------------------------ | ---------------------------- |
| TypeScript/JavaScript    | `typescript` or `javascript` |
| Shell commands           | `bash`                       |
| JSON, YAML, TOML configs | `json`, `yaml`, `toml`       |
| SQL queries              | `sql`                        |
| Directory trees          | `plaintext`                  |
| Templates, pseudocode    | `text`                       |
| Command output, logs     | `text`                       |
| Truly ambiguous          | `text`                       |

**Why this matters:** Language hints help LLMs understand code context. Use real languages for real code, `text` for everything else.

---

## Learning Extraction

**Suggest extraction when ANY apply:**

- 5+ debug cycles on same issue
- 3+ approaches tried
- Undocumented gotcha discovered
- Integration struggle between tools

**Before extracting:** Check `.safeword/learnings/` for existing similar learnings—update, don't duplicate.
