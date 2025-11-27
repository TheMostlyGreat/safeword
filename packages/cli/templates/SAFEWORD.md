# Global Instructions for AI Coding Agents

This file provides core guidance for all AI coding agent sessions. Organized modularly for maintainability.

---

## Planning Documentation Location

**All planning markdown files go in `.safeword/planning/` at project root:**

- User stories → `.safeword/planning/user-stories/`
- Test definitions → `.safeword/planning/test-definitions/`
- Design docs → `.safeword/planning/design/`
- Issue capture → `.safeword/planning/issues/`

**Archive completed work:** When planning docs are completed and no longer actively referenced, move to:
- `.safeword/planning/user-stories/archive/`
- `.safeword/planning/test-definitions/archive/`
- `.safeword/planning/design/archive/`
- `.safeword/planning/issues/archive/`

**Why archive:** Prevents bloat in active planning folders while preserving history for reference.

**Fallback:** If project uses `docs/` structure instead, follow existing convention.

---

## Setup Scripts (Project Initialization)

**Purpose:** Self-contained setup scripts for installing Claude Code hooks and configurations in your projects.

**Available scripts:**
- `setup-safeword.sh` - **One-command installer** (copies guides/templates, planning/tickets/learnings, adds triggers)
- `setup-claude.sh` - Sets up Claude hooks, Arcade MCP gateway, CLAUDE.md trigger
- `setup-linting.sh` - Auto-linting on file changes (ESLint + Prettier)
- `setup-quality.sh` - Quality review prompts (Stop hook) and settings

**Usage:**

**One-command setup (recommended):**
```bash
cd /path/to/your/project
bash ./framework/scripts/setup-safeword.sh            # Install SAFEWORD structure + docs
bash ./framework/scripts/setup-claude.sh              # Install Claude hooks (+ MCP gateway)
```

**Auto-detection:** Automatically detects project type from package.json and config files:
- Next.js → if next in dependencies (ESLint + React plugins)
- Electron → if electron in dependencies
- Astro → if astro in dependencies
- React → if react in dependencies
- TypeScript → if typescript in dependencies or tsconfig.json exists
- Minimal → otherwise

**Individual scripts (advanced):**
```bash
cd /path/to/your/project
bash ./framework/scripts/setup-linting.sh --typescript  # Linting only
bash ./framework/scripts/setup-quality.sh               # Quality review only
```

**Linting:** Auto-detects TypeScript, React, Astro from package.json.
- Two-file architecture:
  - `.safeword/eslint-base.mjs` - Auto-generated (updated with `--force`)
  - `eslint.config.mjs` - Your config (customize freely, never overwritten)
- After adding/removing frameworks: `bash setup-linting.sh --force`
- Override detection: `--no-typescript`, `--no-react`, `--no-astro`

**What they create:**
- `.safeword/SAFEWORD.md` - Global patterns and workflows (copied from this file)
- `.safeword/guides/` - Reference documentation
- `.claude/hooks/` - Hook scripts (with version comments)
- `.claude/commands/` - Slash commands (`/lint`, `/quality-review`)
- `.claude/settings.json` - Hook configuration (appends to existing)
- `SAFEWORD.md` or `CLAUDE.md` - Project context file with ALWAYS trigger for @./.safeword/SAFEWORD.md
  - If CLAUDE.md exists → prepends trigger
  - If SAFEWORD.md exists → ensure it references @./.safeword/SAFEWORD.md
  - If neither exists → creates SAFEWORD.md with trigger
- Config files if needed (`eslint.config.mjs`, `.prettierrc`)

**Key features:**
- ✅ **Fully standalone** - All files copied to project, no external dependencies
- ✅ **Version tracking** - Generated files include version comments
- ✅ **Idempotent** - Safe to run multiple times, won't duplicate hooks
- ✅ **Append-only** - Preserves existing custom hooks
- ✅ **Order-independent** - Can run scripts in any order

**Documentation:**
- Consolidated setup guide: `README.md` (this folder)

**For teams:**
1. Get setup scripts (clone repo temporarily or download scripts)
2. In each project, run one command:
   ```bash
   cd /path/to/project
   bash ./framework/scripts/setup-safeword.sh  # One command, full setup
   ```
