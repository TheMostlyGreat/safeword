# Global Instructions for AI Coding Agents

This file provides core guidance for all AI coding agent sessions. Organized modularly for maintainability.

---

## Feature Development Workflow (CRITICAL - Always Follow)

**When to read:** ALWAYS - Before starting ANY new feature, bug fix, or code change. This is the entry point for all development work.

### Starting a New Feature

**When user requests a new feature or references an issue number:**

1. **User Stories** - Search `planning/user-stories/` or `docs/user-stories/`
   - Not found → Ask user if they exist elsewhere or offer to create
   - Found → Read them
   - **Guide:** `@~/.agents/coding/guides/user-story-guide.md`

2. **Test Definitions** - Search `planning/test-definitions/` or `docs/test-definitions/`
   - Not found → Ask user if they exist elsewhere or offer to create
   - Found → Read them
   - **Guide:** `@~/.agents/coding/guides/test-definitions-guide.md`

3. **Design Doc** (complex features only) - Search `planning/design/` or `docs/design/`
   - Complex = >3 components, new data model, or architectural decisions
   - Not found → Ask if needed, create if yes
   - Found → Read it
   - **Guide:** `@~/.agents/coding/guides/design-doc-guide.md`

4. **Follow TDD Workflow** (RED → GREEN → REFACTOR)
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
    {"content": "Write failing tests", "status": "completed", "activeForm": "Writing failing tests"},
    {"content": "Implement minimum code to pass", "status": "in_progress", "activeForm": "Implementing minimum code"},
    {"content": "Refactor while keeping tests green", "status": "pending", "activeForm": "Refactoring code"}
  ]
}
```

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

## CLAUDE.md File Structure & Maintenance

**When to read:** When creating or updating project CLAUDE.md/AGENTS.md files, organizing documentation, or setting up new projects.

How to write, organize, and maintain CLAUDE.md/AGENTS.md files across projects. Anti-patterns, examples, and modular approaches.

@~/.agents/coding/guides/claude-md-guide.md

---

## Project Memory

**Context:** After extracting learnings (see Learning Extraction section below), add them to project documentation for team knowledge sharing.

**Where to add:**
- Architecture decisions: Add to ARCHITECTURE.md (or CLAUDE.md if no ARCHITECTURE.md exists)
- Common gotchas (1-2 sentences): Add to CLAUDE.md → Common Gotchas section
- Detailed learnings (needs examples): Extract to `agents/learnings/` and cross-reference in CLAUDE.md

**See:** Learning Extraction section below for full workflow

---

## Learning Extraction

**When to read:** Use the decision tree below to determine if extraction is needed. This ensures valuable knowledge compounds across sessions.

### Recognition Triggers (Answer IN ORDER, Stop at First YES)

**Note:** LLMs cannot sense time. Use observable signals instead of duration.

1. **Observable debugging complexity?** (any of these signals)
   - User says "still debugging", "been stuck on this", "tried many things"
   - 5+ debug cycles (Read → Edit → Bash pattern repeated)
   - 3+ different error states encountered
   - Modified 3+ files while debugging same issue
   - YES → Suggest extraction IMMEDIATELY: "I notice this pattern could save time on future work. Should I extract a learning after we fix this?"
   - NO → Continue to #2

2. **Tried 3+ different approaches?**
   - YES → Suggest extraction AFTER fix complete: "I noticed we tried 3+ approaches - should I document this as a learning?"
   - NO → Continue to #3

3. **Found gotcha not in official library/framework docs?**
   - YES → Suggest extraction AFTER fix complete
   - NO → Continue to #4

4. **Two tools don't work together smoothly?** (integration struggle)
   - YES → Suggest extraction AFTER fix complete
   - NO → Continue to #5

5. **Tests pass but UX broken (or vice versa)?** (testing trap)
   - YES → Suggest extraction AFTER fix complete
   - NO → Continue to #6

6. **Discovered architectural insight during implementation?** (not planned upfront)
   - YES → Suggest extraction AFTER task complete
   - NO → Don't suggest

**Tie-breaking rule:** If multiple triggers apply, use #1 (earliest in sequence).

**Edge cases:**
- 4 debug cycles → Don't suggest yet (need 5+)
- Only 2 approaches tried → Don't suggest yet (need 3+)
- Documented in blog post but not official docs → Counts as "undocumented gotcha" (trigger #3)
- Simple syntax error (typo, missing semicolon) → Don't suggest (not reusable knowledge)
- Library feature deprecated → Counts as "undocumented gotcha" if not clearly stated in current docs
- User says "quick debugging session" → Don't suggest (signals low complexity)

**Example - ✅ SHOULD EXTRACT:**
```
Scenario: User tried localStorage then IndexedDB (2 approaches), hit 6 debug cycles
(Read storage docs → Edit implementation → Bash test → Read errors → repeat),
discovered IndexedDB quota API is browser-specific (not in MDN docs).

Trigger: #1 (observable debugging complexity: 6 debug cycles + user mentioned "been stuck on this")
Action: Suggest IMMEDIATELY DURING debugging
Message: "I notice this pattern could save time on future work. Should I extract a learning?"
```

**Example - ❌ SHOULD NOT EXTRACT:**
```
Scenario: User found typo in variable name (`lenght` → `length`), single Read → Edit cycle,
fixed immediately, no errors, user says "quick fix".

Trigger: None match (1 debug cycle, 1 approach, trivial fix)
Action: Don't suggest extraction
```

**Re-evaluation path:** If none of the triggers match but debugging was complex/valuable, ask: "This was a complex fix - would you like me to document it as a learning anyway?"

**Where to extract:**
- `~/.agents/coding/learnings/[concept].md` - Global (applies to ALL projects: React patterns, Git workflows)
- `./agents/learnings/[concept].md` - Project-specific (custom architecture, unique patterns)

### Using Existing Learnings

**When to check for existing learnings:**
1. **Before debugging** - Check if similar issue has learning already
2. **When user mentions pattern/technology** - Check for relevant learnings (e.g., "React hooks" → search for hooks learnings)
3. **During architectural discussions** - Check for pattern learnings
4. **After suggesting extraction** - Check if learning already exists (update instead of duplicate)

**How to check:**
```bash
# Global learnings (all projects)
ls ~/.agents/coding/learnings/

# Project learnings (current project)
ls ./agents/learnings/
```

**When to reference:**
- Found existing learning → Read and apply it: "I found an existing learning about [concept] at [path]. Applying it now."
- No existing learning → Proceed normally
- Similar but different → Reference and note difference: "Similar to [existing learning], but this case differs in [X]."

**Example:**
```
User: "I'm working with React hooks"
→ Check: ls ~/.agents/coding/learnings/*hooks*.md
→ Found: react-hooks-async.md
→ Read and reference: "I found a learning about async React hooks. It mentions [key points]. Applying this to your case..."
```

**Full workflow and templates:** @~/.agents/coding/guides/learning-extraction.md
