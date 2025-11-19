# Global Instructions for AI Coding Agents

This file provides core guidance for all AI coding agent sessions. Organized modularly for maintainability.

---

## Planning Documentation Location

**All planning markdown files go in `./agents/planning/` at project root:**

- User stories → `./agents/planning/user-stories/`
- Test definitions → `./agents/planning/test-definitions/`
- Design docs → `./agents/planning/design/`
- Issue capture → `./agents/planning/issues/`

**Fallback:** If project uses `docs/` structure instead, follow existing convention.

---

## Ticket System (Higher-Level Work Tracking)

**Purpose:** Tickets encapsulate higher-level features/epics that contain multiple planning docs and implementation tasks.

**Location:** `./agents/tickets/`

**Structure:**
```markdown
---
id: {number}
status: todo|in_progress|done|blocked
created: {ISO timestamp}
priority: low|medium|high
planning_refs:
  - ./agents/planning/user-stories/{feature}.md
  - ./agents/planning/test-definitions/{feature}.md
  - ./agents/planning/design/{feature}.md (if complex)
---

# {Feature Title}

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

**When to create tickets:**
- User requests a feature/epic that spans multiple user stories
- Work involves multiple planning docs (user stories + test definitions + design doc)
- Need to track progress on larger initiatives

**Relationship to planning docs:**
- **Ticket** = Higher-level feature/epic (e.g., "User Authentication System")
- **Planning docs** = Detailed specs referenced by ticket (user stories, test definitions, design docs)
- **TodoWrite** = Task-level tracking within current work session

**Workflow:**
1. Create ticket in `./agents/tickets/{id}-{feature-slug}.md`
2. Create/reference planning docs in ticket's `planning_refs`
3. Follow standard Feature Development Workflow (user stories → test definitions → TDD)
4. Update ticket status and work log as you progress

---

## Feature Development Workflow (CRITICAL - Always Follow)

**When to read:** ALWAYS - Before starting ANY new feature, bug fix, or code change. This is the entry point for all development work.

### Starting a New Feature

**When user requests a new feature or references an issue number:**

**IN ORDER:**
1. **User Stories** - Search `./agents/planning/user-stories/` or `docs/user-stories/`

   - Not found → Ask user if they exist elsewhere or offer to create
   - Found → Read them
   - **Guide:** `@~/.agents/coding/guides/user-story-guide.md`

2. **Test Definitions** - Search `./agents/planning/test-definitions/` or `docs/test-definitions/`

   - Not found → Ask user if they exist elsewhere or offer to create
   - Found → Read them
   - **Guide:** `@~/.agents/coding/guides/test-definitions-guide.md`

3. **Design Doc** (complex features only) - Search `./agents/planning/design/` or `docs/design/`

   - Complex = >3 components, new data model, or architectural decisions
   - Not found → Ask if needed, create if yes
   - Found → Read it
   - **Guide:** `@~/.agents/coding/guides/design-doc-guide.md`

4. **Follow STRICT TDD Workflow** (RED → GREEN → REFACTOR)
   - Write failing tests first (RED phase)
   - Implement minimum code to pass (GREEN phase)
   - Refactor while keeping tests green
   - **Workflow:** `@~/.agents/coding/guides/testing-methodology.md` (comprehensive TDD guidance and test type decision tree)

**IMPORTANT:** Do not skip to implementation without user stories and test definitions. Follow TDD strictly.

**Edge cases:**

- User stories exist but test definitions don't → Create test definitions before implementation
- Test definitions exist but user stories don't → Ask if user stories needed
- Neither exist → Create both before implementation

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

**Tie-breaking rule:** If decision affects 2+ features or multiple developers → Architecture doc. If feature-specific only → Design doc.

**Reference:** `@~/.agents/coding/guides/architecture-guide.md`

---

### Creating Documentation (Explicit User Requests)

**Note**: When user explicitly requests documentation, skip the workflow questions and create directly.

**User Stories:**

- **Trigger:** User says "Create user stories for issue #N" or "Create user stories for [feature]"
- Skip the "Do user stories exist?" question (user is explicitly requesting creation)
- **Template:** `@~/.agents/coding/templates/user-stories-template.md`
- **Guide:** `@~/.agents/coding/guides/user-story-guide.md`

**Test Definitions:**

- **Trigger:** User says "Create test definitions for issue #N" or "Create test definitions for [feature]"
- Skip the "Do test definitions exist?" question (user is explicitly requesting creation)
- **Template:** `@~/.agents/coding/templates/test-definitions-feature.md`
- **Guide:** `@~/.agents/coding/guides/test-definitions-guide.md`

**Design Doc:**

- **Trigger:** User says "Create design doc for [feature]" or "Design [system/component]"
- Skip the "Does design doc exist?" question (user is explicitly requesting creation)
- **Template:** `@~/.agents/coding/templates/design-doc-template.md`
- **Guide:** `@~/.agents/coding/guides/design-doc-guide.md`

**Architecture Doc:**

- **Trigger (Explicit):** User says "Update architecture doc" or "Document [architectural decision]"
- **Trigger (Implicit):** After discussing architectural decisions, proactively ask: "Should I document this decision in ARCHITECTURE.md?"
- **Recognize architectural discussions when user mentions:**
  - Technology choices (state management, database, frameworks)
  - Data model design
  - Project-wide patterns/conventions
- **No template** - Create comprehensive `ARCHITECTURE.md` in project root
- **Guide:** `@~/.agents/coding/guides/architecture-guide.md`

**Data Architecture Doc:**

- **Trigger (Explicit):** User says "Document data architecture" or "Design data model"
- **Trigger (Implicit):** When discussing database schema, data flows, or storage decisions
- **Recognize data architecture discussions when user mentions:**
  - Database/storage technology choices
  - Schema design (entities, relationships, constraints)
  - Data validation rules, access policies, lifecycle
  - Data flows (sources, transformations, destinations)
- **Section in ARCHITECTURE.md or separate file** - Depends on project complexity
- **Guide:** `@~/.agents/coding/guides/data-architecture-guide.md`

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
- Trivial operations (<3 steps)
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
{"proposedChanges": boolean, "madeChanges": boolean}
```