3. **Result**: Project becomes standalone with:
   - `.safeword/SAFEWORD.md` - Global patterns (copy of this file)
   - `.safeword/guides/` - Reference documentation
   - `.claude/` - Hooks and commands
- `SAFEWORD.md` or `CLAUDE.md` - Project context with @./.safeword/SAFEWORD.md reference
4. **COMMIT to repo**: Commit `.safeword/` and `.claude/` for team consistency
5. **Delete source**: Can delete setup scripts/repo after running - project is fully portable

---

## Ticket System (Context Anchor for Non-Trivial Work)

**Purpose:** Tickets serve as persistent memory to prevent context loss when work becomes complex, requires multiple attempts, or might spiral.

**Not for archival** - Tickets are session anchors to prevent LLM loops and confusion.

**Location:** `.safeword/tickets/`

**Naming convention:** `{id}-{slug}.md`
- Example: `001-fix-login-bug.md`, `002-add-oauth.md`, `003-debug-slow-query.md`
- Planning docs (if needed) share same prefix: `002-add-oauth.md` in planning subfolders

**Minimal structure:**
```markdown
---
id: 001
status: in_progress
---

# Fix Login Button Not Responding

**Goal:** Make login button respond to clicks

**Why:** Users can't log in - button does nothing on click

## Work Log
- 2025-11-24T19:00:15Z Started: Investigating button click issue
- 2025-11-24T19:02:30Z Found: onClick handler missing in Button component
- 2025-11-24T19:05:00Z RED: Added test for button click (refs: tests/button.test.ts)
- 2025-11-24T19:08:15Z GREEN: Added onClick handler; test passing (refs: 7f3e2a9)
- 2025-11-24T19:09:00Z Complete: Button fixed, verified with test
```

**For complex features, add optional sections:**
```markdown
### Planning Docs
- .safeword/planning/user-stories/002-oauth-login.md
- .safeword/planning/test-definitions/002-oauth-login.md

### Scope
**In scope:** Google OAuth, account linking, token refresh
**Out of scope:** Other providers (separate ticket)

### Acceptance Criteria
- [ ] All user stories completed
- [ ] Security review passed
```

**Template:** Use `.safeword/templates/ticket-template.md` when creating a ticket.

**Work Log is critical:** Log immediately after each action. Re-read ticket frequently to prevent loops.

**When to create tickets (context-loss risk assessment):**

**Create ticket if ANY of these apply:**
- Work might require multiple attempts/approaches (styling bugs, performance issues)
- Work has multiple steps with dependencies (A must work before B)
- Investigation/debugging required (unknown cause, non-obvious solution)
- Anything that might cause you to lose context or loop mid-session

**Skip ticket if:**
- Obvious one-shot change (fix typo, update constant, change text label)
- Takes <2 minutes with zero risk of confusion or cascading issues
- No investigation needed, solution is clear

**Examples:**
- "Fix typo in README" → No ticket (obvious, one-shot)
- "Make button red" → Ticket (might break mobile, cascade issues)
- "Debug slow login" → Ticket (investigation needed, multiple hypotheses)
- "Add OAuth" → Ticket (complex, multi-step, planning docs needed)

**Relationship to planning docs:**
- **Ticket** = Context anchor (prevents loops, tracks attempts)
- **Planning docs** = Detailed specs for complex features (user stories, test definitions)
- **TodoWrite** = Task-level tracking within current work session

**Workflow:**
1. **Create ticket:** `.safeword/tickets/{id}-{slug}.md`
2. **Fill in Goal + Why** (one sentence each) - This is your anchor
3. **Add initial work log entry:** "Started: [task]"
4. **Re-read ticket before EVERY significant action** - Check what you're trying to do
5. **Log immediately** after each attempt, finding, commit, or blocker
6. **For complex features:** Add planning docs, reference them in optional sections
7. **When stuck:** Re-read work log - what have you tried? What's the goal?
8. **When complete:** Log final entry, update status to `done`, ask user to confirm
9. **After confirmation:** Move to `.safeword/tickets/completed/{id}-{slug}.md`

