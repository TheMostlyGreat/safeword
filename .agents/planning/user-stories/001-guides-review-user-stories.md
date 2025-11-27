# Guides Review → User Story Extraction Plan

This document defines how we will extract user stories from each guide in `framework/guides/` and serves as the single place to collect them.

## Method
- Treat a “concept” as any method, pattern, workflow, anti-pattern, or decision rule that implies user behavior or developer workflow.
- For each concept, write at least one user story and acceptance criteria.
- Prefer concise, testable stories. Consolidate duplicates across guides.

### User Story Template
As a [role], I want [capability], so that [outcome].

Acceptance Criteria:
- [ ] Condition(s) that trigger behavior
- [ ] Observable result(s) and error states
- [ ] Success/Done definition

## Per-Guide Checklist
 - [x] architecture-guide.md — extracted
- [x] code-philosophy.md — extracted
 - [x] context-files-guide.md — extracted
 - [x] data-architecture-guide.md — extracted
 - [x] design-doc-guide.md — extracted
 - [x] learning-extraction.md — extracted
- [x] llm-instruction-design.md — extracted
- [x] llm-prompting.md — extracted
- [x] tdd-best-practices.md — extracted (renamed from tdd-templates.md)
- [x] test-definitions-guide.md — extracted
- [x] testing-methodology.md — extracted
- [x] user-story-guide.md — extracted
- [x] zombie-process-cleanup.md — extracted

## Extracted User Stories (to be populated)

### architecture-guide.md
1) Single Comprehensive Architecture Doc
As a project maintainer, I want one comprehensive architecture document per project/package, so that architecture context isn’t fragmented.
Acceptance Criteria:
- [ ] `ARCHITECTURE.md` exists at project/package root
- [ ] Required sections present (header, TOC, overview, data principles, model, components, flows, decisions, best practices, migration)
- [ ] Updated in place with version and status

2) Design Docs for Features
As a feature developer, I want concise design docs referencing the architecture doc, so that feature scope and approach are clear.
Acceptance Criteria:
- [ ] Location under `planning/design/` (or `docs/design/`)
- [ ] ~2–3 pages with user flow, component interactions, test mapping
- [ ] References architecture doc for broader decisions

3) Quick Doc-Type Decision
As a developer, I want a quick matrix to decide architecture vs design doc, so that I pick the right doc type.
Acceptance Criteria:
- [ ] Tech choices/data model → architecture doc
- [ ] New feature implementation → design doc
- [ ] Trade-offs can appear in both (brief in design doc)

4) Document Why, Not Just What
As a maintainer, I want decisions to include What/Why/Trade-offs/Alternatives, so that rationale is explicit.
Acceptance Criteria:
- [ ] Every key decision includes rationale and trade-offs
- [ ] Alternatives considered, with reasons for rejection
- [ ] Links to relevant code or prior decisions

5) Code References in Docs
As a doc author, I want to reference real code paths (with line ranges when helpful), so that readers can verify implementations.
Acceptance Criteria:
- [ ] Paths use `[module]/[file].[ext]:[start]-[end]` pattern when applicable
- [ ] Examples point to current code, not stale references
- [ ] References updated when code moves

6) Versioning and Status
As a maintainer, I want current vs proposed sections with version and status, so that readers know what’s live now.
Acceptance Criteria:
- [ ] Header includes Version and Status
- [ ] Sections separate current schema vs proposed
- [ ] Proposed items marked clearly

7) TDD Workflow Integration
As a developer, I want a docs-first, tests-first workflow, so that implementation follows clear definitions.
Acceptance Criteria:
- [ ] Order: User Stories → Test Definitions → Design Doc → Check Architecture → Implement → Update Architecture if needed
- [ ] Architecture doc reviewed before coding
- [ ] Updates recorded after new patterns emerge

8) Triggers to Update Architecture Doc
As a developer, I want clear triggers for architecture updates, so that docs stay accurate.
Acceptance Criteria:
- [ ] Update when: new data model concepts, tech choices, new patterns/conventions, architectural insights
- [ ] Don’t update for: single feature implementation, bug fixes, refactors without architectural impact

9) Avoid Common Mistakes
As a doc reviewer, I want checks that prevent doc anti-patterns, so that documentation stays useful.
Acceptance Criteria:
- [ ] No ADR sprawl; keep one comprehensive architecture doc
- [ ] Decisions always include rationale and status
- [ ] Design docs avoid duplicating architecture content

10) Standard File Organization
As an architect, I want a clear directory layout, so that docs are easy to find and maintain.
Acceptance Criteria:
- [ ] `ARCHITECTURE.md` at root; feature design docs under planning/design
- [ ] User stories and test definitions kept in planning subfolders
- [ ] Multiple architecture docs only for major subsystems (clearly scoped)

11) Data Architecture Guidance
As a data architect, I want a linked data architecture guide, so that data-heavy projects document models, flows, and policies properly.
Acceptance Criteria:
- [ ] Data architecture doc created when applicable
- [ ] Principles, models (conceptual/logical/physical), flows, and policies documented
- [ ] Integrated with TDD workflow and versioning

### code-philosophy.md
1) Response JSON Summary
As a developer using the agent, I want every response to end with a standard JSON summary, so that automations can reliably parse outcomes.
Acceptance Criteria:
- [ ] Summary includes keys: `proposedChanges`, `madeChanges`, `askedQuestion`
- [ ] Boolean values reflect the actual actions taken
- [ ] Missing or malformed summaries are flagged during review

2) Avoid Bloat, Prefer Elegant Code
As a maintainer, I want simple, focused solutions, so that the codebase remains easy to read and change.
Acceptance Criteria:
- [ ] PRs that add features include justification of necessity
- [ ] Redundant or speculative code is removed before merge
- [ ] Readability is prioritized over cleverness

3) Self-Documenting Code
As a reviewer, I want clear naming and structure with minimal comments, so that intent is obvious without verbose annotations.
Acceptance Criteria:
- [ ] Names convey purpose without abbreviations
- [ ] Comments explain non-obvious decisions only
- [ ] Functions stay small with clear responsibilities

4) Explicit Error Handling
As a developer, I want explicit error handling, so that failures are visible and traceable.
Acceptance Criteria:
- [ ] No swallowed errors; failures are surfaced
- [ ] Error messages include action context
- [ ] Control flow avoids blanket try/catch without handling

5) Documentation Verification
As a developer, I want to verify current docs and versions before coding, so that I don’t rely on outdated APIs.
Acceptance Criteria:
- [ ] Library versions are checked before implementation
- [ ] Feature assumptions are validated against docs
- [ ] Version-specific caveats are noted in PR/commit

6) TDD Workflow
As a developer, I want tests written first (RED → GREEN → REFACTOR), so that behavior is defined and changes are safe.
Acceptance Criteria:
- [ ] A failing test exists before feature implementation
- [ ] Only minimal code is added to pass the test
- [ ] Refactors keep tests green