Where:
- `proposedChanges`: `true` if you suggested/proposed changes to specific files in your response
- `madeChanges`: `true` if you actually modified files using Write/Edit tools

Examples:
- Discussed approach only: `{"proposedChanges": false, "madeChanges": false}`
- Proposed edits but waiting for approval: `{"proposedChanges": true, "madeChanges": false}`
- Made edits directly: `{"proposedChanges": false, "madeChanges": true}`
- Proposed AND made edits: `{"proposedChanges": true, "madeChanges": true}`

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

---

## Code Philosophy & Practices

**When to read:** Before writing code, when making architectural decisions, or when unsure about coding standards and best practices.

Core coding principles, testing philosophy (TDD), communication style, and best practices.

@~/.agents/coding/guides/code-philosophy.md

---

## TDD Templates & Best Practices Reference

**When to read:** When creating user stories, test definitions, design docs, or evaluations. Provides templates and examples of good vs bad practices.

User story templates (As a X / Given-When-Then), test definition patterns, and concrete examples.

@~/.agents/coding/guides/tdd-templates.md

---

## Testing Methodology

**When to read:** Before starting ANY feature (TDD workflow), when choosing test type (unit/integration/E2E/LLM eval), or when writing tests.

Comprehensive TDD workflow (RED → GREEN → REFACTOR), test pyramid, decision trees, async testing, project-specific docs guidance.

@~/.agents/coding/guides/testing-methodology.md

---

## LLM Prompting Best Practices

**When to read:** When working with AI features, writing prompts, implementing LLM evaluations, or optimizing AI costs.

Prompt engineering, cost optimization (caching strategies), and testing AI outputs (LLM-as-judge).

@~/.agents/coding/guides/llm-prompting.md

---

## Writing Instructions for LLMs

**When to read:** When creating or updating ANY documentation that LLMs will read (CLAUDE.md, AGENTS.md, user stories, test definitions, design docs, architecture docs, guides).

13 core principles for LLM-consumable documentation: MECE decision trees, explicit definitions, concrete examples, no contradictions, edge cases explicit, actionable language, sequential decision trees, tie-breaking rules, lookup tables, no caveats in tables, percentages with context, specific technical terms, and re-evaluation paths.

@~/.agents/coding/guides/llm-instruction-design.md

---

## AGENTS.md/CLAUDE.md File Structure & Maintenance

**When to read:** When creating or updating project AGENTS.md/CLAUDE.md files, organizing documentation, or setting up new projects.

How to write, organize, and maintain AGENTS.md/CLAUDE.md files across projects. Anti-patterns, examples, and modular approaches.

@~/.agents/coding/guides/agents-md-guide.md

---

## Project Memory

**Context:** After extracting learnings (see Learning Extraction section below), add them to project documentation for team knowledge sharing.

**Where to add:**

- Architecture decisions: Add to ARCHITECTURE.md (or AGENTS.md if no ARCHITECTURE.md exists)
- Common gotchas (1-2 sentences): Add to AGENTS.md → Common Gotchas section
- Detailed learnings (needs examples): Extract to `agents/learnings/` and cross-reference in AGENTS.md

**See:** Learning Extraction section below for full workflow

---

## Zombie Process Cleanup

**When to read:** When working on multiple projects simultaneously, especially when they share tech stacks (Next.js, Playwright, etc.)

Port-based cleanup strategies, project-specific scripts, and multi-project isolation techniques.

@~/.agents/coding/guides/zombie-process-cleanup.md

---

## Learning Extraction

**When to read:** When experiencing debugging complexity (5+ debug cycles, user says "stuck"), discovering gotchas, trying multiple approaches, or after completing features. Use to determine if/where to extract learnings and check for existing learnings.

**Suggest extraction when you observe:**
1. **Observable debugging complexity** - User says "stuck", 5+ debug cycles, 3+ error states, or 3+ files modified
2. **Trial and error** - Tried 3+ different approaches
3. **Undocumented gotcha** - Not in official library/framework docs
4. **Integration struggle** - Two tools don't work together smoothly
5. **Testing trap** - Tests pass but UX broken (or vice versa)
6. **Architectural insight** - Discovered during implementation, not planned upfront

**CRITICAL: Before extracting, ALWAYS check for existing learnings** to prevent duplication:
- **Before debugging** - Check if similar issue has learning: `ls ~/.agents/coding/learnings/*[technology]*.md`
- **When user mentions technology/pattern** - Check for `*hooks*.md`, `*electron*.md`, etc.
- **During architectural discussions** - Check for `*pattern*.md`, `*architecture*.md`
- **After suggesting extraction** - Check if learning already exists, update instead of duplicate

**When to reference existing learnings:**
- Found → Read and apply: "I found an existing learning about [concept] at [path]. Applying it now."
- Similar but different → Reference and note difference

**Where to extract:**
- `~/.agents/coding/learnings/[concept].md` - Global (applies to ALL projects: React patterns, Git workflows)
- `./agents/learnings/[concept].md` - Project-specific (custom architecture, unique patterns)

**Full workflow, templates, decision trees, and examples:** @~/.agents/coding/guides/learning-extraction.md