**CRITICAL:** NEVER mark ticket as `done` or archive without explicit user confirmation. User must verify:
- All acceptance criteria met
- All tests passing
- Feature works as expected
- No regressions introduced

**Archiving:**
- Completed tickets → `.safeword/tickets/completed/`
- Blocked/cancelled tickets → `.safeword/tickets/archived/`
- Active tickets stay in `.safeword/tickets/`

**Why confirm:** Prevents premature closure and ensures quality standards met.

---

## Feature Development Workflow (CRITICAL - Always Follow)

**When to read:** ALWAYS - Before starting ANY new feature, bug fix, or code change. This is the entry point for all development work.

### Starting a New Feature

**When user requests a new feature or references an issue number:**

**IN ORDER:**

**0. Check for Ticket / Create If Needed** (context-loss prevention)

   - Search `.safeword/tickets/` for matching ticket file
   - **If found:**
     - **Read ticket first** - What's the goal? What have I tried?
     - Check work log for previous attempts/findings
     - Log: "Resumed work on [task]"
     - **Re-read ticket before each significant action**
     - For complex features: Follow planning docs if referenced
   - **If not found:**
     - **Assess context-loss risk:**
       - Obvious one-shot (<2 min, no investigation)? → Skip ticket, skip to TDD (step 4)
       - Might require multiple attempts? → Create ticket, skip to TDD (step 4)
       - Investigation/debugging needed? → Create ticket, skip to TDD (step 4)
       - Complex feature (multi-story)? → Create ticket, continue to planning docs (step 1)

1. **User Stories** - Search `.safeword/planning/user-stories/` or `docs/user-stories/`

   - Not found → Ask user if they exist elsewhere or offer to create
   - Found → Read them
   - **Guide:** `@./.safeword/guides/user-story-guide.md`

2. **Test Definitions** - Search `.safeword/planning/test-definitions/` or `docs/test-definitions/`

   - Not found → Ask user if they exist elsewhere or offer to create
   - Found → Read them
   - **Guide:** `@./.safeword/guides/test-definitions-guide.md`

3. **Design Doc** (complex features only) - Search `.safeword/planning/design/` or `docs/design/`

   - Complex = >3 components, spans 2+ user stories, new data model, or architectural decisions
   - Not found → Ask if needed, create if yes
   - Found → Read it
   - **Guide:** `@./.safeword/guides/design-doc-guide.md`

4. **Follow STRICT TDD Workflow** (RED → GREEN → REFACTOR)
   - Write failing tests first (RED phase)
   - Implement minimum code to pass (GREEN phase)
   - Refactor while keeping tests green
   - **Workflow:** `@./.safeword/guides/testing-methodology.md` (comprehensive TDD guidance and test type decision tree)

5. **Update Ticket** (if applicable)
   - **Re-read ticket frequently** - Before each action, check: What's the goal? What have I tried?
   - **Log immediately** after each action - Don't batch; log as you go
   - Log: attempts (tried X, result Y), findings (found Z), commits, blockers, decisions
   - When work complete: Log final entry, update status to `done`
   - **Ask user to confirm** completion before archiving
   - After confirmation: Move to `.safeword/tickets/completed/`

**IMPORTANT:** Do not skip to implementation without user stories and test definitions. Follow TDD strictly.

**Edge cases:**

- User stories exist but test definitions don't → Create test definitions before implementation
- Test definitions exist but user stories don't → Ask if user stories needed
- Neither exist → Create both before implementation
- Ticket references non-existent planning docs → Create them first

---

### Commit Frequently

**Commit early, commit often:** Small, atomic commits after each meaningful change.

**When to commit:**
- After each test passes (GREEN phase)
- Before refactoring (safe point to revert)
- After successful refactor
- When switching context or tasks
- After completing a logical unit of work

**Why:** Prevents work loss, enables easy rollback, creates reviewable history.

---

### When to Update Architecture Docs

**Update project/package ARCHITECTURE.md when:**

- Making technology choices (state management, database, frameworks)
- Designing data models or schemas
- Establishing project-wide patterns/conventions
- Discovering architectural insights during implementation
- Recording "why" behind major decisions