7) Self-Testing Before Completion
As a developer, I want to run tests myself before declaring completion, so that users aren’t asked to verify my work.
Acceptance Criteria:
- [ ] Relevant tests run and pass locally
- [ ] Evidence of test run included in work notes/PR
- [ ] No request for user verification of correctness

8) Debug Logging Hygiene
As a developer, I want to log actual vs expected while debugging and remove logs after, so that code stays clean.
Acceptance Criteria:
- [ ] Debug logs show inputs and expected/actual deltas
- [ ] Temporary logs removed before merge
- [ ] Complex objects serialized meaningfully when needed

9) Cross-Platform Paths
As a developer, I want path handling that supports `/` and `\`, so that the code works on macOS, Windows, and Linux.
Acceptance Criteria:
- [ ] Join/resolve functions used instead of string concat
- [ ] Tests or manual checks on at least two platforms/CI
- [ ] No hard-coded separators

10) Best Practices Research
As a developer, I want to consult tool, domain, and UX best practices, so that implementations align with conventions.
Acceptance Criteria:
- [ ] PR/notes link to relevant best-practice references
- [ ] Design decisions mention tradeoffs briefly
- [ ] Anti-patterns avoided when documented

11) Self-Review Gate
As a developer, I want a pre-merge self-review, so that obvious issues are caught early.
Acceptance Criteria:
- [ ] Checklist: correctness, elegance, best practices, docs/version, tests
- [ ] Blockers addressed or explicitly deferred with rationale
- [ ] Final pass confirms user-facing functionality

12) Question-Asking Protocol
As a developer, I want to ask questions only after due diligence, so that I respect the user’s time.
Acceptance Criteria:
- [ ] Attempts include docs/code/test exploration
- [ ] Questions focus on domain preferences or unknowns
- [ ] Summary of attempted paths provided

13) Tooling Currency
As a devops-minded contributor, I want critical CLIs updated, so that workflows remain reliable and secure.
Acceptance Criteria:
- [ ] Update cadence or check noted in docs/automation
- [ ] Breaking changes reviewed before rollout
- [ ] Version pinning strategy documented if needed

14) Git Workflow
As a developer, I want frequent, descriptive commits, so that progress can be checkpointed and reviewed easily.
Acceptance Criteria:
- [ ] Small, atomic commits with clear messages
- [ ] Commit after each meaningful change/test pass
- [ ] Avoid “misc” or ambiguous messages

### context-files-guide.md
 1) Choose the Right Context File(s)
 As a maintainer, I want to create the context file(s) matching our tools, so that agents load the right guidance.
 Acceptance Criteria:
 - [ ] Use `CLAUDE.md` for Claude-specific guidance
 - [ ] Use `CURSOR.md` for Cursor-specific guidance
 - [ ] Use `AGENTS.md` for tool-agnostic project context
 - [ ] Subdirectory files created only when >3 unique rules or specialized context is needed
 
 2) SAFEWORD Trigger Required
 As a doc author, I want every project-level context file to start with a SAFEWORD trigger, so that global patterns are always loaded.
 Acceptance Criteria:
 - [ ] Top of file includes “ALWAYS READ FIRST: @./.safeword/SAFEWORD.md”
 - [ ] Brief rationale explains why SAFEWORD is referenced
 - [ ] Applies to `CLAUDE.md`, `CURSOR.md`, and `AGENTS.md`
 
 3) Respect Auto-Loading Behavior
 As a contributor, I want root + subdirectory context to load predictably, so that guidance is layered without duplication.
 Acceptance Criteria:
 - [ ] Subdirectory files assume root is loaded and use cross-references
 - [ ] No duplication of root content in subdirectory files
 - [ ] Reliability note: explicitly reference the file in conversations when needed
 
 4) Modular File Structure
 As a maintainer, I want a modular context structure with imports, so that files stay concise and scannable.
 Acceptance Criteria:
 - [ ] Root context imports `docs/architecture.md` and `docs/conventions.md` (or equivalents)
 - [ ] Imports use `@docs/...` or `@.safeword/...` patterns
 - [ ] Recursive imports limited to depth ≤5; code spans/blocks don’t resolve imports
 
 5) Content Inclusion/Exclusion Rules
 As a doc reviewer, I want clear guidelines on what belongs in context files, so that they stay high-signal.
 Acceptance Criteria:
 - [ ] Include why-over-what, project-specific conventions, domain requirements, examples, gotchas, cross-refs
 - [ ] Exclude setup/API docs, generic advice, feature lists, test commands (move to README/tests/other docs)
 - [ ] No implementation details (paths/line numbers) in root; put specifics in subdirectory files
 
 6) Size Targets and Modularity
 As a maintainer, I want size targets for context files, so that token usage stays efficient.
 Acceptance Criteria:
 - [ ] Root 100–200 lines; subdirectories 60–100; total <500 across project
 - [ ] If >200 lines, extract to subdirectory or use imports
 - [ ] Keep under ~50KB and modularize as needed
 
 7) Cross-Reference Pattern
 As a doc author, I want a standard cross-reference pattern, so that readers can jump between root and subdirectories.
 Acceptance Criteria:
 - [ ] Root uses “Agents (path) – See /AGENTS.md” style
 - [ ] Subdirectory files reference root SAFEWORD/AGENTS for architecture
 - [ ] Import examples show architecture, coding standards, and git workflow sections
 
 8) Maintenance Rules
 As a team, I want explicit maintenance rules, so that context stays current and lean.
 Acceptance Criteria:
 - [ ] Update on architecture changes; remove outdated sections immediately
 - [ ] Consolidate overlapping content across files
 - [ ] Verify hierarchical loading matches intent
 
 9) Domain Requirements Section (Optional)
 As a product/domain lead, I want domain requirements captured when needed, so that the AI respects specialized rules.
 Acceptance Criteria:
 - [ ] Add only for non-obvious domain knowledge
 - [ ] Use clear structure (domains → principles with rationale)
 - [ ] Provide concrete, testable guidance and resources
 
 10) LLM Comprehension Checklist
 As an author, I want a pre-commit checklist for LLM readability, so that instructions are reliable.
 Acceptance Criteria:
 - [ ] MECE decision logic; terms defined; no contradictions
 - [ ] Examples for rules and explicit edge cases
 - [ ] No redundancy; under 200 lines or uses imports
 
 11) Conciseness, Effectiveness, Token Budget
 As a maintainer, I want concise, effective context that respects token budgets, so that prompts remain efficient.
 Acceptance Criteria:
 - [ ] Short, declarative bullets; remove commentary/redundancy
 - [ ] Treat as living docs; add emphasis for critical rules
 - [ ] Keep files small; modularize via imports

### data-architecture-guide.md
 1) Decide Where to Document
 As an architect, I want a clear decision tree for data documentation, so that data changes land in the right doc.
 Acceptance Criteria:
 - [ ] Follow ordered decisions (project init → new store → model change → flow integration → single feature)
 - [ ] Edge cases handled (schema change always in architecture doc; 3+ entities → architecture)
 - [ ] Design doc used when only feature uses existing model
 
 2) Define Data Principles First
 As a maintainer, I want core data principles documented first, so that models and flows follow a stable foundation.
 Acceptance Criteria:
 - [ ] Data Quality, Governance, Accessibility, Living Documentation defined with What/Why/Document/Example
 - [ ] Validation checkpoints include file paths/line refs where applicable
 - [ ] Source of truth identified for each entity
 
 3) Model at Three Levels
 As a designer, I want conceptual, logical, and physical models, so that readers see the system from high-level to storage details.
 Acceptance Criteria:
 - [ ] Conceptual: entities with descriptions
 - [ ] Logical: attributes, types, relationships, constraints
 - [ ] Physical: storage tech, indexes, and rationale/trade-offs
 
 4) Document Data Flows
 As a developer, I want sources → transformations → destinations with error handling, so that flows are predictable and testable.
 Acceptance Criteria:
 - [ ] Each step includes validation, business logic, persistence, UI updates
 - [ ] Error handling covered for each step (not just happy path)
 - [ ] External integrations called out when applicable
 
 5) Specify Data Policies
 As a security-conscious maintainer, I want access, validation, and lifecycle policies, so that data is protected and consistent.
 Acceptance Criteria:
 - [ ] Read/write/delete roles and mechanisms defined
 - [ ] Lifecycle rules (create/update/delete/purge) documented
 - [ ] Conflict resolution strategy selected and justified
 
 6) TDD Integration Triggers
 As a developer, I want data-specific triggers for updating architecture docs, so that documentation stays current.
 Acceptance Criteria:
 - [ ] Update on new entities, schema changes, storage tech changes, perf bottlenecks
 - [ ] Cross-reference from `ARCHITECTURE.md` or `SAFEWORD.md`
 - [ ] Version/status and migration strategy updated
 
 7) Avoid Common Mistakes
 As a reviewer, I want checks that prevent data doc anti-patterns, so that docs remain trustworthy.
 Acceptance Criteria:
 - [ ] Source of truth defined; validation rules present
 - [ ] Migration strategy included for breaking changes
 - [ ] Performance targets concrete; implementation details kept out of architecture doc
 
 8) Best Practices Checklist Compliance
 As a maintainer, I want a pre-merge checklist, so that data docs meet quality standards.
 Acceptance Criteria:
 - [ ] Four+ principles documented; entities and models complete
 - [ ] Flows include error handling; validation checkpoints have line numbers
 - [ ] Version/status aligned with code; cross-references exist

### design-doc-guide.md
 1) Verify Prerequisites
 As a developer, I want to confirm user stories and test definitions before writing a design doc, so that the design aligns with validated behavior.
 Acceptance Criteria:
 - [ ] User stories exist and are linked
 - [ ] Test definitions exist and are linked
 - [ ] Design doc references both; no duplication
 
 2) Use Standard Template
 As a contributor, I want to use the standard design doc template, so that docs are consistent and complete.
 Acceptance Criteria:
 - [ ] Structure follows `templates/design-doc-template.md`
 - [ ] All required sections are present or marked "(if applicable)"
 - [ ] Saved under `planning/design/[feature]-design.md`
 
 3) Architecture Section
 As a designer, I want a concise architecture section, so that the high-level approach is clear.
 Acceptance Criteria:
 - [ ] 1–2 paragraphs describing overall approach and fit
 - [ ] Optional diagram if helpful
 - [ ] References architecture doc where relevant
 
 4) Components with [N]/[N+1] Pattern
 As a developer, I want concrete component examples with interfaces and tests, so that patterns are repeatable.
 Acceptance Criteria:
 - [ ] Define Component [N] (name, responsibility, interface, dependencies, tests)
 - [ ] Define Component [N+1] (different example showing variation)
 - [ ] Add additional components as needed
 
 5) Data Model (If Applicable)
 As a developer, I want the design doc to describe the data model when relevant, so that types and flows are explicit.
 Acceptance Criteria:
 - [ ] State shape or schema outlined
 - [ ] Relationships and flows between types shown
 - [ ] Interaction with components clear
 
 6) Component Interaction (If Applicable)
 As a developer, I want to document component communication, so that integration is predictable.
 Acceptance Criteria:
 - [ ] Events/method calls documented
 - [ ] Data flow between components shown (N → N+1)
 - [ ] Edge cases in interactions noted
 
 7) User Flow
 As a product-focused developer, I want a step-by-step user flow, so that UX is concrete and testable.
 Acceptance Criteria:
 - [ ] Concrete steps (e.g., keyboard shortcuts, buttons)
 - [ ] Aligns with user stories
 - [ ] Maps to test definitions
 
 8) Key Decisions with Trade-offs
 As a maintainer, I want key decisions documented with rationale and trade-offs, so that choices are explicit.
 Acceptance Criteria:
 - [ ] Each decision includes what, why (with specifics), and trade-off
 - [ ] Multiple decisions show [N]/[N+1] pattern
 - [ ] Links to benchmarks/analysis where relevant
 
 9) Implementation Notes (If Applicable)
 As an engineer, I want constraints, error handling, and gotchas documented, so that implementation risks are known.
 Acceptance Criteria:
 - [ ] Constraints, error handling approach, and gotchas listed
 - [ ] Open questions enumerated
 - [ ] References to ADRs/POCs included if applicable
 
 10) Quality Checklist
 As a reviewer, I want a design doc quality checklist, so that docs are concise and LLM-optimized.
 Acceptance Criteria:
 - [ ] References user stories and tests, does not duplicate them
 - [ ] Has Component [N] and [N+1] examples
 - [ ] ~121 lines target, clear and concise

### learning-extraction.md
1) Trigger-Based Extraction
As a developer, I want clear triggers to extract learnings, so that reusable knowledge is captured when it matters.
Acceptance Criteria:
- [ ] Observable complexity, trial-and-error, undocumented gotcha, integration struggle, testing trap, or architectural insight triggers extraction
- [ ] Forward-looking filter applied (“will this save future time?”)
- [ ] Extraction deferred until fix confirmed (no mid-debug extraction)

2) Check Existing Learnings First
As a contributor, I want to check for existing learnings before creating new ones, so that we prevent duplication.
Acceptance Criteria:
- [ ] Proactive search by keyword in project and global learnings
- [ ] Update existing learning when similar concept exists
- [ ] Reference existing vs new with explicit difference when partially overlapping

3) Place Learnings in Correct Location
As a maintainer, I want consistent locations for learnings, so that the knowledge base stays organized.
Acceptance Criteria:
- [ ] Global patterns → `.safeword/learnings/`
- [ ] Project-specific patterns → `./.safeword/learnings/`
- [ ] One-off narratives → `./.safeword/learnings/archive/`

4) Respect Instruction Precedence
As an agent, I want to follow cascading precedence, so that project-specific guidance overrides global defaults.
Acceptance Criteria:
- [ ] Order applied: explicit user > project learnings > global learnings > SAFEWORD.md
- [ ] Conflicts resolved in favor of higher precedence

5) Use Templates
As a doc author, I want standard templates for learnings and narratives, so that documents are consistent and actionable.
Acceptance Criteria:
- [ ] Forward-looking learning includes Principle, Gotcha, Good/Bad, Why, Examples, Testing Trap, Reference
- [ ] Narrative includes Problem, Investigation, Solution (diff), Lesson
- [ ] Examples are concrete and up to date

6) SAFEWORD.md Cross-Reference
As a maintainer, I want to cross-reference new learnings in SAFEWORD.md, so that discoverability stays high.
Acceptance Criteria:
- [ ] Add short entry under Common Gotchas or Architecture as appropriate
- [ ] Include bold name + one-liner + link
- [ ] Update references when files move or split

7) Suggest Extraction at the Right Time
As an assistant, I want to suggest learnings at appropriate confidence levels, so that we don’t create noise.
Acceptance Criteria:
- [ ] High confidence: suggest during debugging for complex/stuck patterns
- [ ] Medium confidence: ask after completion
- [ ] Low confidence: don’t suggest for trivial or well-documented cases

8) Review and Maintenance Cycle
As a maintainer, I want periodic review of learnings, so that guidance stays relevant.
Acceptance Criteria:
- [ ] Monthly relevance review; quarterly archive obsolete items
- [ ] Split learnings >200 lines or covering multiple concepts
- [ ] Consolidate overlapping learnings

9) Feedback Loop
As a team, I want to tune suggestion thresholds, so that learnings reflect real value.
Acceptance Criteria:
- [ ] Track acceptance rate of suggestions
- [ ] If acceptance <30%, raise suggestion threshold
- [ ] Monitor references of learnings in future work

10) Workflow Integration
As a developer, I want a clear extraction workflow during and after development, so that documentation fits naturally into delivery.
Acceptance Criteria:
- [ ] During dev: recognize trigger → assess scope → choose location → extract → cross-ref
- [ ] After feature: review → extract if threshold met → update cross-refs → commit with learning
- [ ] Commit messages include learning references when applicable

11) Anti-Patterns to Avoid
As a reviewer, I want to block low-value extractions, so that the knowledge base stays high-signal.
Acceptance Criteria:
- [ ] No trivial, one-liners, opinions without rationale, or steps without a lesson
- [ ] Don’t duplicate official docs
- [ ] Remove stale learning references after archiving/replacement

12) Directory & Size Standards
As a doc author, I want directory and size guidelines, so that files are easy to navigate and maintain.
Acceptance Criteria:
- [ ] Follow standard directory structure for global/project/archive
- [ ] Forward-looking: 50–150 lines; Narratives: 30–100 lines
- [ ] Split oversized files into focused concepts

### llm-instruction-design.md
1) MECE Decision Trees
As a documentation author, I want decision trees that are mutually exclusive and collectively exhaustive, so that LLMs follow unambiguous paths.
Acceptance Criteria:
- [ ] Branches do not overlap; first-match stops evaluation
- [ ] All relevant cases covered; none fall through
- [ ] Example tree included

2) Explicit Definitions
As a documentation author, I want all terms defined explicitly, so that LLMs don’t assume meanings.
Acceptance Criteria:
- [ ] Ambiguous terms replaced with precise definitions
- [ ] Examples clarify common misunderstandings
- [ ] “Lowest level” and similar phrases rewritten to be actionable

3) No Contradictions
As a maintainer, I want consistent guidance across sections, so that LLMs don’t receive conflicting rules.
Acceptance Criteria:
- [ ] Cross-check updates for conflicting statements
- [ ] Overlapping guidance reconciled into single rule
- [ ] Example of corrected contradiction included

4) Concrete Examples (Good vs Bad)
As a documentation author, I want 2–3 concrete examples per rule, so that LLMs learn patterns.
Acceptance Criteria:
- [ ] Each rule includes at least one BAD and one GOOD example
- [ ] Examples are brief and domain-relevant
- [ ] Examples updated when guidance changes

5) Edge Cases Explicit
As a writer, I want edge cases listed under each rule, so that LLMs handle tricky scenarios.
Acceptance Criteria:
- [ ] Edge cases listed and addressed
- [ ] Non-deterministic and environment-bound cases covered
- [ ] Clear routing of mixed concerns

6) Actionable, Not Vague
As a reader, I want actionable rules with optimization guidance, so that outcomes are consistent.
Acceptance Criteria:
- [ ] Subjective terms replaced by concrete rules and red flags
- [ ] Rules describe what to do, not opinions
- [ ] Checklist item ensures actionability

7) Sequential Decision Trees
As a maintainer, I want ordered questions, so that LLMs stop at the first match.
Acceptance Criteria:
- [ ] Questions presented in strict order
- [ ] “Stop at first match” called out
- [ ] Parallel structures removed

8) Tie-Breaking Rules
As a user, I want tie-breakers documented, so that ambiguous choices resolve deterministically.
Acceptance Criteria:
- [ ] Global tie-breaker declared (e.g., choose fastest test)
- [ ] References embedded in each decision tree
- [ ] Conflicts refer to the same tie-breaker

9) Lookup Tables for Complex Logic
As an author, I want simple tables for 3+ branch decisions, so that LLMs can map inputs to outputs cleanly.
Acceptance Criteria:
- [ ] Table includes clear cases without caveats in cells
- [ ] Complex logic extracted into a table
- [ ] Example table provided

10) No Caveats in Tables
As an author, I want caveats expressed as separate rows, so that tables remain pattern-friendly.
Acceptance Criteria:
- [ ] Parentheticals removed from cells
- [ ] Caveats represented by additional rows
- [ ] Table remains simple to parse

11) Percentages with Context
As an author, I want percentage guidance accompanied by adjustments, so that LLMs adapt sensibly.
Acceptance Criteria:
- [ ] Baseline + context-specific adjustments or principles-only alternative
- [ ] Avoid standalone percentages without rules
- [ ] Examples show adjustments

12) Specific Questions
As a writer, I want precise questions, so that LLMs choose correct tools.
Acceptance Criteria:
- [ ] Use tool-specific wording (e.g., real browser vs jsdom)
- [ ] Clarify commonly confused tools
- [ ] Examples included

13) Re-evaluation Paths
As a user, I want next steps when rules don’t fit, so that I can decompose the problem.
Acceptance Criteria:
- [ ] 3-step fallback path documented with example
- [ ] Encourages decomposition (pure vs I/O vs UI)
- [ ] Concrete example (e.g., login validation)

14) Anti-Patterns Guard
As a reviewer, I want to block common anti-patterns, so that docs stay reliable.
Acceptance Criteria:
- [ ] No visual metaphors, undefined jargon, outdated references
- [ ] Single decision framework per topic (no competition)
- [ ] Update all mentions when concepts are removed

15) Quality Checklist Compliance
As a maintainer, I want a pre-commit checklist for LLM docs, so that guidance is consistent.
Acceptance Criteria:
- [ ] MECE, explicit definitions, no contradictions
- [ ] Examples, edge cases, tie-breakers, lookup tables as needed
- [ ] Re-evaluation path present

### llm-prompting.md
1) Concrete Examples in Prompts
As a prompt author, I want GOOD vs BAD code examples, so that guidance is concrete and learnable.
Acceptance Criteria:
- [ ] Each rule has at least one BAD and one GOOD example
- [ ] Examples are short and domain-relevant
- [ ] Examples updated as patterns evolve

2) Structured Outputs via JSON
As an engineer, I want LLM responses to follow JSON schemas, so that outputs are predictable and easily validated.
Acceptance Criteria:
- [ ] Prompts request JSON output with explicit schema
- [ ] Responses validated against schema
- [ ] Free-form prose avoided for machine consumption

3) Prompt Caching for Cost Reduction
As an agent developer, I want static rules cached with cache_control: ephemeral, so that repeated calls are cheaper.
Acceptance Criteria:
- [ ] Static content in system prompt marked cacheable (ephemeral)
- [ ] Dynamic state placed in user messages (non-cached)
- [ ] Cache hit behavior verified; changes to cached blocks minimized

4) Message Architecture (Static vs Dynamic)
As an implementer, I want clean separation of static rules and dynamic inputs, so that caching and clarity improve.
Acceptance Criteria:
- [ ] No dynamic state interpolated into cached system prompts
- [ ] User messages contain dynamic state and inputs
- [ ] Example snippet provided showing separation

5) Cache Invalidation Discipline
As a maintainer, I want to change cached blocks sparingly, so that we avoid widespread cache invalidation.
Acceptance Criteria:
- [ ] Acknowledge “any change breaks all caches”
- [ ] Batch edits to cached sections
- [ ] Document rebuild cost when caches invalidate

6) LLM-as-Judge Evaluations
As a tester, I want rubric-driven LLM evaluations, so that nuanced qualities can be tested reliably.
Acceptance Criteria:
- [ ] Rubrics define EXCELLENT/ACCEPTABLE/POOR with criteria
- [ ] Avoid brittle keyword checks for creative outputs
- [ ] Evaluations integrated into test suite where applicable

7) Evaluation Framework Mapping
As a test planner, I want clear guidance on Unit, Integration, and LLM Evals, so that we test at the right layer.
Acceptance Criteria:
- [ ] Unit: pure functions; Integration: agent + LLM calls; LLM Evals: judgment quality
- [ ] Real browser required only for E2E scenarios
- [ ] Examples for mapping common cases

8) Cost Awareness for Evals
As a maintainer, I want evals sized and cached thoughtfully, so that costs stay predictable.
Acceptance Criteria:
- [ ] Note typical scenario counts and approximate costs with caching
- [ ] Use caching for static rubrics and examples
- [ ] Document budget expectations in CI

9) “Why” Over “What” in Prompts
As a prompt author, I want rationales with numbers, so that trade-offs are explicit.
Acceptance Criteria:
- [ ] Prompts include brief rationale for critical rules
- [ ] Where possible, include metrics or concrete targets
- [ ] Trade-offs and gotchas stated explicitly

10) Precise Technical Terms
As a writer, I want specific terms (e.g., real browser vs jsdom), so that tool selection is correct.
Acceptance Criteria:
- [ ] Prompts ask “Does this require a real browser (Playwright/Cypress)?”
- [ ] Clarify React Testing Library is not a real browser
- [ ] Common confusions documented

### tdd-best-practices.md (formerly tdd-templates.md)
1) Select Correct Template
As a planner, I want to select the right template (user stories, test definitions, design doc, architecture), so that documentation aligns with TDD workflow.
Acceptance Criteria:
- [ ] Feature/issues → user stories template
- [ ] Feature test suites → test definitions template
- [ ] Feature implementation → design doc template
- [ ] Project-wide decisions → architecture doc (no template)
- [ ] Example prompts guide correct selection

2) Choose Story Format
As a writer, I want to choose the appropriate story format (standard, Given-When-Then, job story), so that intent is clear.
Acceptance Criteria:
- [ ] Standard format (As a / I want / So that) used by default
- [ ] Given-When-Then for behavior-focused stories
- [ ] Job story for outcome-focused cases
- [ ] Each format includes example

3) Write Quality Acceptance Criteria
As a product owner, I want specific, testable AC with out-of-scope sections, so that delivery is measurable.
Acceptance Criteria:
- [ ] AC specify measurable behavior (e.g., "<200ms", "within 5 clicks")
- [ ] Out-of-scope listed to prevent scope creep
- [ ] Good examples demonstrate testable conditions
- [ ] Bad examples show what to avoid

4) Block Story Anti-Patterns
As a reviewer, I want to reject vague, technical-task, or bundled stories, so that stories remain valuable.
Acceptance Criteria:
- [ ] Vague value or missing AC is blocked (example provided)
- [ ] Technical-only stories redirected to task/spike
- [ ] Bundled features (3+) split into multiple stories
- [ ] Missing "So that" flagged

5) Use Unit Test Template
As a developer, I want unit tests following AAA pattern, so that behavior and edge cases are covered.
Acceptance Criteria:
- [ ] Template includes Arrange/Act/Assert structure
- [ ] Happy path, error path, and edge cases present
- [ ] describe/it nesting shown with naming examples

6) Use Integration Test Template
As a developer, I want integration tests with setup/teardown and realistic flows, so that components work together.
Acceptance Criteria:
- [ ] beforeEach/afterEach for fixtures
- [ ] Full workflow with assertions on outcomes
- [ ] Failure cases test rollback/consistency

7) Use E2E Test Template
As a QA engineer, I want E2E tests using real browser patterns, so that user journeys are validated.
Acceptance Criteria:
- [ ] Playwright/Cypress patterns demonstrated
- [ ] UI interactions and state assertions included
- [ ] Multi-step flows shown

8) Apply Test Naming Conventions
As a reviewer, I want descriptive test names, so that intent is obvious without reading code.
Acceptance Criteria:
- [ ] Good examples: behavior + condition ("should return X when Y")
- [ ] Bad examples: vague or implementation-focused
- [ ] Rename guidance provided

9) Enforce Test Independence
As a developer, I want tests isolated with fresh state, so that order doesn't matter.
Acceptance Criteria:
- [ ] Good example: beforeEach creates fresh state
- [ ] Bad example: shared mutable state
- [ ] No test depends on another test's side effects

10) Know What to Test
As a developer, I want clear guidance on what to test vs skip, so that effort is focused.
Acceptance Criteria:
- [ ] Test: public API, user features, edge cases, error handling, integrations
- [ ] Don't test: private internals, third-party internals, trivial code
- [ ] Examples clarify boundaries

11) Use Test Data Builders
As a developer, I want reusable builders for complex test data, so that tests are concise.
Acceptance Criteria:
- [ ] Builder function with override support shown
- [ ] Example demonstrates customization per test
- [ ] Reduces duplication across tests

12) Apply LLM Testing Patterns
As a tester, I want rubric-based LLM evals, so that AI quality is testable.
Acceptance Criteria:
- [ ] Promptfoo template with llm-rubric shown
- [ ] EXCELLENT/ACCEPTABLE/POOR grading criteria defined
- [ ] Integration test with real LLM call demonstrated

13) INVEST Gate for Stories
As a product owner, I want every story to pass INVEST, so that it's deliverable and testable.
Acceptance Criteria:
- [ ] Independent, Negotiable, Valuable, Estimable, Small, Testable
- [ ] Failing any criterion triggers refinement or split
- [ ] Checklist provided for validation

14) Use Red Flags Quick Reference
As a reviewer, I want quick red flag checklists, so that common mistakes are caught fast.
Acceptance Criteria:
- [ ] User story red flags listed (no AC, >3 AC, technical details, no value)
- [ ] Test red flags listed (vague name, shared state, >50 lines, tests implementation)
- [ ] E2E vs integration vs unit decision guidance included

### test-definitions-guide.md
1) Use the Standard Test Definitions Template
As a tester, I want to use the provided test definitions template, so that feature tests are consistent and complete.
Acceptance Criteria:
- [ ] Read and fill `templates/test-definitions-feature.md`
- [ ] Include feature name, issue number, and test file path
- [ ] Save under `planning/test-definitions/[id]-[feature]-test-definitions.md`

2) Organize Tests into Suites
As a maintainer, I want tests grouped logically, so that coverage is easy to navigate.
Acceptance Criteria:
- [ ] Suites reflect layout/structure, interactions, state, accessibility, edge cases
- [ ] Suite names/descriptions explain scope
- [ ] Tests numbered (e.g., 1.1, 1.2)

3) Track Test Status
As a contributor, I want consistent status indicators, so that progress is visible.
Acceptance Criteria:
- [ ] Use ✅ Passing, ⏭️ Skipped (with rationale), ❌ Not Implemented, 🔴 Failing
- [ ] Status listed per test
- [ ] "Last Updated" maintained

4) Write Clear Steps
As a tester, I want actionable, numbered steps, so that tests are reproducible.
Acceptance Criteria:
- [ ] Steps are concrete and minimal
- [ ] Avoid vague phrasing like "check it works"
- [ ] Example step blocks used as reference

5) Define Specific Expected Outcomes
As a tester, I want specific assertions, so that pass/fail is unambiguous.
Acceptance Criteria:
- [ ] Expected outcomes are measurable
- [ ] Avoid "everything works"
- [ ] Example assertion blocks used as reference

6) Coverage Summary
As a maintainer, I want a coverage breakdown, so that gaps are obvious.
Acceptance Criteria:
- [ ] Totals and percentages per status
- [ ] Coverage by feature table (if applicable)
- [ ] Rationale for skipped tests

7) Test Naming
As a reviewer, I want descriptive test names, so that intent is clear.
Acceptance Criteria:
- [ ] Names describe observable behavior
- [ ] Avoid "Test 1" or implementation details
- [ ] Unique names across suite

8) Test Execution Commands
As a developer, I want practical commands documented, so that I can run tests quickly.
Acceptance Criteria:
- [ ] Include commands to run all tests for the feature
- [ ] Include grep/example to run a specific test
- [ ] Commands match project tooling

9) TDD Workflow Integration
As a developer, I want tests defined before implementation and updated during delivery, so that TDD is enforced.
Acceptance Criteria:
- [ ] Created before implementation and alongside user stories
- [ ] Status updated as tests pass/skip/fail
- [ ] "Last Updated" timestamp maintained

10) Map to User Stories
As a PM/dev, I want tests to map directly to user story AC, so that verification is complete.
Acceptance Criteria:
- [ ] Each user story AC has at least one test
- [ ] Edge cases and errors included beyond AC
- [ ] References to test file locations included

11) Avoid Common Mistakes
As a reviewer, I want to block anti-patterns, so that definitions are high quality.
Acceptance Criteria:
- [ ] No implementation details tested
- [ ] No vague steps or missing coverage summaries
- [ ] No duplicate test descriptions

12) Apply LLM Instruction Design
As an author, I want LLM-optimized definitions, so that agents follow them reliably.
Acceptance Criteria:
- [ ] Use MECE decision trees; define terms explicitly
- [ ] Include concrete examples and edge cases
- [ ] Use actionable language throughout
1) Choose the Right Template
As a planner, I want to select the correct template (user stories, test definitions, design doc, architecture doc), so that documentation aligns with TDD workflow.
Acceptance Criteria:
- [ ] Feature/issues → user stories template
- [ ] Feature test suites → test definitions template
- [ ] Feature/system implementation → design doc template
- [ ] Project/package-wide decisions → architecture document

2) Story Format Selection
As a writer, I want to choose the appropriate story format (standard, Given-When-Then, job story), so that intent is clear.
Acceptance Criteria:
- [ ] Standard format used by default
- [ ] Given-When-Then for behavior-focused stories
- [ ] Job story for outcome-focused cases

3) Story Acceptance Criteria and Scope
As a product owner, I want clear AC and explicit out-of-scope sections, so that delivery is measurable.
Acceptance Criteria:
- [ ] 2–5 specific, testable AC
- [ ] Out-of-scope listed to prevent creep
- [ ] Links to tests/design doc when available

4) Block Story Anti-Patterns
As a reviewer, I want to reject vague, technical-task, or bundled stories, so that stories remain valuable and small.
Acceptance Criteria:
- [ ] Vague value or missing AC is blocked
- [ ] Implementation-only “story” redirected to a task/spike
- [ ] Bundled features split into multiple stories

5) Create Test Definitions per Feature
As a tester, I want structured test definitions with status and coverage, so that verification is transparent.
Acceptance Criteria:
- [ ] Suites and individual tests organized
- [ ] Status per test: Passing/Skipped/Not Implemented/Failing
- [ ] Coverage summary and execution commands included

6) Unit Test Template Usage
As a developer, I want unit tests to follow the provided template, so that behavior and edge cases are covered.
Acceptance Criteria:
- [ ] AAA structure used
- [ ] Happy path, error path, and edge cases present
- [ ] Deterministic assertions, no flaky timers/randomness

7) Integration Test Template Usage
As a developer, I want integration tests with setup/teardown and realistic flows, so that components work together.
Acceptance Criteria:
- [ ] Fixtures for DB/APIs handled in beforeEach/afterEach
- [ ] Full workflow exercised with assertions on outcomes
- [ ] Failure cases test rollback/consistency

8) E2E Test Template Usage
As a QA engineer, I want E2E tests using a real browser, so that user journeys are validated.
Acceptance Criteria:
- [ ] UI interactions scripted; URL/state assertions included
- [ ] Page structure assertions reflect UX
- [ ] Keep flows focused; long flows split

9) Test Naming Conventions
As a reviewer, I want descriptive test names, so that intent is obvious.
Acceptance Criteria:
- [ ] Names describe observable behavior and conditions
- [ ] No vague or implementation-focused names
- [ ] Rename flagged vague tests

10) Test Independence
As a developer, I want tests isolated with fresh state, so that order does not matter.
Acceptance Criteria:
- [ ] No shared mutable state across tests
- [ ] Fresh fixtures per test via setup helpers
- [ ] Flaky order-dependent tests prohibited

11) What to Test vs Not Test
As a reviewer, I want guidance applied to focus on behavior, so that tests are high ROI.
Acceptance Criteria:
- [ ] Public API and user features tested
- [ ] Avoid private internals and third-party internals
- [ ] Trivial code not tested unless business logic

12) Test Data Builders
As a developer, I want reusable builders for complex data, so that tests are concise and maintainable.
Acceptance Criteria:
- [ ] Builder functions with override support exist
- [ ] Examples demonstrate customization
- [ ] Builders shared across suites where sensible

13) LLM-as-Judge Rubrics
As a tester, I want rubric-based evals for narrative/reasoning, so that subjective qualities are testable.
Acceptance Criteria:
- [ ] Rubrics specify EXCELLENT/ACCEPTABLE/POOR criteria
- [ ] Promptfoo (or equivalent) templates used when applicable
- [ ] Avoid brittle keyword matching

14) Integration with Real LLM
As an integration tester, I want real LLM calls for structured outputs, so that agent behavior is validated.
Acceptance Criteria:
- [ ] Tests assert structured fields (not prose)
- [ ] Costs acknowledged and minimized (e.g., ~$0.01 per test)
- [ ] Sensitive secrets isolated in CI

15) INVEST Gate for Stories
As a product owner, I want every story to pass INVEST, so that it’s deliverable and testable.
Acceptance Criteria:
- [ ] Independent, Negotiable, Valuable, Estimable, Small, Testable
- [ ] Failing any criterion triggers refinement
- [ ] Split large stories before acceptance

16) Red Flags and Ratios
As a maintainer, I want red flags enforced and test mix monitored, so that the suite stays efficient.
Acceptance Criteria:
- [ ] Red flags checklist applied (long tests, dependencies, vague names)
- [ ] Ratio baseline 70/20/10 (unit/integration/E2E) with documented adjustments per project
- [ ] Prefer “as many fast tests as possible” principle with exceptions noted

### testing-methodology.md
1) Fastest-Effective Test Rule
As a developer, I want to choose the fastest test type that can catch a bug, so that feedback loops stay quick and cheap.
Acceptance Criteria:
- [ ] Apply speed hierarchy: Unit → Integration → LLM Eval → E2E
- [ ] If multiple apply, choose the faster one (tie-breaker)
- [ ] Anti-patterns avoided (e.g., business logic via E2E)

2) Component vs Flow Testing
As a tester, I want component behavior tested with integration and multi-page flows with E2E, so that each level is validated appropriately.
Acceptance Criteria:
- [ ] UI components verified with integration tests (no real browser)
- [ ] Multi-page flows use E2E with a real browser
- [ ] Examples guide common cases

3) Target Distribution Guidance
As a maintainer, I want guidance favoring fast tests, so that the suite remains efficient.
Acceptance Criteria:
- [ ] Emphasize unit+integration; E2E only for critical paths
- [ ] Add LLM evals only for AI features needing judgment
- [ ] Red flag documented: more E2E than integration is too slow

4) TDD Phases with Guardrails
As a developer, I want explicit steps for RED → GREEN → REFACTOR, so that TDD is followed correctly.
Acceptance Criteria:
- [ ] RED: write failing test, verify it fails for correct reason, commit test
- [ ] GREEN: minimum code to pass, no extra features (YAGNI)
- [ ] REFACTOR: improve design with tests green; optional subagent validation

5) Test Type Decision Tree
As a tester, I want a sequential decision tree, so that I can deterministically select test type.
Acceptance Criteria:
- [ ] Ordered questions: LLM Eval → E2E → Integration → Unit
- [ ] Edge cases: non-determinism → mock; env deps → integration; mixed → split
- [ ] Re-evaluation path documented with example (login validation)

6) Bug-to-Test Mapping Table
As a planner, I want a lookup table mapping bug types to test types, so that choices are consistent.
Acceptance Criteria:
- [ ] Include calculation, API, DB, state, CSS, navigation cases
- [ ] “Best choice” favors fastest viable test
- [ ] Aligns with decision tree

7) E2E Dev/Test Server Isolation
As a QA engineer, I want isolated ports and processes for E2E, so that we avoid port conflicts and zombie processes.
Acceptance Criteria:
- [ ] Dev on stable port; tests on devPort+1000 (or ephemeral fallback)
- [ ] Playwright config uses isolated port and reuse rules
- [ ] Package scripts include dev and dev:test commands

8) LLM Evaluations Usage
As a tester, I want to use LLM evals with rubrics when judging quality, so that nuanced outputs are verified.
Acceptance Criteria:
- [ ] Use programmatic assertions for structure; use LLM-as-judge for tone/reasoning
- [ ] Skip evals when simple/deterministic
- [ ] Costs acknowledged; caching used

9) Cost Controls for Evals
As a maintainer, I want to reduce eval costs, so that CI remains affordable.
Acceptance Criteria:
- [ ] Cache static prompts/examples
- [ ] Batch scenarios; schedule full evals (e.g., PR/weekly)
- [ ] Document expected costs and ROI

10) Coverage Goals and Critical Paths
As a team, I want clear coverage goals and critical path definitions, so that tests cover what matters.
Acceptance Criteria:
- [ ] Unit: 80%+ for pure functions
- [ ] E2E: all critical multi-page flows; Integration: all critical paths
- [ ] “Critical” defined (auth, payment, data loss, core flows)

11) Test Quality Practices
As a developer, I want clear guidance on writing effective tests, so that tests are reliable and maintainable.
Acceptance Criteria:
- [ ] AAA pattern enforced; descriptive naming; independent tests
- [ ] Async uses polling/selectors (no arbitrary timeouts)
- [ ] What not to test documented (implementation details, trivial code, third-party internals)

12) CI/CD Testing Cadence
As a maintainer, I want a CI plan that balances speed and confidence, so that pipelines are efficient.
Acceptance Criteria:
- [ ] Unit+integration on every commit; E2E on PR; evals on schedule
- [ ] No skipped tests without justification
- [ ] Coverage thresholds enforced

13) Project-Specific Testing Doc
As a maintainer, I want `tests/SAFEWORD.md` to document stack/commands/patterns, so that contributors can run tests correctly.
Acceptance Criteria:
- [ ] File exists with stack, commands, setup, file structure, patterns
- [ ] TDD expectations, coverage and PR requirements included
- [ ] If missing, ask where testing docs are and create/update

14) Test Integrity Guardrails
As a developer, I want explicit rules preventing test modifications without approval, so that tests remain trusted specifications.
Acceptance Criteria:
- [ ] Tests not modified/skipped/deleted without human approval
- [ ] Forbidden actions enforced (changing assertions, .skip(), weakening, deleting)
- [ ] Implementation fixed when test fails (not the test)
- [ ] Requirement changes discussed before test updates

### user-story-guide.md
1) Use the Standard User Stories Template
As a planner, I want to use the provided user stories template, so that stories are consistent and easy to track.
Acceptance Criteria:
- [ ] Fill `templates/user-stories-template.md` with feature name, issue number, status
- [ ] Number stories (Story 1, Story 2, …)
- [ ] Save to `planning/user-stories/[id]-[feature].md` (or project convention)

2) Include Tracking Metadata
As a PM, I want status, test refs, and completion summaries, so that progress is visible.
Acceptance Criteria:
- [ ] ✅/❌ per story and per AC
- [ ] Test file references included
- [ ] Completion % and phase tracking present; next steps listed

3) INVEST Validation Gate
As a reviewer, I want INVEST validation before saving, so that stories are deliverable.
Acceptance Criteria:
- [ ] Independent, Negotiable, Valuable, Estimable, Small, Testable
- [ ] If any fail → refine or split before merge
- [ ] Validation documented in the story file or PR notes

4) Write Good Acceptance Criteria
As a writer, I want specific, user-facing, testable AC, so that done is unambiguous.
Acceptance Criteria:
- [ ] AC specify measurable behavior (e.g., “<200ms”)
- [ ] Avoid technical/implementation details
- [ ] Avoid vague phrasing (“works”, “better”)

5) Size Guidelines Enforcement
As a planner, I want size checks, so that stories are right-sized.
Acceptance Criteria:
- [ ] Split if 6+ AC, multiple personas, multiple screens, or >6 days
- [ ] Combine if trivial (<1 hour, no AC)
- [ ] Target: 1–5 AC, 1–2 screens/personas, 1–5 days

6) Good/Bad Examples Reference
As a contributor, I want examples of good vs bad stories, so that quality is consistent.
Acceptance Criteria:
- [ ] Provide at least one good story example in the doc
- [ ] Provide a “too big” and “no value” anti-example
- [ ] Technical tasks labeled as tasks/spikes (not user stories)

7) Conversation, Not Contract
As a team, I want stories to be conversation starters, so that details emerge collaboratively.
Acceptance Criteria:
- [ ] Discuss edge cases, approach, open questions during planning
- [ ] Story avoids implementation details and test strategies
- [ ] Link to UI mockups instead of embedding

8) LLM-Optimized Wording
As a writer, I want LLM-friendly wording, so that agents follow stories reliably.
Acceptance Criteria:
- [ ] Use specific, concrete language with numbers where helpful
- [ ] Define terms explicitly; avoid generic phrases
- [ ] Use examples over abstract rules

9) Token Efficiency of Template
As a maintainer, I want minimal template overhead, so that prompting cost stays low.
Acceptance Criteria:
- [ ] Keep template lean (≈9 lines)
- [ ] Flat structure, no nested sections or validation metadata
- [ ] Reuse standard sections across stories

10) File Naming Conventions
As a contributor, I want descriptive filenames, so that stories are discoverable.
Acceptance Criteria:
- [ ] Use descriptive slugs (e.g., `campaign-switching.md`)
- [ ] Avoid generic or bloated names
- [ ] Place under `docs/stories/` when appropriate

### zombie-process-cleanup.md
1) Prefer Port-Based Cleanup
As a developer, I want to kill processes by port, so that I don’t affect other projects.
Acceptance Criteria:
- [ ] Use `lsof -ti:PORT | xargs kill -9` for dev servers
- [ ] Avoid blanket `killall node` or `pkill -9 node`
- [ ] Verify port uniqueness per project

2) Project-Specific Cleanup Script
As a maintainer, I want a `scripts/cleanup.sh`, so that cleanup is safe and repeatable.
Acceptance Criteria:
- [ ] Script kills by project port and filters by current directory
- [ ] Handles dev server, Playwright browsers, and test runners
- [ ] Mark executable and document usage

3) Unique Port Assignment
As a team, I want unique ports per project, so that cleanup is unambiguous.
Acceptance Criteria:
- [ ] Set explicit `PORT` per project (e.g., 3000, 3001)
- [ ] Document ports in README or env
- [ ] Verify in CI/local scripts

4) tmux/Screen Isolation (Optional)
As a developer, I want isolated terminal sessions, so that I can kill everything for one project safely.
Acceptance Criteria:
- [ ] Start dev in a named session
- [ ] One command kills only that session
- [ ] Trade-offs documented (learning curve)

5) Debugging Zombie Processes
As a developer, I want quick commands to find processes, so that I can target cleanup precisely.
Acceptance Criteria:
- [ ] Commands to find by port, by process type, and by project directory
- [ ] Guidance for listing node/playwright/chromium
- [ ] Prefer filtered kills using `$(pwd)` pattern

6) Best Practices
As a maintainer, I want a short best-practices list, so that the team consistently avoids cross-project kills.
Acceptance Criteria:
- [ ] Assign unique ports; use port-based cleanup first
- [ ] Create and use project cleanup scripts
- [ ] Clean before start; check with `lsof -i:PORT`

7) Quick Reference
As a developer, I want a quick-reference table, so that I can copy/paste safe commands.
Acceptance Criteria:
- [ ] Include kill by port, kill playwright for this project, full cleanup script
- [ ] Include commands to check ports and find zombies
- [ ] Warn against dangerous global kills


