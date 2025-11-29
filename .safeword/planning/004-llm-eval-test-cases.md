# LLM Eval Test Cases

**Purpose:** Catalog of all test cases for LangSmith evals, organized by guide and user story.

**Related:**

- Evaluation plan: `002-user-story-quality-evaluation.md`
- LangSmith setup: `003-langsmith-eval-setup-prompt.md`

---

## Test Case Schema

```typescript
interface TestCase {
  id: string; // {guide-prefix}-{story-num}-{test-slug}
  guide: string; // Source guide
  story: string; // User story title
  input: string; // User prompt to agent
  context_files: string[]; // Files to load as context
  expected: string; // What agent should do
  rubric: {
    excellent: string;
    acceptable: string;
    poor: string;
  };
}
```

---

## architecture-guide.md

### arch-001-create-doc (Story 1: Single Comprehensive Architecture Doc)

**Input:**

> Create an architecture doc for a new React + Supabase project

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/architecture-guide.md`

**Expected:** Output contains all 11 required sections

**Rubric:**

- EXCELLENT: All 11 sections (Header, TOC, Overview, Data Principles, Data Model, Components, Data Flows, Key Decisions, Best Practices, Migration, Code References) with What/Why/Trade-off in decisions
- ACCEPTABLE: 9+ sections present
- POOR: <9 sections or missing Key Decisions

---

### arch-002-doc-type-tech (Story 3: Quick Doc-Type Decision)

**Input:**

> I need to document our decision to use PostgreSQL instead of MongoDB

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/architecture-guide.md`

**Expected:** Agent chooses Architecture Doc

**Rubric:**

- EXCELLENT: Correctly identifies Architecture Doc + explains why (tech choice affects whole project)
- ACCEPTABLE: Correctly identifies Architecture Doc
- POOR: Suggests Design Doc

---

### arch-003-doc-type-feature (Story 3: Quick Doc-Type Decision)

**Input:**

> I need to document how the user profile feature will work

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/architecture-guide.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Agent chooses Design Doc

**Rubric:**

- EXCELLENT: Correctly identifies Design Doc + checks for prerequisites (user stories, test defs)
- ACCEPTABLE: Correctly identifies Design Doc
- POOR: Suggests Architecture Doc

---

### arch-004-decision-fields (Story 4: Document Why, Not Just What)

**Input:**

> Document our decision to use Redis for caching

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/architecture-guide.md`

**Expected:** Output includes What, Why, Trade-off, Alternatives Considered

**Rubric:**

- EXCELLENT: All 4 fields with specifics (numbers, metrics, concrete alternatives)
- ACCEPTABLE: What/Why/Trade-off present
- POOR: Missing Why or Trade-off

---

### arch-005-tie-breaker (Story 3: Quick Doc-Type Decision)

**Input:**

> I need to document adding a caching layer that will be used by multiple features

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/architecture-guide.md`

**Expected:** Agent chooses Architecture Doc (affects 2+ features)

**Rubric:**

- EXCELLENT: Architecture Doc + cites tie-breaking rule (affects 2+ features)
- ACCEPTABLE: Architecture Doc
- POOR: Design Doc

---

### arch-006-code-refs (Story 5: Code References in Docs)

**Input:**

> Document the authentication flow architecture, including where the code lives

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/architecture-guide.md`

**Expected:** Output includes code references with file paths

**Rubric:**

- EXCELLENT: 2+ code references with file:line format or function names
- ACCEPTABLE: At least 1 file path reference
- POOR: No code references

---

### arch-007-adr-migration (Story 1: Single Comprehensive Architecture Doc)

**Input:**

> Our project has 50 ADR files in docs/adr/. What should we do?

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/architecture-guide.md`

**Expected:** Agent recommends consolidating into single ARCHITECTURE.md

**Rubric:**

- EXCELLENT: Recommends consolidation + provides migration steps (create ARCHITECTURE.md, consolidate active decisions, archive old ADRs)
- ACCEPTABLE: Recommends consolidation
- POOR: Suggests keeping separate ADRs

---

### arch-008-versioning (Story 6: Versioning and Status)

**Input:**

> Create architecture doc for a new project

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/architecture-guide.md`

**Expected:** Header includes Version and Status

**Rubric:**

- EXCELLENT: Version + Status in header using valid values (Design/Production/Proposed/Deprecated)
- ACCEPTABLE: Version and Status present somewhere
- POOR: Missing Version or Status

---

### arch-009-workflow-order (Story 7: TDD Workflow Integration)

**Input:**

> Implement user authentication for my app

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/architecture-guide.md`

**Expected:** Agent checks for user stories/test definitions before implementation

**Rubric:**

- EXCELLENT: Checks for user stories + test definitions + offers to create if missing
- ACCEPTABLE: Mentions TDD workflow
- POOR: Jumps straight to implementation

---

### arch-010-update-trigger (Story 7: TDD Workflow Integration)

**Input:**

> I just added PostgreSQL to our project that was using SQLite

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/architecture-guide.md`

**Expected:** Agent suggests updating architecture doc

**Rubric:**

- EXCELLENT: Recommends architecture doc update + explains why (tech choice)
- ACCEPTABLE: Mentions documenting the change
- POOR: No mention of architecture doc

---

### arch-011-no-update (Story 8: Triggers to Update Architecture Doc)

**Input:**

> I just fixed a bug in the login form validation

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/architecture-guide.md`

**Expected:** Agent does NOT suggest updating architecture doc

**Rubric:**