**Use Design Doc instead when:**

- Implementing a specific feature
- Documenting component interactions for one feature
- Feature-specific technical decisions
- Implementation details (not project-wide principles)

**Quick Decision Matrix:**

| Question | Architecture Doc | Design Doc |
|----------|------------------|------------|
| Tech/framework choice? | ✅ | — |
| Data model design? | ✅ | References it |
| New feature implementation? | — | ✅ |
| Component breakdown? | — | ✅ |

**Tie-breaking rule:** If decision affects 2+ features or multiple developers → Architecture doc. If feature-specific only → Design doc.

**Reference:** `@./.safeword/guides/architecture-guide.md`

---

### Creating Documentation (Explicit User Requests)

**Note**: When user explicitly requests documentation, skip the workflow questions and create directly.

**User Stories:**

- **Trigger (Create):** User says "Create user stories for issue #N" or "Create user stories for [feature]"
- **Trigger (Review):** User asks "Is this story good?" or "Review my user story"
- Skip the "Do user stories exist?" question (user is explicitly requesting creation)
- **Template:** `@./.safeword/templates/user-stories-template.md`
- **Guide:** `@./.safeword/guides/user-story-guide.md`

**Test Definitions:**

- **Trigger:** User says "Create test definitions for issue #N" or "Create test definitions for [feature]"
- Skip the "Do test definitions exist?" question (user is explicitly requesting creation)
- **Template:** `@./.safeword/templates/test-definitions-feature.md`
- **Guide:** `@./.safeword/guides/test-definitions-guide.md`

**Design Doc:**

- **Trigger:** User says "Create design doc for [feature]" or "Design [system/component]"
- Skip the "Does design doc exist?" question (user is explicitly requesting creation)
- **Prerequisites:** Verify user stories and test definitions exist first (create if not)

**Required sections checklist:**
- [ ] **Architecture** — 1-2 paragraphs on high-level approach
- [ ] **Components** — [N] and [N+1] examples with name, responsibility, interface, dependencies
- [ ] **User Flow** — Step-by-step with concrete examples
- [ ] **Key Decisions** — What, why, trade-off, alternatives considered
- [ ] **Data Model** — (if applicable) State shape, relationships
- [ ] **Component Interaction** — (if applicable) How components communicate
- [ ] **Implementation Notes** — (if applicable) Constraints, error handling, gotchas

- **Template:** `@./.safeword/templates/design-doc-template.md`
- **Guide:** `@./.safeword/guides/design-doc-guide.md`

**Architecture Doc:**

- **Trigger (Create):** Starting a new project/package, or no `ARCHITECTURE.md` exists yet
- **Trigger (Update):** User says "Update architecture doc" or "Document [architectural decision]"
- **Trigger (Implicit):** After discussing architectural decisions, proactively ask: "Should I document this in ARCHITECTURE.md?"
- **Recognize architectural discussions when user mentions:**
  - Technology choices (state management, database, frameworks)
  - Data model design
  - Project-wide patterns/conventions

**Required sections checklist** (verify all present when creating/reviewing):
- [ ] **Header** — Version, Last Updated, Status (Production/Design/Proposed)
- [ ] **Table of Contents** — Section links
- [ ] **Overview** — Technology choices, data model philosophy, high-level architecture
- [ ] **Data Architecture Principles** — What, Why, Trade-off for each principle
- [ ] **Data Model / Schema** — Tables, types, relationships
- [ ] **Component Design** — Major components and responsibilities
- [ ] **Data Flow Patterns** — How data moves through the system
- [ ] **Key Decisions** — What, Why, Trade-off, Alternatives Considered
- [ ] **Best Practices** — Domain-specific patterns
- [ ] **Migration Strategy** — How to evolve architecture
- [ ] **Code References** — Link to implementations (`src/file.ts:line` or function names)

**Anti-patterns to avoid:**
- ❌ ADR sprawl (many separate files) → consolidate into one doc
- ❌ Missing rationale → every decision needs "Why" with specifics
- ❌ Implementation details → keep high-level principles only

