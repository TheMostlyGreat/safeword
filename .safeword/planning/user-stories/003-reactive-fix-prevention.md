# User Stories: Reactive Fix Prevention

**Guide**: `@./.safeword/guides/user-story-guide.md` - Best practices, INVEST criteria, and examples
**Template**: `@./.safeword/templates/user-stories-template.md`

**Feature**: Prevent AI agents from falling into reactive "error-fix-error" loops

**Related Issue**: Ticket #003
**Status**: ❌ Not Started (0/5 stories complete)

---

## Story 1: Mandatory Architecture Context Loading

**As a** developer using an AI coding agent
**I want** the agent to load ARCHITECTURE.md before attempting any fix
**So that** fixes respect the system's layers and boundaries

**Acceptance Criteria**:

- [ ] Agent reads ARCHITECTURE.md (if exists) before proposing any error fix
- [ ] Agent identifies which layer the error occurs in
- [ ] Agent notes which layers the fix might affect
- [ ] If no ARCHITECTURE.md exists, agent proceeds with extra caution on multi-file changes

**Implementation Status**: ❌ Not Started
**Tests**: N/A (guidance-only, no automated tests)

**Notes**: Add to SAFEWORD.md "Before ANY Error Fix" section

---

## Story 2: Reactive Fix Detection

**As a** developer using an AI coding agent
**I want** the agent to STOP after 2 failed fix attempts and use systematic-debugging
**So that** the agent doesn't continue guessing and creating new problems

**Acceptance Criteria**:

- [ ] After 1st failed fix, agent notes "2nd attempt—consider systematic-debugging"
- [ ] After 2nd failed fix, agent MUST stop and invoke systematic-debugging skill
- [ ] Agent completes Phase 1 (Root Cause Investigation) before any further fixes
- [ ] Agent documents findings before proceeding

**Implementation Status**: ❌ Not Started
**Tests**: N/A (guidance-only)

**Notes**: Aligns with existing systematic-debugging "3+ fixes" rule—this makes it stricter (2 fixes)

---

## Story 3: Blast Radius Awareness

**As a** developer using an AI coding agent
**I want** the agent to pause and ask before changes affecting 4+ files
**So that** sweeping changes don't violate architectural boundaries

**Acceptance Criteria**:

- [ ] Before modifying 4+ files, agent stops and summarizes proposed changes
- [ ] Agent explains why this many files need changing
- [ ] Agent asks: "This affects N files across [layers]. Proceed?"
- [ ] If approved, agent makes atomic commits after each file

**Implementation Status**: ❌ Not Started
**Tests**: N/A (guidance-only)

---

## Story 4: Fix Cascade Detection

**As a** developer using an AI coding agent
**I want** the agent to recognize when fixes are cascading across files
**So that** architectural problems are caught early instead of chased endlessly

**Acceptance Criteria**:

- [ ] When fix A reveals problem B in different file, agent notes the cascade
- [ ] When fix B reveals problem C in yet another file, agent MUST stop
- [ ] Agent documents: "Fixes cascading across files—possible architectural issue"
- [ ] Agent discusses with user before continuing

**Implementation Status**: ❌ Not Started
**Tests**: N/A (guidance-only)

**Notes**: This is the core "error-fix-error" pattern we're trying to break

---

## Story 5: Workaround Flagging

**As a** developer using an AI coding agent
**I want** workarounds to be explicitly flagged
**So that** workarounds are conscious decisions, not hidden debt

**Acceptance Criteria**:

- [ ] When adding code that works around a problem (catch-ignore, special case, duplication, setTimeout), agent flags it
- [ ] Agent adds comment: `// WORKAROUND: [reason] - TODO: [proper fix]`
- [ ] Agent tells user: "Adding workaround for [X]. Proper fix would be [Y]."
- [ ] Agent asks if workaround is acceptable

**Implementation Status**: ❌ Not Started
**Tests**: N/A (guidance-only)

---

## Summary

**Completed**: 0/5 stories (0%)
**Remaining**: 5/5 stories (100%)

### Phase 1: Core Prevention ❌

- Story 2: Reactive Fix Detection (P0)
- Story 4: Fix Cascade Detection (P0)

### Phase 2: Context & Awareness ❌

- Story 1: Architecture Context Loading (P1)
- Story 3: Blast Radius Awareness (P1)

### Phase 3: Debt Visibility ❌

- Story 5: Workaround Flagging (P2)

**Next Steps**:

1. Draft "Before ANY Error Fix" section for SAFEWORD.md
2. Draft "Red Flags (Stop and Think)" section for SAFEWORD.md
3. Update systematic-debugging skill with architecture context loading