- EXCELLENT: No mention of architecture doc (bug fix doesn't warrant it)
- ACCEPTABLE: Asks if it's architectural, then correctly says no
- POOR: Suggests updating architecture doc

---

### arch-012-catch-antipattern (Story 9: Avoid Common Mistakes)

**Input:**

> Review this architecture doc section:
>
> ### State Management
>
> **What**: Using Zustand for global state

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/architecture-guide.md`

**Expected:** Agent identifies missing "Why" and "Trade-off"

**Rubric:**

- EXCELLENT: Identifies missing Why/Trade-off + suggests adding rationale with specifics
- ACCEPTABLE: Notes decision is incomplete
- POOR: Says doc looks fine

---

### arch-013-file-location (Story 10: Standard File Organization)

**Input:**

> Create a design doc for the payment flow feature

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/architecture-guide.md`

**Expected:** Agent creates file in `.safeword/planning/design/`

**Rubric:**

- EXCELLENT: Creates in `.safeword/planning/design/` + follows naming convention
- ACCEPTABLE: Creates in a planning/design directory
- POOR: Creates at root or wrong location

---

## design-doc-guide.md

### design-001-create-doc (Story 2: Design Docs for Features)

**Input:**

> Create a design doc for a three-pane layout feature

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Output has required sections

**Rubric:**

- EXCELLENT: All required sections (Architecture, Components with [N]/[N+1], User Flow, Key Decisions) + references user stories/test defs
- ACCEPTABLE: Missing 1-2 optional sections (Data Model, Component Interaction, Implementation Notes)
- POOR: Missing User Flow or Components

---

### design-002-prereqs (Story 2: Design Docs for Features)

**Input:**

> Create a design doc for the payment flow feature

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Agent asks about or offers to create user stories/test definitions first

**Rubric:**

- EXCELLENT: Checks for prerequisites before creating + offers to create them
- ACCEPTABLE: Mentions prerequisites should exist
- POOR: Creates design doc without checking prerequisites

---

### design-003-complexity (Story 2: Design Docs for Features)

**Input:**

> Do I need a design doc for adding a logout button?

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Agent says no (simple, <3 components, single user story)

**Rubric:**

- EXCELLENT: Correctly assesses as too simple + explains why (doesn't meet complexity threshold)
- ACCEPTABLE: Says probably not needed
- POOR: Recommends creating design doc

---

### design-004-borderline (Story 2: Design Docs for Features)

**Input:**

> I'm building a feature that touches exactly 3 components and has 2 user stories. Do I need a design doc?

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Agent recommends design doc (meets threshold: >3 components OR spans 2+ stories)

**Rubric:**

- EXCELLENT: Recommends design doc + cites complexity criteria (spans 2+ user stories)
- ACCEPTABLE: Recommends design doc
- POOR: Says skip design doc

---

## Summary

| Guide                      | Tests   | Stories Covered            |
| -------------------------- | ------- | -------------------------- |
| architecture-guide.md      | 13      | 1, 3, 4, 5, 6, 7, 8, 9, 10 |
| design-doc-guide.md        | 13      | 1-2, 4-10                  |
| code-philosophy.md         | 13      | 1-12, 14                   |
| context-files-guide.md     | 11      | 11                         |
| data-architecture-guide.md | 8       | 1-8                        |
| **TOTAL**                  | **152** | **145**                    |

---

## code-philosophy.md

### phil-001-json-summary (Story 1: Response JSON Summary)

**Input:**

> Fix the typo in README.md (agent makes edit)

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/code-philosophy.md`

**Expected:** Response ends with JSON containing madeChanges: true

**Rubric:**

- EXCELLENT: Valid JSON with madeChanges: true, other fields accurate
- ACCEPTABLE: JSON present with correct madeChanges value
- POOR: Missing JSON or madeChanges: false when edit was made

---

### phil-002-avoid-bloat (Story 2: Avoid Bloat, Prefer Elegant Code)

**Input:**

> Add a function to get the current date

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/code-philosophy.md`

**Expected:** Agent writes simple function, not a date utility class

**Rubric:**

- EXCELLENT: Minimal implementation (1 function, no unnecessary abstractions)
- ACCEPTABLE: Slightly over-engineered but functional
- POOR: Creates utility class, factory pattern, or multiple unused methods

---

### phil-003-self-documenting (Story 3: Self-Documenting Code)

**Input:**

> Write a function that calculates the total price with tax

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/code-philosophy.md`

**Expected:** Descriptive function name, no unnecessary comments

**Rubric:**

- EXCELLENT: Descriptive name (e.g., `calculateTotalWithTax`) + no comments on obvious code
- ACCEPTABLE: Descriptive name with some redundant comments
- POOR: Abbreviated name (e.g., `calcTot`) or comments explaining obvious code

---

### phil-004-error-handling (Story 4: Explicit Error Handling)

**Input:**

> Write a function that reads a JSON file and returns the parsed data

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/code-philosophy.md`

**Expected:** Function includes error handling with context (file path, operation)

**Rubric:**

- EXCELLENT: Catches errors, includes file path in error message, re-throws or returns error
- ACCEPTABLE: Has try/catch with some context
- POOR: Empty catch block, swallows error, or no error handling

---

### phil-005-doc-verification (Story 5: Documentation Verification)

**Input:**

> Add a feature using the latest React Server Components API

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/code-philosophy.md`

**Expected:** Agent verifies React version or looks up current docs

**Rubric:**

- EXCELLENT: Checks package.json for React version OR uses Context7/docs lookup
- ACCEPTABLE: Mentions need to verify version
- POOR: Assumes API exists without verification

---

### phil-006-tdd-workflow (Story 6: TDD Workflow)

**Input:**

> Add a function that validates email addresses

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/code-philosophy.md`

**Expected:** Agent writes failing test first, then implements

**Rubric:**

- EXCELLENT: Writes test first, runs it (RED), then implements (GREEN)
- ACCEPTABLE: Mentions TDD approach, writes test
- POOR: Implements function without writing test first

---

### phil-007-self-testing (Story 7: Self-Testing Before Completion)

**Input:**

> Fix the login button bug (agent fixes it)

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/code-philosophy.md`

**Expected:** Agent runs tests and reports results, doesn't ask user to verify

**Rubric:**

- EXCELLENT: Runs tests, reports "Tests pass ✓", doesn't ask user to verify
- ACCEPTABLE: Mentions running tests
- POOR: Asks user to test or verify the fix

---

### phil-008-debug-logging (Story 8: Debug Logging Hygiene)

**Input:**

> Debug why this test is failing (agent debugs)

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/code-philosophy.md`

**Expected:** Agent adds logs showing actual vs expected, removes them after fix

**Rubric:**

- EXCELLENT: Logs actual vs expected values, removes debug logs after fix
- ACCEPTABLE: Logs something useful for debugging
- POOR: Leaves debug logs in code after fix

---

### phil-009-cross-platform (Story 9: Cross-Platform Paths)

**Input:**

> Create a function that builds a file path from directory and filename

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/code-philosophy.md`

**Expected:** Agent uses path.join() or equivalent, not string concatenation

**Rubric:**

- EXCELLENT: Uses path.join() or path.resolve(), no hardcoded separators
- ACCEPTABLE: Mentions cross-platform concerns
- POOR: Uses string concat with hardcoded '/' or '\'

---

### phil-010-best-practices (Story 10: Best Practices Research)

**Input:**

> Create a React component for a dropdown menu

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/code-philosophy.md`

**Expected:** Agent follows React conventions (hooks, controlled components)

**Rubric:**

- EXCELLENT: Follows React best practices + mentions why (controlled vs uncontrolled)
- ACCEPTABLE: Follows conventions without explicit mention
- POOR: Ignores React conventions (e.g., direct DOM manipulation)

---

### phil-011-self-review (Story 11: Self-Review Gate)

**Input:**

> I've implemented the feature (agent completes work)

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/code-philosophy.md`

**Expected:** Agent runs self-review checklist before declaring done

**Rubric:**

- EXCELLENT: Explicitly runs through checklist items, mentions test results
- ACCEPTABLE: Mentions verification before completion
- POOR: Declares done without any self-review

---

### phil-012-question-protocol (Story 12: Question-Asking Protocol)

**Input:**

> How should I structure the database schema? (requires domain knowledge)

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/code-philosophy.md`

**Expected:** Agent asks after showing research attempt, focuses on domain preferences

**Rubric:**

- EXCELLENT: Shows what was researched + asks domain-specific question
- ACCEPTABLE: Asks relevant question about domain preferences
- POOR: Asks without showing any research attempt

---

### phil-013-tooling-currency (Story 13: Tooling Currency)

**Input:**

> I'm about to start a new project. Should I update my CLI tools?

**Context files:**

- `framework/guides/code-philosophy.md`

**Expected:** Agent recommends checking/updating critical CLIs with workflow

**Rubric:**

- EXCELLENT: Recommends checking versions, lists critical CLIs (gh, aws), mentions breaking changes review, version pinning
- ACCEPTABLE: Suggests updating tools before starting
- POOR: Ignores tooling currency or says "no need to update"

---

### phil-014-git-workflow (Story 14: Git Workflow)

**Input:**

> Fix the login bug and add a new feature (two separate tasks)

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/code-philosophy.md`

**Expected:** Agent makes separate commits for each task

**Rubric:**

- EXCELLENT: Separate atomic commits with descriptive messages for each task
- ACCEPTABLE: Commits with clear messages
- POOR: Single commit for unrelated changes or vague message like "misc fixes"

---

## context-files-guide.md

### ctx-001-file-selection (Story 1: Choose the Right Context File(s))

**Input:**

> Set up project context for a project using both Claude and Cursor

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/context-files-guide.md`

**Expected:** Agent creates AGENTS.md (tool-agnostic) or both tool-specific files

**Rubric:**

- EXCELLENT: Creates AGENTS.md with clear rationale OR creates both tool-specific files
- ACCEPTABLE: Creates appropriate context file
- POOR: Creates wrong file type or doesn't explain choice

---

### ctx-002-safeword-trigger (Story 2: SAFEWORD Trigger Required)

**Input:**

> Create an AGENTS.md file for a new project

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/context-files-guide.md`

**Expected:** Output includes SAFEWORD trigger at top with rationale

**Rubric:**

- EXCELLENT: Includes exact trigger format (`**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**`) + brief rationale
- ACCEPTABLE: Includes trigger but slightly different wording
- POOR: Missing trigger or buried in middle of file

---

### ctx-003-no-duplication (Story 3: Respect Auto-Loading Behavior)

**Input:**

> Create a tests/AGENTS.md file for a project that already has a root AGENTS.md with TDD workflow documented

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/context-files-guide.md`

**Expected:** Agent creates subdirectory file that references root for TDD, doesn't duplicate

**Rubric:**

- EXCELLENT: Uses cross-reference ("See root AGENTS.md for TDD workflow"), no duplication
- ACCEPTABLE: Minimal duplication with cross-reference
- POOR: Duplicates TDD workflow content from root

---

### ctx-004-modular-imports (Story 4: Modular File Structure)

**Input:**

> Create an AGENTS.md for a project with architecture decisions in docs/architecture.md and coding standards in docs/conventions.md

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/context-files-guide.md`

**Expected:** Agent uses import syntax to reference external files

**Rubric:**

- EXCELLENT: Uses `@docs/architecture.md` and `@docs/conventions.md` imports, keeps root file under 50 lines
- ACCEPTABLE: Uses imports but file is slightly over target
- POOR: Duplicates content instead of importing

---

### ctx-005-content-rules (Story 5: Content Inclusion/Exclusion Rules)

**Input:**

> I want to add setup instructions and our TDD workflow to the AGENTS.md file

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/context-files-guide.md`

**Expected:** Agent redirects setup to README.md, allows TDD workflow if project-specific

**Rubric:**

- EXCELLENT: Redirects setup to README.md, explains TDD belongs in root only if project-specific (otherwise tests/AGENTS.md)
- ACCEPTABLE: Correctly redirects setup, allows TDD
- POOR: Adds both to AGENTS.md without redirection

---

### ctx-006-size-targets (Story 6: Size Targets and Modularity)

**Input:**

> Review this AGENTS.md file that is 250 lines long

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/context-files-guide.md`

**Expected:** Agent recommends extracting to subdirectory or using imports

**Rubric:**

- EXCELLENT: Identifies >200 line violation, recommends extraction or imports with specific suggestions
- ACCEPTABLE: Identifies violation, recommends reduction
- POOR: Accepts 250-line file without comment

---

### ctx-007-cross-reference (Story 7: Cross-Reference Pattern)

**Input:**

> Add a reference to the agents directory in the root AGENTS.md

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/context-files-guide.md`

**Expected:** Agent uses the standard cross-reference pattern

**Rubric:**

- EXCELLENT: Uses pattern `**Agents** (\`path/\`) - Description. See \`path/AGENTS.md\`.`
- ACCEPTABLE: Uses cross-reference with path and link
- POOR: Duplicates content instead of cross-referencing

---

### ctx-008-maintenance (Story 8: Maintenance Rules)

**Input:**

> The project just underwent a major refactor. The AGENTS.md still references old directory structure.

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/context-files-guide.md`

**Expected:** Agent recommends updating or removing outdated sections

**Rubric:**

- EXCELLENT: Identifies outdated content, recommends removal/update, mentions maintenance rules
- ACCEPTABLE: Recommends updating the file
- POOR: Ignores outdated content or suggests keeping it

---

### ctx-009-domain-requirements (Story 9: Domain Requirements Section)

**Input:**

> Create an AGENTS.md for a tabletop RPG game assistant project

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/context-files-guide.md`

**Expected:** Agent includes Domain Requirements section with game mechanics

**Rubric:**

- EXCELLENT: Includes Domain Requirements with game mechanics (position/effect, fiction-first), uses template structure
- ACCEPTABLE: Includes domain section but less detailed
- POOR: Omits domain requirements for specialized project

---

### ctx-010-llm-checklist (Story 10: LLM Comprehension Checklist)

**Input:**

> Review this AGENTS.md file for LLM comprehension quality

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/context-files-guide.md`

**Expected:** Agent applies the 8-point checklist from the guide

**Rubric:**

- EXCELLENT: Checks all 8 items (MECE, terms defined, no contradictions, examples, edge cases, actionable, no redundancy, size)
- ACCEPTABLE: Checks 5+ items
- POOR: Generic review without applying checklist

---

### ctx-011-token-efficiency (Story 11: Conciseness, Effectiveness, Token Budget)

**Input:**

> Review this 300-line AGENTS.md with narrative paragraphs for token efficiency

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/context-files-guide.md`

**Expected:** Agent recommends converting to bullets, removing redundancy, using imports

**Rubric:**

- EXCELLENT: Identifies verbose content, recommends bullets over paragraphs, suggests imports for modularization
- ACCEPTABLE: Recommends reducing size
- POOR: Accepts verbose file without comment

---

## data-architecture-guide.md

### data-001-decision-tree (Story 1: Decide Where to Document)

**Input:**

> I'm adding a new Redis cache for session data. Where should I document this?

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/data-architecture-guide.md`

**Expected:** Agent selects Architecture Doc (new data store)

**Rubric:**

- EXCELLENT: Correctly identifies Architecture Doc, cites "Adding new data store" from decision tree
- ACCEPTABLE: Correctly identifies Architecture Doc
- POOR: Suggests Design Doc for new data store

---

### data-002-principles (Story 2: Define Data Principles First)

**Input:**

> Create a data architecture section for a user management system

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/data-architecture-guide.md`

**Expected:** Agent includes all 4 principles with What/Why/Document/Example format

**Rubric:**

- EXCELLENT: Includes all 4 principles (Quality, Governance, Accessibility, Living Doc) with What/Why/Document/Example format
- ACCEPTABLE: Includes 3+ principles with consistent format
- POOR: Missing principles or inconsistent format

---

### data-004-data-flows (Story 4: Document Data Flows)

**Input:**

> Document the data flow for user registration

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/data-architecture-guide.md`

**Expected:** Agent documents sources → transformations → destinations with error handling at each step

**Rubric:**

- EXCELLENT: Documents full flow (input validation → business logic → persistence → UI update) with error handling for each step
- ACCEPTABLE: Documents flow with some error handling
- POOR: Only documents happy path without error handling

---

### data-005-data-policies (Story 5: Specify Data Policies)

**Input:**

> Document data policies for a multi-tenant SaaS application

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/data-architecture-guide.md`

**Expected:** Agent documents access control, lifecycle, and conflict resolution

**Rubric:**

- EXCELLENT: Documents read/write/delete roles, lifecycle rules, conflict resolution strategy with justification
- ACCEPTABLE: Documents access control and lifecycle
- POOR: Missing conflict resolution or lifecycle rules

---

### data-006-tdd-triggers (Story 6: TDD Integration Triggers)

**Input:**

> I just added a new `payments` table to the database. What should I update?

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/data-architecture-guide.md`

**Expected:** Agent recommends updating architecture doc, cites data-specific triggers

**Rubric:**

- EXCELLENT: Recommends updating architecture doc, cites "Adding new data entities" trigger, mentions version/status update
- ACCEPTABLE: Recommends updating architecture doc
- POOR: Suggests only updating code without documentation

---

### data-007-common-mistakes (Story 7: Avoid Common Mistakes)

**Input:**

> Review this data architecture doc that has no migration strategy and uses vague performance targets like "fast queries"

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/data-architecture-guide.md`

**Expected:** Agent identifies both anti-patterns

**Rubric:**

- EXCELLENT: Identifies both issues (missing migration strategy, vague performance targets), cites Common Mistakes section
- ACCEPTABLE: Identifies at least one issue
- POOR: Accepts the doc without identifying anti-patterns

---

### data-008-checklist (Story 8: Best Practices Checklist Compliance)

**Input:**

> Review this data architecture doc for completeness before merge

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/data-architecture-guide.md`

**Expected:** Agent applies the 10-point checklist from the guide

**Rubric:**

- EXCELLENT: Checks all 10 items (principles format, entities, attributes, storage rationale, error handling, validation checkpoints, performance targets, migration strategy, version/status, cross-references)
- ACCEPTABLE: Checks 7+ items
- POOR: Generic review without applying checklist

---

## design-doc-guide.md

### design-001-prerequisites (Story 1: Verify Prerequisites)

**Input:**

> Create a design doc for a new search feature

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Agent first checks for user stories and test definitions before proceeding

**Rubric:**

- EXCELLENT: Asks about or checks for user stories and test definitions first, offers to create them if missing
- ACCEPTABLE: Mentions prerequisites exist/needed
- POOR: Creates design doc without checking prerequisites

---

### design-002-template (Story 2: Use Standard Template)

**Input:**

> Create a design doc for a notification system feature

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Agent uses the standard template structure

**Rubric:**

- EXCELLENT: Uses template structure (Architecture, Components, Data Model, User Flow, Key Decisions), marks optional sections "(if applicable)", saves to correct location
- ACCEPTABLE: Uses template structure with most sections
- POOR: Creates ad-hoc structure without following template

---

### design-004-components-pattern (Story 4: Components with [N]/[N+1] Pattern)

**Input:**

> Define the components for a file upload feature in a design doc

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Agent uses [N]/[N+1] pattern with full component definitions

**Rubric:**

- EXCELLENT: Defines Component 1 with all 5 attributes (name, responsibility, interface, dependencies, tests), then Component 2 showing variation
- ACCEPTABLE: Defines multiple components with most attributes
- POOR: Lists components without [N]/[N+1] pattern or missing key attributes

---

### design-005-data-model (Story 5: Data Model)

**Input:**

> Write the data model section for a design doc about a shopping cart feature

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Agent documents state shape, relationships, and flow

**Rubric:**

- EXCELLENT: Documents state shape/schema, shows type relationships, explains data flow through components
- ACCEPTABLE: Documents state shape with some relationships
- POOR: Skips data model for a feature that clearly needs one, or provides vague description

---

### design-006-component-interaction (Story 6: Component Interaction)

**Input:**

> Document the component interaction for a drag-and-drop file organizer feature

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Agent documents events, data flow between components, and edge cases

**Rubric:**

- EXCELLENT: Documents events/method calls, shows data flow (Component N → N+1), notes edge cases in interactions
- ACCEPTABLE: Documents communication pattern and data flow
- POOR: Skips interaction section for a multi-component feature

---

### design-007-user-flow (Story 7: User Flow)

**Input:**

> Write the user flow section for a design doc about a password reset feature

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Agent writes concrete step-by-step flow with specific UI interactions

**Rubric:**

- EXCELLENT: Concrete steps with specific UI elements (buttons, forms, keyboard shortcuts), references user stories/test definitions
- ACCEPTABLE: Step-by-step flow with some concrete details
- POOR: Vague flow like "user resets password" without concrete steps

---

### design-008-key-decisions (Story 8: Key Decisions with Trade-offs)

**Input:**

> Write the key decisions section for a design doc about choosing between REST and GraphQL for an API

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Agent documents decision with what/why/trade-off format using [N]/[N+1] pattern

**Rubric:**

- EXCELLENT: Decision 1 with what/why (specifics)/trade-off, Decision 2 showing variation, links to benchmarks if relevant
- ACCEPTABLE: Decisions with what/why/trade-off
- POOR: Decisions without trade-offs or vague rationale

---

### design-009-implementation-notes (Story 9: Implementation Notes)

**Input:**

> Write the implementation notes section for a design doc about a real-time collaborative editing feature

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Agent documents constraints, error handling, gotchas, and open questions

**Rubric:**

- EXCELLENT: Documents all 4 areas (constraints, error handling, gotchas, open questions) with specific details
- ACCEPTABLE: Documents 3+ areas
- POOR: Skips implementation notes for a complex feature with obvious risks

---

### design-010-quality-checklist (Story 10: Quality Checklist)

**Input:**

> Review this design doc for quality before merge

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/design-doc-guide.md`

**Expected:** Agent applies the 6-point checklist from the guide

**Rubric:**

- EXCELLENT: Checks all 6 items (references not duplicates, [N]/[N+1] examples, concrete user flow, what/why/trade-off, optional markers, ~121 lines)
- ACCEPTABLE: Checks 4+ items
- POOR: Generic review without applying checklist

---

## learning-extraction.md

### learn-001-triggers (Story 1: Trigger-Based Extraction)

**Input:**

> I've been debugging this React state issue for 6 cycles now, tried 4 different approaches, and finally found it's a race condition not documented in the React docs

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/learning-extraction.md`

**Expected:** Agent recognizes multiple triggers and suggests extraction

**Rubric:**

- EXCELLENT: Identifies 3+ triggers (observable complexity, trial-and-error, undocumented gotcha), suggests extraction after fix confirmed
- ACCEPTABLE: Identifies triggers, suggests extraction
- POOR: Doesn't recognize triggers or suggests extraction mid-debug

---

### learn-002-check-existing (Story 2: Check Existing Learnings First)

**Input:**

> I just discovered a gotcha about React hooks and async state updates

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/learning-extraction.md`

**Expected:** Agent checks for existing learnings before suggesting extraction

**Rubric:**

- EXCELLENT: Checks for existing learnings (`*react*.md`, `*hooks*.md`, `*async*.md`), reads if found, suggests update vs new
- ACCEPTABLE: Mentions checking for existing learnings
- POOR: Suggests creating new learning without checking existing

---

### learn-003-location (Story 3: Place Learnings in Correct Location)

**Input:**

> I learned that React useState is async - where should I document this?

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/learning-extraction.md`

**Expected:** Agent selects global learnings (applies to ALL React projects)

**Rubric:**

- EXCELLENT: Selects `.safeword/learnings/` (global), explains why (applies to all projects), cites decision tree
- ACCEPTABLE: Selects correct location
- POOR: Selects project-specific location for universal React pattern

---

### learn-004-precedence (Story 4: Respect Instruction Precedence)

**Input:**

> The global learning says use Redux, but the project learning says use Zustand. Which should I follow?

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/learning-extraction.md`

**Expected:** Agent follows project learning (higher precedence)

**Rubric:**

- EXCELLENT: Follows project learning, explains precedence order (project > global), cites cascading precedence
- ACCEPTABLE: Follows project learning
- POOR: Follows global learning or asks which to use

---

### learn-005-templates (Story 5: Use Templates)

**Input:**

> Create a learning about React useEffect cleanup functions

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/learning-extraction.md`

**Expected:** Agent uses the forward-looking learning template with all required sections

**Rubric:**

- EXCELLENT: Uses template with Principle, Gotcha (Bad/Good), Why, Examples, Testing Trap sections
- ACCEPTABLE: Uses template with most sections
- POOR: Creates ad-hoc structure without following template

---

### learn-006-cross-reference (Story 6: SAFEWORD.md Cross-Reference)

**Input:**

> I just created a learning at .safeword/learnings/electron-contexts.md about Electron renderer context

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/learning-extraction.md`

**Expected:** Agent suggests adding cross-reference to SAFEWORD.md Common Gotchas

**Rubric:**

- EXCELLENT: Suggests adding to SAFEWORD.md Common Gotchas with bold name + one-liner + link format
- ACCEPTABLE: Suggests adding cross-reference
- POOR: Doesn't mention cross-referencing in SAFEWORD.md

---

### learn-007-suggestion-timing (Story 7: Suggest Extraction at the Right Time)

**Input:**

> Fixed a typo in the config file

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/learning-extraction.md`

**Expected:** Agent does NOT suggest extraction (low confidence - trivial fix)

**Rubric:**

- EXCELLENT: Does not suggest extraction, recognizes trivial fix
- ACCEPTABLE: Doesn't mention extraction
- POOR: Suggests extraction for trivial fix

---

### learn-008-maintenance (Story 8: Review and Maintenance Cycle)

**Input:**

> This learning file is 250 lines and covers both React hooks and Redux patterns

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/learning-extraction.md`

**Expected:** Agent recommends splitting into focused files

**Rubric:**

- EXCELLENT: Recommends splitting (>200 lines, multiple concepts), suggests specific split
- ACCEPTABLE: Recommends splitting
- POOR: Accepts 250-line multi-concept file without comment

---

### learn-010-workflow (Story 10: Workflow Integration)

**Input:**

> I just finished implementing a complex feature and discovered a race condition pattern. Walk me through documenting this.

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/learning-extraction.md`

**Expected:** Agent follows the workflow steps

**Rubric:**

- EXCELLENT: Follows workflow (assess scope → choose location → extract using template → cross-reference in SAFEWORD.md → suggest commit message)
- ACCEPTABLE: Follows most workflow steps
- POOR: Ad-hoc extraction without following workflow

---

### learn-011-anti-patterns (Story 11: Anti-Patterns to Avoid)

**Input:**

> I want to create a learning that says "Changed == to ==="

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/learning-extraction.md`

**Expected:** Agent blocks this as trivial one-liner

**Rubric:**

- EXCELLENT: Blocks extraction, cites anti-pattern "One-line fixes without context"
- ACCEPTABLE: Suggests this is too trivial
- POOR: Proceeds with extraction

---

### learn-012-size-standards (Story 12: Directory & Size Standards)

**Input:**

> I'm creating a learning file that's 180 lines and covers both React hooks and Redux patterns

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/learning-extraction.md`

**Expected:** Agent recommends splitting based on size and scope

**Rubric:**

- EXCELLENT: Recommends splitting (>150 lines, multiple concepts), suggests specific split
- ACCEPTABLE: Notes it's borderline, recommends review
- POOR: Accepts 180-line multi-concept file without comment

---

## llm-instruction-design.md

### llm-001-mece (Story 1: MECE Decision Trees)

**Input:**

> I'm writing a decision tree for choosing between unit, integration, and E2E tests. Here's my draft:
>
> - Is it a pure function?
> - Does it interact with multiple components?
> - Does it test the full user flow?

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent identifies overlapping branches and suggests sequential MECE structure

**Rubric:**

- EXCELLENT: Identifies overlap ("multiple components" and "full user flow" can both apply), suggests sequential ordering with first-match stop
- ACCEPTABLE: Notes ambiguity, suggests improvement
- POOR: Accepts overlapping branches without comment

---

### llm-002-explicit-definitions (Story 2: Explicit Definitions)

**Input:**

> I'm writing documentation that says "Test critical paths at the lowest level possible"

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent identifies vague terms and suggests explicit definitions

**Rubric:**

- EXCELLENT: Identifies both "critical paths" and "lowest level" as vague, suggests explicit definitions with examples
- ACCEPTABLE: Identifies at least one vague term
- POOR: Accepts vague phrasing without comment

---

### llm-003-no-contradictions (Story 3: No Contradictions)

**Input:**

> I'm updating our testing guide. Section A says "Write E2E tests for all user-facing features" but Section B says "E2E tests only for critical paths". Should I keep both?

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent identifies contradiction and suggests reconciliation

**Rubric:**

- EXCELLENT: Identifies contradiction, suggests reconciling into single rule with explicit definition of "critical"
- ACCEPTABLE: Identifies contradiction, suggests removing one
- POOR: Accepts both statements without noting conflict

---

### llm-004-concrete-examples (Story 4: Concrete Examples)

**Input:**

> I'm writing a rule that says "Use meaningful variable names". Is this good enough?

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent suggests adding BAD/GOOD examples

**Rubric:**

- EXCELLENT: Suggests adding 2-3 concrete BAD/GOOD examples (e.g., `x` vs `userCount`)
- ACCEPTABLE: Suggests adding at least one example
- POOR: Accepts abstract rule without examples

---

### llm-005-edge-cases (Story 5: Edge Cases Explicit)

**Input:**

> I'm writing a rule: "Unit test all pure functions". Is this complete?

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent suggests adding edge cases section

**Rubric:**

- EXCELLENT: Suggests adding edge cases (Date.now(), process.env, mixed pure+I/O)
- ACCEPTABLE: Suggests adding at least one edge case
- POOR: Accepts rule without edge cases

---

### llm-006-actionable (Story 6: Actionable, Not Vague)

**Input:**

> I'm writing guidance: "Most of your tests should be fast, some can be slow". Is this clear enough?

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent identifies vague terms and suggests actionable alternatives

**Rubric:**

- EXCELLENT: Identifies "most/some" as vague, suggests concrete rules with red flags
- ACCEPTABLE: Identifies vagueness, suggests improvement
- POOR: Accepts vague guidance without comment

---

### llm-007-sequential (Story 7: Sequential Decision Trees)

**Input:**

> I have a decision tree with three parallel branches:
>
> - Is it a pure function?
> - Does it interact with the database?
> - Does it render UI?

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent suggests converting to sequential with first-match stop

**Rubric:**

- EXCELLENT: Suggests sequential ordering with explicit "stop at first match" instruction
- ACCEPTABLE: Suggests ordering the questions
- POOR: Accepts parallel structure without comment

---

### llm-008-tie-breaking (Story 8: Tie-Breaking Rules)

**Input:**

> I have a decision tree where both unit test and integration test could work for testing a calculation that uses a database. Which should I choose?

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent applies tie-breaking rule (choose fastest)

**Rubric:**

- EXCELLENT: Applies tie-breaking rule, chooses unit test with mocked database (faster)
- ACCEPTABLE: Mentions tie-breaking, makes a choice
- POOR: Leaves choice ambiguous or doesn't mention tie-breaking

---

### llm-009-lookup-tables (Story 9: Lookup Tables for Complex Logic)

**Input:**

> I have 5 different scenarios for choosing between unit, integration, and E2E tests. Should I write them as prose paragraphs?

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent suggests using a lookup table

**Rubric:**

- EXCELLENT: Suggests lookup table format with clear columns (Scenario/Unit/Integration/E2E/Best Choice)
- ACCEPTABLE: Suggests table format
- POOR: Accepts prose paragraphs for 5 scenarios

---

### llm-010-no-caveats (Story 10: No Caveats in Tables)

**Input:**

> I have a table cell that says "Unit test ✅ (unless it uses external APIs)". Is this okay?

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent suggests removing caveat from cell

**Rubric:**

- EXCELLENT: Suggests creating separate row for external API case, removing parenthetical
- ACCEPTABLE: Identifies parenthetical as problem
- POOR: Accepts caveat in cell

---

### llm-011-percentages (Story 11: Percentages with Context)

**Input:**

> I'm writing guidance: "Aim for 80% unit tests, 15% integration tests, 5% E2E tests". Is this clear?

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent suggests adding context/adjustments or principles-based alternative

**Rubric:**

- EXCELLENT: Suggests adding adjustments for different project types OR suggests principles-based alternative
- ACCEPTABLE: Notes percentages need context
- POOR: Accepts standalone percentages without comment

---

### llm-012-specific-questions (Story 12: Specific Questions)

**Input:**

> I'm writing a decision tree question: "Does this test need to see the UI?" Is this specific enough?

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent suggests more specific wording

**Rubric:**

- EXCELLENT: Suggests tool-specific wording like "real browser (Playwright/Cypress)" and clarifies RTL distinction
- ACCEPTABLE: Suggests more specific wording
- POOR: Accepts vague "see the UI" phrasing

---

### llm-013-re-evaluation (Story 13: Re-evaluation Paths)

**Input:**

> I have a feature that doesn't fit any of my testing categories. What should I do?

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent provides decomposition strategy

**Rubric:**

- EXCELLENT: Provides 3-step decomposition (separate concerns → test each → example)
- ACCEPTABLE: Suggests breaking down the feature
- POOR: Says "re-evaluate your approach" without concrete steps

---

### llm-014-anti-patterns (Story 14: Anti-Patterns Guard)

**Input:**

> I'm writing documentation that says "Follow the test pyramid - lots of unit tests at the base, integration in the middle, E2E at the top"

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent identifies visual metaphor anti-pattern

**Rubric:**

- EXCELLENT: Identifies "test pyramid" as visual metaphor, suggests actionable alternative
- ACCEPTABLE: Notes visual metaphor issue
- POOR: Accepts visual metaphor without comment

---

### llm-015-quality-checklist (Story 15: Quality Checklist Compliance)

**Input:**

> I just finished writing an LLM instruction document. What should I check before committing?

**Context files:**

- `framework/guides/llm-instruction-design.md`

**Expected:** Agent provides quality checklist items

**Rubric:**

- EXCELLENT: Lists most/all checklist items (MECE, definitions, examples, edge cases, etc.)
- ACCEPTABLE: Lists several key checklist items
- POOR: Generic advice without specific checklist

---

## llm-prompting.md

### prompt-001-concrete-examples (Story 1: Concrete Examples in Prompts)

**Input:**

> I'm writing a prompt that says "Return the user's intent". Is this good enough?

**Context files:**

- `framework/guides/llm-prompting.md`

**Expected:** Agent suggests adding BAD/GOOD examples with concrete format

**Rubric:**

- EXCELLENT: Suggests adding structured JSON example showing BAD (prose) vs GOOD (JSON schema)
- ACCEPTABLE: Suggests being more specific
- POOR: Accepts vague prompt without examples

---

### prompt-002-structured-outputs (Story 2: Structured Outputs via JSON)

**Input:**

> I'm building an AI agent that needs to understand user intent. Should I have it return prose like "The user wants to create a campaign"?

**Context files:**

- `framework/guides/llm-prompting.md`

**Expected:** Agent recommends structured JSON output

**Rubric:**

- EXCELLENT: Recommends JSON schema with explicit fields (intent, name, etc.), shows example
- ACCEPTABLE: Suggests structured output
- POOR: Accepts prose output for machine consumption

---

### prompt-003-caching (Story 3: Prompt Caching for Cost Reduction)

**Input:**

> I have a 500-line system prompt that includes both static rules and the current character state. How should I structure this?

**Context files:**

- `framework/guides/llm-prompting.md`

**Expected:** Agent recommends separating static (cached) from dynamic (uncached)

**Rubric:**

- EXCELLENT: Recommends static rules with cache_control: ephemeral, dynamic state in user message, mentions cost reduction
- ACCEPTABLE: Suggests separating static from dynamic
- POOR: Accepts mixed static/dynamic in system prompt

---

### prompt-004-message-architecture (Story 4: Message Architecture)

**Input:**

> I'm interpolating the user's character state directly into my system prompt like this: systemPrompt = `Rules + Character: ${dynamicState}`. Is this okay?

**Context files:**

- `framework/guides/llm-prompting.md`

**Expected:** Agent identifies this as BAD pattern

**Rubric:**

- EXCELLENT: Identifies as BAD (uncacheable), recommends moving dynamic state to user message
- ACCEPTABLE: Suggests separating static from dynamic
- POOR: Accepts dynamic state in system prompt

---

### prompt-005-cache-invalidation (Story 5: Cache Invalidation Discipline)

**Input:**

> I want to add a small clarification to my cached system prompt. Should I just make the change?

**Context files:**

- `framework/guides/llm-prompting.md`

**Expected:** Agent warns about cache invalidation

**Rubric:**

- EXCELLENT: Warns "any change breaks all caches", suggests batching edits, mentions rebuild cost
- ACCEPTABLE: Notes cache invalidation concern
- POOR: Suggests making change without mentioning cache impact

---

### prompt-006-llm-as-judge (Story 6: LLM-as-Judge Evaluations)

**Input:**

> I want to test if my AI GM's responses have a "collaborative tone". Should I check for specific keywords like "together" or "we"?

**Context files:**

- `framework/guides/llm-prompting.md`

**Expected:** Agent recommends LLM-as-judge with rubric

**Rubric:**

- EXCELLENT: Recommends LLM-as-judge pattern with EXCELLENT/ACCEPTABLE/POOR rubric, warns against brittle keywords
- ACCEPTABLE: Suggests rubric-based evaluation
- POOR: Accepts keyword matching for creative outputs

---

### prompt-007-eval-framework (Story 7: Evaluation Framework Mapping)

**Input:**

> I have a function that parses JSON, an agent that calls an LLM, and a judgment about narrative quality. What test types should I use?

**Context files:**

- `framework/guides/llm-prompting.md`

**Expected:** Agent maps to correct test types

**Rubric:**

- EXCELLENT: JSON parsing → Unit test, Agent + LLM → Integration test, Narrative quality → LLM Eval
- ACCEPTABLE: Correctly identifies at least 2 mappings
- POOR: Suggests same test type for all

---

### prompt-008-cost-awareness (Story 8: Cost Awareness for Evals)

**Input:**

> I want to run 100 LLM evaluation scenarios in CI. What should I consider?

**Context files:**

- `framework/guides/llm-prompting.md`

**Expected:** Agent provides cost guidance

**Rubric:**

- EXCELLENT: Mentions typical costs (~$0.15-0.30 for 30 scenarios with caching), suggests caching rubrics, budget expectations
- ACCEPTABLE: Notes cost considerations
- POOR: Ignores cost implications

---

### prompt-009-why-over-what (Story 9: "Why" Over "What" in Prompts)

**Input:**

> My prompt says "Use JSON output". Should I add more context?

**Context files:**

- `framework/guides/llm-prompting.md`

**Expected:** Agent suggests adding rationale

**Rubric:**

- EXCELLENT: Suggests adding "why" (predictable parsing, validation), specific benefits, trade-offs
- ACCEPTABLE: Suggests adding rationale
- POOR: Accepts bare instruction without context

---

### prompt-010-precise-terms (Story 10: Precise Technical Terms)

**Input:**

> My decision tree asks "Does this test need to see the UI?"

**Context files:**

- `framework/guides/llm-prompting.md`

**Expected:** Agent suggests more precise wording

**Rubric:**

- EXCELLENT: Suggests "real browser (Playwright/Cypress)", clarifies RTL is not a real browser
- ACCEPTABLE: Suggests more specific wording
- POOR: Accepts vague "see the UI" phrasing

---

## tdd-best-practices.md (formerly tdd-templates.md)

### tdd-001-template-selection (Story 1: Select Correct Template)

**Input:**

> I need to document: (1) a new user authentication feature, (2) the tests for that feature, (3) how the components will interact, and (4) the overall project data model. Which templates should I use?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent maps each to correct template

**Rubric:**

- EXCELLENT: (1) User stories, (2) Test definitions, (3) Design doc, (4) Architecture doc
- ACCEPTABLE: Correctly identifies at least 3 mappings
- POOR: Uses same template for all or incorrect mappings

---

### tdd-002-story-format (Story 2: Story Format Selection)

**Input:**

> I'm writing a user story for a login feature. Should I use "As a user..." or "Given I am..."?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent recommends appropriate format based on context

**Rubric:**

- EXCELLENT: Recommends standard "As a..." for features, Given-When-Then for behavior-focused
- ACCEPTABLE: Explains both formats
- POOR: No guidance on format selection

---

### tdd-003-acceptance-criteria (Story 3: Story Acceptance Criteria and Scope)

**Input:**

> My user story has 8 acceptance criteria and no out-of-scope section. Is this okay?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent suggests reducing AC and adding out-of-scope

**Rubric:**

- EXCELLENT: Suggests 2-5 AC, recommends adding out-of-scope to prevent creep
- ACCEPTABLE: Notes AC count is high
- POOR: Accepts 8 AC without comment

---

### tdd-004-story-anti-patterns (Story 4: Block Story Anti-Patterns)

**Input:**

> Here's my user story: "As a developer, I want to refactor the database layer so that the code is cleaner"

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent identifies anti-pattern

**Rubric:**

- EXCELLENT: Identifies as technical task (not user story), suggests spike or task instead
- ACCEPTABLE: Notes it's too technical
- POOR: Accepts implementation-focused "story"

---

### tdd-005-test-definitions (Story 5: Create Test Definitions per Feature)

**Input:**

> I'm creating test definitions. What sections should I include?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent lists required sections

**Rubric:**

- EXCELLENT: Suites, individual tests, status per test, coverage summary, execution commands
- ACCEPTABLE: Lists most sections
- POOR: Vague or incomplete list

---

### tdd-006-good-story-examples (Story 6: GOOD Story Examples)

**Input:**

> Can you show me what a good user story looks like for a web app feature?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent provides concrete example

**Rubric:**

- EXCELLENT: Shows complete example with role, want, so that, AC (specific/testable), out-of-scope
- ACCEPTABLE: Shows basic structure
- POOR: Vague or incomplete example

---

### tdd-007-bad-story-examples (Story 7: BAD Story Examples)

**Input:**

> Is this a good story? "As a user, I want the app to work better so that I'm happy"

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent identifies anti-patterns

**Rubric:**

- EXCELLENT: Identifies all issues (vague role, unmeasurable "work better", no AC)
- ACCEPTABLE: Identifies at least 2 issues
- POOR: Accepts vague story

---

### tdd-008-invest-criteria (Story 8: INVEST Criteria)

**Input:**

> How do I know if my user story is good enough?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent explains INVEST criteria

**Rubric:**

- EXCELLENT: Explains Independent, Negotiable, Valuable, Estimable, Small, Testable
- ACCEPTABLE: Mentions several INVEST criteria
- POOR: No structured validation criteria

---

### tdd-009-test-definition-format (Story 9: Test Definition Format)

**Input:**

> How should I format individual tests in my test definitions?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent shows test format

**Rubric:**

- EXCELLENT: Shows numbered format with description, status, steps, expected outcome
- ACCEPTABLE: Shows basic format
- POOR: Vague or no format guidance

---

### tdd-010-test-status-tracking (Story 10: Test Status Tracking)

**Input:**

> What status indicators should I use for tests?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent lists status indicators

**Rubric:**

- EXCELLENT: ✅ Passing, ⏭️ Skipped (with rationale), ❌ Not Implemented, 🔴 Failing
- ACCEPTABLE: Lists most statuses
- POOR: Inconsistent or missing statuses

---

### tdd-011-coverage-summary (Story 11: Coverage Summary)

**Input:**

> Should I include a coverage summary in my test definitions?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent recommends coverage summary

**Rubric:**

- EXCELLENT: Yes, with totals, percentages per status, rationale for skipped
- ACCEPTABLE: Recommends summary
- POOR: No guidance on coverage tracking

---

### tdd-012-test-data-builders (Story 12: Test Data Builders)

**Input:**

> I'm writing tests that need complex test data. How should I structure this?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent recommends test data builders

**Rubric:**

- EXCELLENT: Recommends builder pattern with defaults, explains benefits
- ACCEPTABLE: Suggests organizing test data
- POOR: No guidance on test data

---

### tdd-013-llm-as-judge (Story 13: LLM-as-Judge Rubrics)

**Input:**

> I need to test if my AI's narrative response has the right tone. How?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent recommends LLM-as-judge with rubric

**Rubric:**

- EXCELLENT: LLM-as-judge with EXCELLENT/ACCEPTABLE/POOR rubric, avoid keyword matching
- ACCEPTABLE: Suggests rubric-based evaluation
- POOR: Suggests keyword matching

---

### tdd-014-real-llm-integration (Story 14: Integration with Real LLM)

**Input:**

> Should my integration tests use a real LLM or mock it?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent provides guidance on real vs mock

**Rubric:**

- EXCELLENT: Real LLM for schema compliance, mock for unit tests, cost considerations
- ACCEPTABLE: Distinguishes use cases
- POOR: No guidance on when to use real vs mock

---

### tdd-015-invest-gate (Story 15: INVEST Gate for Stories)

**Input:**

> My story is too big to estimate. What should I do?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent suggests splitting

**Rubric:**

- EXCELLENT: Cites INVEST (Estimable, Small), suggests splitting into smaller stories
- ACCEPTABLE: Suggests splitting
- POOR: Accepts large story

---

### tdd-016-red-flags (Story 16: Red Flags and Ratios)

**Input:**

> I have 50 E2E tests and 20 unit tests. Is this a good ratio?

**Context files:**

- `framework/guides/tdd-templates.md`

**Expected:** Agent identifies red flag

**Rubric:**

- EXCELLENT: Red flag - more E2E than unit is inverted pyramid, suggests adding unit tests
- ACCEPTABLE: Notes ratio concern
- POOR: Accepts inverted ratio

---

## test-definitions-guide.md

### testdef-001-template (Story 1: Use Standard Template)

**Input:**

> I need to create test definitions for a new feature. Where do I start?

**Context files:**

- `framework/guides/test-definitions-guide.md`

**Expected:** Agent points to template and workflow

**Rubric:**

- EXCELLENT: Points to template, lists 8 steps (fill in feature name, organize into suites, etc.)
- ACCEPTABLE: Points to template
- POOR: No template reference

---

### testdef-002-suites (Story 2: Organize Tests into Suites)

**Input:**

> I have 15 tests for a feature. How should I organize them?

**Context files:**

- `framework/guides/test-definitions-guide.md`

**Expected:** Agent suggests suite organization

**Rubric:**

- EXCELLENT: Suggests suites (Layout, Interactions, State, Accessibility, Edge Cases), numbered tests
- ACCEPTABLE: Suggests grouping logically
- POOR: No organization guidance

---

### testdef-003-status (Story 3: Track Test Status)

**Input:**

> What status indicators should I use for my tests?

**Context files:**

- `framework/guides/test-definitions-guide.md`

**Expected:** Agent lists status indicators

**Rubric:**

- EXCELLENT: ✅ Passing, ⏭️ Skipped (with rationale), ❌ Not Implemented, 🔴 Failing
- ACCEPTABLE: Lists most statuses
- POOR: Inconsistent statuses

---

### testdef-004-steps (Story 4: Write Clear Steps)

**Input:**

> My test step says "Check panes". Is this good enough?

**Context files:**

- `framework/guides/test-definitions-guide.md`

**Expected:** Agent identifies vague step

**Rubric:**

- EXCELLENT: Identifies as BAD (vague), shows GOOD example with numbered actionable steps
- ACCEPTABLE: Notes it's too vague
- POOR: Accepts vague step

---

### testdef-005-expected (Story 5: Define Specific Expected Outcomes)

**Input:**

> My expected outcome says "Everything works". Is this okay?

**Context files:**

- `framework/guides/test-definitions-guide.md`

**Expected:** Agent identifies vague outcome

**Rubric:**

- EXCELLENT: Identifies as BAD, shows GOOD example with specific measurable assertions
- ACCEPTABLE: Notes it's too vague
- POOR: Accepts vague outcome

---

### testdef-006-coverage (Story 6: Coverage Summary)

**Input:**

> Should I include a coverage summary in my test definitions?

**Context files:**

- `framework/guides/test-definitions-guide.md`

**Expected:** Agent recommends coverage summary

**Rubric:**

- EXCELLENT: Yes, with totals, percentages per status, rationale for skipped
- ACCEPTABLE: Recommends summary
- POOR: No guidance

---

### testdef-007-naming (Story 7: Test Naming)

**Input:**

> I named my test "Test 1". Is this okay?

**Context files:**

- `framework/guides/test-definitions-guide.md`

**Expected:** Agent identifies bad naming

**Rubric:**

- EXCELLENT: Identifies as BAD, suggests descriptive name like "Render all three panes"
- ACCEPTABLE: Notes name is not descriptive
- POOR: Accepts "Test 1"

---

### testdef-008-commands (Story 8: Test Execution Commands)

**Input:**

> What should I include in the test execution section?

**Context files:**

- `framework/guides/test-definitions-guide.md`

**Expected:** Agent lists command requirements

**Rubric:**

- EXCELLENT: Commands to run all tests, grep for specific test, match project tooling
- ACCEPTABLE: Suggests including commands
- POOR: No command guidance

---

### testdef-009-tdd-workflow (Story 9: TDD Workflow Integration)

**Input:**

> When should I create test definitions?

**Context files:**

- `framework/guides/test-definitions-guide.md`

**Expected:** Agent explains TDD timing

**Rubric:**

- EXCELLENT: Before implementation, alongside user stories, update status as tests pass/fail
- ACCEPTABLE: Mentions before implementation
- POOR: No timing guidance

---

### testdef-010-user-story-mapping (Story 10: Map to User Stories)

**Input:**

> How do I connect my tests to user stories?

**Context files:**

- `framework/guides/test-definitions-guide.md`

**Expected:** Agent explains mapping

**Rubric:**

- EXCELLENT: Each AC has at least one test, edge cases beyond AC, test file references
- ACCEPTABLE: Suggests mapping to AC
- POOR: No mapping guidance

---

### testdef-011-anti-patterns (Story 11: Avoid Common Mistakes)

**Input:**

> My test verifies "useUIStore hook works correctly". Is this a good test?

**Context files:**

- `framework/guides/test-definitions-guide.md`

**Expected:** Agent identifies anti-pattern

**Rubric:**

- EXCELLENT: Identifies as BAD (implementation detail), suggests testing observable behavior
- ACCEPTABLE: Notes it's testing implementation
- POOR: Accepts implementation detail test

---

### testdef-012-llm-optimized (Story 12: Apply LLM Instruction Design)

**Input:**

> How do I make my test definitions LLM-friendly?

**Context files:**

- `framework/guides/test-definitions-guide.md`

**Expected:** Agent provides LLM optimization guidance

**Rubric:**

- EXCELLENT: MECE decision trees, explicit definitions, concrete examples, actionable language
- ACCEPTABLE: Mentions clarity principles
- POOR: No LLM-specific guidance

---

## testing-methodology.md

### test-001-fastest-effective (Story 1: Fastest-Effective Test Rule)

**Input:**

> I need to test a discount calculation function. Should I use E2E or unit tests?

**Context files:**

- `framework/guides/testing-methodology.md`

**Expected:** Agent recommends unit test (fastest)

**Rubric:**

- EXCELLENT: Unit test (pure function, milliseconds vs seconds), shows BAD E2E vs GOOD unit example
- ACCEPTABLE: Recommends unit test
- POOR: Suggests E2E for calculation

---

### test-002-component-vs-flow (Story 2: Component vs Flow Testing)

**Input:**

> I want to test a React header component. Should I use E2E or integration tests?

**Context files:**

- `framework/guides/testing-methodology.md`

**Expected:** Agent recommends integration test for component

**Rubric:**

- EXCELLENT: Integration test for component behavior, E2E only for multi-page flows
- ACCEPTABLE: Distinguishes component vs flow
- POOR: Suggests E2E for single component

---

### test-003-distribution (Story 3: Target Distribution Guidance)

**Input:**

> I have 50 E2E tests and 20 integration tests. Is this a good ratio?

**Context files:**

- `framework/guides/testing-methodology.md`

**Expected:** Agent identifies red flag

**Rubric:**

- EXCELLENT: Red flag - more E2E than integration is too slow, suggests adding integration tests
- ACCEPTABLE: Notes ratio concern
- POOR: Accepts inverted ratio

---

### test-004-tdd-phases (Story 4: TDD Phases with Guardrails)

**Input:**

> I wrote a test and it's passing. Should I implement the code now?

**Context files:**

- `framework/guides/testing-methodology.md`

**Expected:** Agent identifies TDD violation

**Rubric:**

- EXCELLENT: RED phase violation - test must fail first, verify failure before implementation
- ACCEPTABLE: Notes test should fail first
- POOR: Accepts passing test before implementation

---

### test-005-decision-tree (Story 5: Test Type Decision Tree)

**Input:**

> I need to test narrative quality from my AI. What test type should I use?

**Context files:**

- `framework/guides/testing-methodology.md`

**Expected:** Agent uses decision tree, selects LLM Eval

**Rubric:**

- EXCELLENT: Question 1 → AI content quality → LLM Evaluation
- ACCEPTABLE: Selects LLM Eval
- POOR: Suggests unit or E2E for AI quality

---

### test-006-bug-mapping (Story 6: Bug-to-Test Mapping Table)

**Input:**

> I have a CSS layout bug. What test type should I use?

**Context files:**

- `framework/guides/testing-methodology.md`

**Expected:** Agent maps to E2E

**Rubric:**

- EXCELLENT: E2E (requires real browser for CSS), references lookup table
- ACCEPTABLE: Selects E2E
- POOR: Suggests unit test for CSS

---

### test-007-e2e-isolation (Story 7: E2E Dev/Test Server Isolation)

**Input:**

> My E2E tests keep failing because they conflict with my dev server. How do I fix this?

**Context files:**

- `framework/guides/testing-methodology.md`

**Expected:** Agent suggests port isolation

**Rubric:**

- EXCELLENT: Dev on stable port, tests on devPort+1000, Playwright config with isolated port
- ACCEPTABLE: Suggests separate ports
- POOR: No isolation guidance

---

### test-008-llm-evals (Story 8: LLM Evaluations Usage)

**Input:**

> Should I use keyword matching to test if my AI response has a "collaborative tone"?

**Context files:**

- `framework/guides/testing-methodology.md`

**Expected:** Agent recommends LLM-as-judge

**Rubric:**

- EXCELLENT: LLM-as-judge with rubric, avoid brittle keywords for creative outputs
- ACCEPTABLE: Suggests rubric-based evaluation
- POOR: Accepts keyword matching

---

### test-009-cost-controls (Story 9: Cost Controls for Evals)

**Input:**

> My LLM evals are getting expensive. How can I reduce costs?

**Context files:**

- `framework/guides/testing-methodology.md`

**Expected:** Agent provides cost reduction strategies

**Rubric:**

- EXCELLENT: Cache static prompts, batch scenarios, schedule full evals (PR/weekly)
- ACCEPTABLE: Mentions caching
- POOR: No cost guidance

---

### test-010-coverage-goals (Story 10: Coverage Goals and Critical Paths)

**Input:**

> What should I aim for in test coverage?

**Context files:**

- `framework/guides/testing-methodology.md`

**Expected:** Agent provides coverage guidance

**Rubric:**

- EXCELLENT: Unit 80%+ for pure functions, E2E for critical multi-page flows, defines "critical"
- ACCEPTABLE: Provides coverage targets
- POOR: Generic "100% coverage" advice

---

### test-011-quality-practices (Story 11: Test Quality Practices)

**Input:**

> My tests keep failing randomly. What should I check?

**Context files:**

- `framework/guides/testing-methodology.md`

**Expected:** Agent identifies flakiness causes

**Rubric:**

- EXCELLENT: Check async (polling vs arbitrary timeouts), independent tests, AAA pattern
- ACCEPTABLE: Mentions async issues
- POOR: Suggests skipping flaky tests

---

### test-012-ci-cadence (Story 12: CI/CD Testing Cadence)

**Input:**

> When should I run different test types in CI?

**Context files:**

- `framework/guides/testing-methodology.md`

**Expected:** Agent provides CI cadence

**Rubric:**

- EXCELLENT: Unit+integration every commit, E2E on PR, evals on schedule
- ACCEPTABLE: Distinguishes cadence by test type
- POOR: Run all tests on every commit

---

### test-013-project-doc (Story 13: Project-Specific Testing Doc)

**Input:**

> Where should I document my project's testing setup?

**Context files:**

- `framework/guides/testing-methodology.md`

**Expected:** Agent points to tests/SAFEWORD.md

**Rubric:**

- EXCELLENT: tests/SAFEWORD.md with stack, commands, patterns, config
- ACCEPTABLE: Suggests documentation location
- POOR: No documentation guidance

---

## user-story-guide.md

### story-001-template (Story 1: Use Standard Template)

**Input:**

> I need to create user stories for a new feature. Where do I start?

**Context files:**

- `framework/guides/user-story-guide.md`

**Expected:** Agent points to template and workflow

**Rubric:**

- EXCELLENT: Points to template, lists 7 steps (fill in feature name, create numbered stories, etc.)
- ACCEPTABLE: Points to template
- POOR: No template reference

---

### story-002-tracking (Story 2: Include Tracking Metadata)

**Input:**

> What metadata should I include in my user stories?

**Context files:**

- `framework/guides/user-story-guide.md`

**Expected:** Agent lists required metadata

**Rubric:**

- EXCELLENT: Status (✅/❌), test file refs, completion %, phase tracking, next steps
- ACCEPTABLE: Lists most metadata
- POOR: No metadata guidance

---

### story-003-invest (Story 3: INVEST Validation Gate)

**Input:**

> How do I know if my user story is ready to implement?

**Context files:**

- `framework/guides/user-story-guide.md`

**Expected:** Agent explains INVEST criteria

**Rubric:**

- EXCELLENT: Independent, Negotiable, Valuable, Estimable, Small, Testable - refine if any fail
- ACCEPTABLE: Mentions several INVEST criteria
- POOR: No validation criteria

---

### story-004-good-ac (Story 4: Write Good Acceptance Criteria)

**Input:**

> My acceptance criterion says "Campaign switching works". Is this good?

**Context files:**

- `framework/guides/user-story-guide.md`

**Expected:** Agent identifies vague AC

**Rubric:**

- EXCELLENT: Identifies as BAD (too vague), suggests specific measurable AC like "Response time <200ms"
- ACCEPTABLE: Notes it's too vague
- POOR: Accepts vague AC

---

### story-005-size (Story 5: Size Guidelines Enforcement)

**Input:**

> My user story has 8 acceptance criteria. Is this okay?

**Context files:**

- `framework/guides/user-story-guide.md`

**Expected:** Agent identifies story is too big

**Rubric:**

- EXCELLENT: Too big (6+ AC), suggests splitting into multiple stories, target 1-5 AC
- ACCEPTABLE: Notes it should be split
- POOR: Accepts 8 AC

---

### story-006-examples (Story 6: Good/Bad Examples Reference)

**Input:**

> Can you show me what a good user story looks like?

**Context files:**

- `framework/guides/user-story-guide.md`

**Expected:** Agent provides concrete example

**Rubric:**

- EXCELLENT: Shows complete example with As a/I want/So that, 1-5 specific AC
- ACCEPTABLE: Shows basic structure
- POOR: Vague or incomplete example

---

### story-007-conversation (Story 7: Conversation, Not Contract)

**Input:**

> Should I include all implementation details in my user story?

**Context files:**

- `framework/guides/user-story-guide.md`

**Expected:** Agent advises against implementation details

**Rubric:**

- EXCELLENT: No - stories are conversation starters, avoid implementation details, link to mockups
- ACCEPTABLE: Advises against implementation details
- POOR: Suggests including implementation details

---

### story-008-llm-wording (Story 8: LLM-Optimized Wording)

**Input:**

> How do I write user stories that AI agents can follow?

**Context files:**

- `framework/guides/user-story-guide.md`

**Expected:** Agent provides LLM optimization guidance

**Rubric:**

- EXCELLENT: Specific concrete language, numbers, explicit definitions, examples over rules
- ACCEPTABLE: Mentions clarity principles
- POOR: No LLM-specific guidance

---

### story-009-token-efficiency (Story 9: Token Efficiency)

**Input:**

> How long should my user story template be?

**Context files:**

- `framework/guides/user-story-guide.md`

**Expected:** Agent provides size guidance

**Rubric:**

- EXCELLENT: Keep lean (~9 lines), minimize overhead for prompting cost
- ACCEPTABLE: Suggests keeping it concise
- POOR: No size guidance

---

### story-010-technical-tasks (Story 10: Technical Tasks vs Stories)

**Input:**

> I want to write a user story: "As a developer, I want to refactor the database layer"

**Context files:**

- `framework/guides/user-story-guide.md`

**Expected:** Agent identifies this as technical task

**Rubric:**

- EXCELLENT: This is a technical task/spike, not a user story - no user value
- ACCEPTABLE: Notes it lacks user value
- POOR: Accepts technical task as user story

---

## zombie-process-cleanup.md

### zombie-001-port-cleanup (Story 1: Prefer Port-Based Cleanup)

**Input:**

> My dev server is stuck on port 3000. How do I kill it safely?

**Context files:**

- `framework/guides/zombie-process-cleanup.md`

**Expected:** Agent provides port-based cleanup

**Rubric:**

- EXCELLENT: `lsof -ti:3000 -ti:4000 | xargs kill -9` (both dev and test ports), explains why port-based is safe for multi-project
- ACCEPTABLE: Provides kill command for at least dev port
- POOR: Suggests `killall node`

---

### zombie-002-cleanup-script (Story 2: Project-Specific Cleanup Script)

**Input:**

> I need to clean up processes frequently. Should I create a script?

**Context files:**

- `framework/guides/zombie-process-cleanup.md`

**Expected:** Agent recommends cleanup script

**Rubric:**

- EXCELLENT: Yes, create scripts/cleanup.sh with DEV_PORT, TEST_PORT (dev+1000), and PROJECT_DIR variables
- ACCEPTABLE: Suggests creating script
- POOR: No script guidance

---

### zombie-003-unique-ports (Story 3: Unique Port Assignment)

**Input:**

> I'm working on multiple projects. How do I avoid port conflicts?

**Context files:**

- `framework/guides/zombie-process-cleanup.md`

**Expected:** Agent recommends unique ports

**Rubric:**

- EXCELLENT: Assign unique PORT per project (3000, 3001), document in README/env
- ACCEPTABLE: Suggests unique ports
- POOR: No port guidance

---

### zombie-004-tmux-isolation (Story 4: tmux/Screen Isolation)

**Input:**

> Is there a way to isolate terminal sessions per project?

**Context files:**

- `framework/guides/zombie-process-cleanup.md`

**Expected:** Agent suggests tmux/screen

**Rubric:**

- EXCELLENT: Named tmux session per project, one command kills session, notes learning curve
- ACCEPTABLE: Suggests terminal isolation
- POOR: No isolation guidance

---

### zombie-005-debugging (Story 5: Debugging Zombie Processes)

**Input:**

> How do I find which processes are stuck?

**Context files:**

- `framework/guides/zombie-process-cleanup.md`

**Expected:** Agent provides debugging commands

**Rubric:**

- EXCELLENT: Find by port, by process type, by project dir with $(pwd) pattern
- ACCEPTABLE: Provides find commands
- POOR: Generic advice

---

### zombie-006-best-practices (Story 6: Best Practices)

**Input:**

> What are the best practices for avoiding cross-project process kills?

**Context files:**

- `framework/guides/zombie-process-cleanup.md`

**Expected:** Agent provides best practices

**Rubric:**

- EXCELLENT: Unique ports, port-based cleanup first, cleanup scripts, clean before start
- ACCEPTABLE: Lists some practices
- POOR: No best practices

---

### zombie-007-quick-reference (Story 7: Quick Reference)

**Input:**

> Give me a quick reference for safe cleanup commands.

**Context files:**

- `framework/guides/zombie-process-cleanup.md`

**Expected:** Agent provides quick reference

**Rubric:**

- EXCELLENT: Kill by both dev+test ports (`$DEV_PORT`/`$TEST_PORT`), kill playwright for project, full cleanup script, warn against global kills
- ACCEPTABLE: Provides commands
- POOR: Suggests dangerous global kills

---

## code-philosophy.md (legacy tests)

### phil-legacy-model-levels (Story 3: Model at Three Levels - legacy test)

**Input:**

> Document the data model for a user management system

**Context files:**

- `framework/SAFEWORD.md`
- `framework/guides/data-architecture-guide.md`

**Expected:** Output includes conceptual, logical, and physical model levels

**Rubric:**

- EXCELLENT: All 3 levels (conceptual entities, logical attributes/relationships, physical storage+WHY)
- ACCEPTABLE: 2 of 3 levels present
- POOR: Only 1 level or missing WHY for storage choice

---

## Adding New Tests

When evaluating a new user story:

1. Identify testable behavior from the story
2. Create test ID: `{prefix}-{num}-{slug}`
3. Write input prompt that exercises the behavior
4. Define rubric with EXCELLENT/ACCEPTABLE/POOR
5. Add to this file under the appropriate guide section
6. Update summary table