- **No template** - Create comprehensive `ARCHITECTURE.md` in project root
- **Guide:** `@./.safeword/guides/architecture-guide.md`

**Data Architecture Doc:**

- **Trigger (Explicit):** User says "Document data architecture" or "Design data model"
- **Trigger (Implicit):** When discussing database schema, data flows, or storage decisions
- **Recognize data architecture discussions when user mentions:**
  - Database/storage technology choices
  - Schema design (entities, relationships, constraints)
  - Data validation rules, access policies, lifecycle
  - Data flows (sources, transformations, destinations)
- **Section in ARCHITECTURE.md or separate file** - Depends on project complexity
- **Guide:** `@./.safeword/guides/data-architecture-guide.md`

---

## TodoWrite Best Practices

**When to use:** Complex multi-step tasks (3+ distinct steps), non-trivial tasks requiring planning, or when user provides multiple tasks.

**Critical rules:**

- ✓ **Create as first tool call** - For multi-step tasks, create TODO list before starting work
- ✓ **Use VERY frequently** - Track tasks and give user visibility into progress
- ✓ **Mark in_progress BEFORE work** - Ideally only ONE task in_progress at a time
- ✓ **Complete immediately** - Mark completed as soon as done, don't batch
- ✓ **Two forms required** - `content` (imperative: "Run tests") + `activeForm` (continuous: "Running tests")
- ✓ **Replace entire list** - Updates replace complete list, not incremental changes

**When NOT to use:**

- Single straightforward task
- Trivial operations (1-2 simple steps)
- Purely conversational requests

**Example:**

```json
{
  "todos": [
    {
      "content": "Write failing tests",
      "status": "completed",
      "activeForm": "Writing failing tests"
    },
    {
      "content": "Implement minimum code to pass",
      "status": "in_progress",
      "activeForm": "Implementing minimum code"
    },
    {
      "content": "Refactor while keeping tests green",
      "status": "pending",
      "activeForm": "Refactoring code"
    }
  ]
}
```

---

## Response Format (CRITICAL - Always Include)

At the end of EVERY response, include a JSON summary with this exact structure:
```json
{"proposedChanges": boolean, "madeChanges": boolean, "askedQuestion": boolean}
```

Where (all fields describe **this response only**, not cumulative):
- `proposedChanges`: `true` if you suggested/proposed changes to specific files **in this response**
- `madeChanges`: `true` if you **modified files in this response** using Write/Edit tools
- `askedQuestion`: `true` if you asked the user a question and need their response before proceeding

Examples:
- Discussed approach only: `{"proposedChanges": false, "madeChanges": false, "askedQuestion": false}`
- Proposed edits but waiting for approval: `{"proposedChanges": true, "madeChanges": false, "askedQuestion": false}`
- Made edits directly: `{"proposedChanges": false, "madeChanges": true, "askedQuestion": false}`
- Proposed AND made edits: `{"proposedChanges": true, "madeChanges": true, "askedQuestion": false}`
- Asked user a question: `{"proposedChanges": false, "madeChanges": false, "askedQuestion": true}`
- **Quality review response** (no new changes): `{"proposedChanges": false, "madeChanges": false, "askedQuestion": false}`

---

## Avoid Over-Engineering

**Trigger:** Before adding any abstraction, utility, or "future-proofing" code.

**Decision:** Is this the simplest solution that works?

| ❌ Over-engineering | ✅ Keep it simple |
|---------------------|-------------------|
| Utility class for one function | Single function |
| Factory/builder for simple object | Direct construction |
| Config file for 2 options | Hardcode or params |
| Abstract class with one impl | Concrete class |

**When to push back:** If feature adds >50 lines for "nice to have", ask user if essential now.

**Self-documenting code:** Use descriptive names (`calculateTotalWithTax` not `calcTot`). Comment only non-obvious logic.

**Error handling:** Never swallow errors. Include context: `Failed to read ${filePath}: ${e.message}`

**Debug logging:** Log actual vs expected values. Remove debug logs after fixing.

