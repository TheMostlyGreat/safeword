# User Stories: Technical Constraints in TDD (Ticket #004)

**Guide**: `@./.safeword/guides/user-story-guide.md`
**Template**: `@./.safeword/templates/user-stories-template.md`

**Feature**: Add Technical Constraints section to user stories to capture NFRs before test definitions

**Related Issue**: #004
**Status**: ✅ Complete (3/3 stories complete)

---

## Technical Constraints

_N/A — Documentation-only change, no runtime behavior._

---

## Story 1: Capture Technical Constraints in User Stories

**As a** developer using TDD workflow
**I want to** document technical constraints (performance, security, compatibility) alongside user stories
**So that** test definitions are informed by NFRs from the start

**Acceptance Criteria**:

- [✅] User stories template has Technical Constraints section
- [✅] Section includes categories: Performance, Security, Compatibility, Data, Dependencies, Infrastructure
- [✅] Each constraint is a checkbox for tracking
- [✅] Template notes "delete sections that don't apply"

**Implementation Status**: ✅ Complete
**Tests**: N/A (documentation change)

**Notes**: Chose to add constraints to user stories (Option A) vs separate doc (Option B) for simplicity.

---

## Story 2: Guide Users on Filling Out Constraints

**As a** developer creating user stories
**I want to** understand what makes a good technical constraint
**So that** I write specific, testable constraints (not vague requirements)

**Acceptance Criteria**:

- [✅] User story guide has "Technical Constraints Section" with guidance
- [✅] Categories table explains what each category captures
- [✅] Good/bad examples show specific vs vague constraints
- [✅] Decision rule clarifies when to include/skip constraints

**Implementation Status**: ✅ Complete
**Tests**: N/A (documentation change)

---

## Story 3: Integrate Constraints into TDD Workflow

**As an** AI coding agent following SAFEWORD.md
**I want to** see constraints mentioned in the TDD workflow
**So that** I don't skip them when creating user stories

**Acceptance Criteria**:

- [✅] SAFEWORD.md workflow step 1 mentions "Technical Constraints"
- [✅] Creating user stories trigger includes "fill in constraints"
- [✅] Edge cases include "user stories missing Technical Constraints"
- [✅] TDD best practices has example with constraints

**Implementation Status**: ✅ Complete
**Tests**: N/A (documentation change)

---

## Summary

**Completed**: 3/3 stories (100%)
**Remaining**: 0/3 stories (0%)

### Phase 1: Core Implementation ✅

- Story 1: Template update
- Story 2: Guide update
- Story 3: Workflow integration

**Next Steps**: User confirmation, then sync framework/SAFEWORD.md to .safeword/SAFEWORD.md