**Cross-platform:** Use `path.join()` not string concat. No hardcoded `/` or `\`.

**Guide:** `@./.safeword/guides/code-philosophy.md`

---

## Self-Testing (CRITICAL - Always Test Your Own Work)

**The user's time is precious. Always test your own work before declaring it complete.**

**Core principle:** NEVER ask the user to verify or test something you can test yourself. Run tests, verify fixes, and confirm functionality before reporting completion.

**When to self-test:**

- ✓ **After fixing bugs** - Run the relevant tests to verify the fix works
- ✓ **After implementing features** - Run all affected tests (unit, integration, E2E)
- ✓ **After making changes** - Verify the change has the intended effect
- ✓ **Before declaring completion** - Always run tests yourself, don't ask the user to do it
- ✓ **When uncertain** - If you're not sure it works, TEST IT before claiming success

**Tools for self-testing:**

- E2E tests: `pnpm test:e2e` or specific test files
- Unit tests: `pnpm test` or `pnpm test:unit`
- Integration tests: `pnpm test:integration`
- Manual verification: Use curl, check browser console, verify API responses
- Dev server: Check compilation errors, hot reload, runtime errors

**Capturing test output:**

Don't pipe through `head`/`tail` directly—capture to a timestamped log file first, then analyze:

```bash
# ✅ GOOD - Capture to file, then analyze
mkdir -p /tmp/test-logs
LOG=/tmp/test-logs/$(date +%s)-e2e.log
pnpm test:e2e 2>&1 | tee $LOG
tail -100 $LOG  # Check summary
cat $LOG        # Full output if needed

# ❌ BAD - Can't dig deeper without re-running tests
pnpm test:e2e 2>&1 | tail -50
```

**Anti-patterns:**

- ❌ **DON'T:** "I've made the changes. Please refresh your browser and test."
- ❌ **DON'T:** "The fix should work now. Can you verify?"
- ❌ **DON'T:** "Try it now and let me know if it works."

**Correct patterns:**

- ✅ **DO:** "I've fixed the issue. Let me run the tests to verify..." [runs tests] "Tests pass ✓"
- ✅ **DO:** "Fixed the bug. Running E2E tests to confirm..." [runs tests] "All tests passing ✓"
- ✅ **DO:** "Implemented the feature. Testing now..." [runs tests] "Tests confirm it works ✓"

**Example workflow:**

```
1. User reports bug: "Button doesn't enable when typing"
2. Investigate and fix the bug
3. Run tests yourself: AUTH_MODE=demo pnpm exec playwright test
4. Verify tests pass
5. Report to user: "Fixed. Tests confirm button now enables correctly ✓"
```

**Edge cases:**

- If tests require special setup (API keys, credentials): Mention requirements but still run what you can
- If tests are slow (>5 min): Run them in background, show progress, report when done
- If no automated tests exist: Create them as part of the fix, then run them

**Remember:** The user should only test when they want to verify the UX/experience themselves, not to confirm your code works. Your code working is YOUR responsibility to verify.

**Before declaring complete:** Run self-review checklist (correctness, elegance, best practices, docs/versions, tests). Note any deferred issues.

---

## Code Philosophy & Practices

**When to read:** Before writing code, when making architectural decisions, or when unsure about coding standards and best practices.

**Documentation verification:** Before using any library API, check `package.json` for version and verify with Context7 or official docs. Training data is stale.

Core coding principles, testing philosophy (TDD), communication style, best practices, and tooling currency.

@./.safeword/guides/code-philosophy.md

---

## TDD Templates & Best Practices Reference

**When to read:** When creating user stories, test definitions, design docs, or evaluations. Provides templates and examples of good vs bad practices.

**Triggers:**
- Creating user stories, test definitions, or design docs
- User asks "Which template should I use?" or "What doc type for X?"
- Need examples of good vs bad user stories or tests

User story templates (As a X / Given-When-Then), test definition patterns, and concrete examples.

@./.safeword/guides/tdd-best-practices.md

---

## Testing Methodology

**When to read:** Before starting ANY feature (TDD workflow), when choosing test type (unit/integration/E2E/LLM eval), or when writing tests.

Comprehensive TDD workflow (RED → GREEN → REFACTOR), test pyramid, decision trees, async testing, project-specific docs guidance.

@./.safeword/guides/testing-methodology.md

---

## LLM Prompting Best Practices

**When to read:** When working with AI features, writing prompts, implementing LLM evaluations, or optimizing AI costs.

Prompt engineering, cost optimization (caching strategies), and testing AI outputs (LLM-as-judge).

@./.safeword/guides/llm-prompting.md

---

## Writing Instructions for LLMs

**When to read:** When creating or updating ANY documentation that LLMs will read (CLAUDE.md, AGENTS.md, user stories, test definitions, design docs, architecture docs, guides).

13 core principles for LLM-consumable documentation: MECE decision trees, explicit definitions, concrete examples, no contradictions, edge cases explicit, actionable language, sequential decision trees, tie-breaking rules, lookup tables, no caveats in tables, percentages with context, specific technical terms, and re-evaluation paths.

@./.safeword/guides/llm-instruction-design.md

---

## AGENTS.md/CLAUDE.md File Structure & Maintenance

**When to read:** When creating or updating project AGENTS.md/CLAUDE.md files, organizing documentation, or setting up new projects.

How to write, organize, and maintain AGENTS.md/CLAUDE.md files across projects. Anti-patterns, examples, and modular approaches.

@./.safeword/guides/context-files-guide.md

---

## Project Memory

**Context:** After extracting learnings (see Learning Extraction section below), add them to project documentation for team knowledge sharing.

**Where to add:**

- Architecture decisions: Add to ARCHITECTURE.md (or AGENTS.md if no ARCHITECTURE.md exists)
- Common gotchas (1-2 sentences): Add to AGENTS.md → Common Gotchas section
- Detailed learnings (needs examples): Extract to `.safeword/learnings/` and cross-reference in SAFEWORD.md

**See:** Learning Extraction section below for full workflow

---

## Zombie Process Cleanup

**When to read:**
- Working on multiple projects simultaneously
- Port already in use errors (`EADDRINUSE`, `address already in use`)
- Stuck processes (dev server won't start, tests hang)
- Tech stacks: Next.js, Playwright, Vite, Expo

Port-based cleanup strategies, project-specific scripts, and multi-project isolation techniques.

@./.safeword/guides/zombie-process-cleanup.md

---

## Learning Extraction

**When to read:** When experiencing debugging complexity (5+ debug cycles, user says "stuck"), discovering gotchas, trying multiple approaches, or during significant implementation work. Use to determine if/where to extract learnings and check for existing learnings.

**Suggest extraction when you observe:**
1. **Observable debugging complexity** - User says "stuck", 5+ debug cycles, 3+ error states, or 3+ files modified
2. **Trial and error** - Tried 3+ different approaches
3. **Undocumented gotcha** - Not in official library/framework docs
4. **Integration struggle** - Two tools don't work together smoothly
5. **Testing trap** - Tests pass but UX broken (or vice versa)
6. **Architectural insight** - Discovered during implementation, not planned upfront

**CRITICAL: Before extracting, ALWAYS check for existing learnings** to prevent duplication:
- **Before debugging** - Check if similar issue has learning: `ls .safeword/learnings/*[technology]*.md`
- **When user mentions technology/pattern** - Check for `*hooks*.md`, `*electron*.md`, etc.
- **During architectural discussions** - Check for `*pattern*.md`, `*architecture*.md`
- **After suggesting extraction** - Check if learning already exists, update instead of duplicate

**When to reference existing learnings:**
- Found → Read and apply: "I found an existing learning about [concept] at [path]. Applying it now."
- Similar but different → Reference and note difference

**Where to extract:**
- `.safeword/learnings/[concept].md` - General patterns and best practices (React patterns, Git workflows, testing)
- `.safeword/learnings/[concept].md` - Project-specific (custom architecture, unique patterns for this codebase)

**Maintenance triggers:**
- Learning file >200 lines → Split into focused files
- Multiple learnings cover similar topic → Consolidate
- Technology deprecated → Archive with "OBSOLETE:" prefix

**Full workflow, templates, decision trees, and examples:** @./.safeword/guides/learning-extraction.md
