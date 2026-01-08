---
id: '013'
title: Restructure BDD skill for LLM optimization
type: feature
status: ready
priority: medium
created: 2026-01-08
---

# Restructure BDD Skill for LLM Optimization

## Problem

The BDD skill is 630 lines—too large for optimal LLM performance:

- Models perform best at 10-64k tokens, not their advertised 200k
- "Lost in the middle" phenomenon: <40% recall for middle content vs >80% for start/end
- Stay at 70-80% of context window capacity
- Cursor recommends rules under 100 lines each

## Research Findings

### Cursor Platform Status

| Feature                    | Status                    | Source                                                                                                                                   |
| -------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `@file` references in .mdc | ❌ Broken since Sept 2025 | [Forum](https://forum.cursor.com/t/why-file-is-not-working-in-mdc-files-anymore/133693)                                                  |
| Folder-based RULE.md       | ❌ Broken                 | [Forum](https://forum.cursor.com/t/project-rules-documented-rule-md-folder-format-not-working-only-undocumented-mdc-format-works/145907) |
| Flat .mdc files            | ✅ Works                  | Current standard                                                                                                                         |
| Agent-requested rules      | ✅ Works                  | Use `description:` field for loading                                                                                                     |
| Nested directories         | ❌ Broken                 | Rules must be in root `.cursor/rules/`                                                                                                   |

### Reliable Rule/Skill Loading

| Pattern                 | Activation Rate |
| ----------------------- | --------------- |
| Generic descriptions    | ~20%            |
| USE WHEN prefix         | High            |
| WHEN + WHEN NOT in body | 80-84%          |
| Trigger-rich language   | High            |

**Key insight:** Description is the gatekeeper. Include explicit "USE WHEN [phase condition]" and trigger phrases that match user queries.

### LLM Research

- **Anthropic:** Just-in-time loading, few-shot examples > extensive rules
- **Chroma:** Performance cliff at 70-80% context, lost-in-middle effect
- **JetBrains NeurIPS 2025:** Simple masking halves cost while matching summarization performance

## Solution: Phase-Based File Structure

Split the monolithic 630-line skill into focused, phase-specific files that load on demand.

### Claude Code Structure

```
.claude/skills/safeword-bdd-orchestrating/
└── SKILL.md (~475 lines, compressed single file)
```

Claude Code handles multi-file less gracefully, so keep as single compressed file.

### Cursor Structure (Progressive Disclosure)

```
.cursor/rules/
├── bdd-core.mdc          (~90 lines)  - Dispatch, phases, resume, WHEN to split table
├── bdd-discovery.mdc     (~50 lines)  - Phase 0-2
├── bdd-scenarios.mdc     (~40 lines)  - Phase 3-4
├── bdd-decomposition.mdc (~35 lines)  - Phase 5
├── bdd-tdd.mdc           (~70 lines)  - Phase 6
├── bdd-done.mdc          (~30 lines)  - Phase 7
└── bdd-splitting.mdc     (~40 lines)  - HOW to split (protocol, examples)
```

All files under 100 lines. Agent loads phase-specific rules based on descriptions.

### Description Patterns for Reliable Loading

| File                    | Description                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `bdd-core.mdc`          | "USE WHEN starting feature work, running /bdd, or resuming a BDD ticket. Orchestrates BDD phases."      |
| `bdd-discovery.mdc`     | "USE WHEN in BDD intake phase OR ticket has phase: intake. Guides discovery and context gathering."     |
| `bdd-scenarios.mdc`     | "USE WHEN in BDD define-behavior or scenario-gate phase. Guides Given/When/Then creation."              |
| `bdd-decomposition.mdc` | "USE WHEN in BDD decomposition phase. Guides task breakdown and component analysis."                    |
| `bdd-tdd.mdc`           | "USE WHEN in BDD implement phase. RED/GREEN/REFACTOR cycle with verification gates."                    |
| `bdd-done.mdc`          | "USE WHEN in BDD done phase OR all scenarios marked [x]. Completion checklist."                         |
| `bdd-splitting.mdc`     | "USE WHEN BDD thresholds exceeded (2+ stories, >15 scenarios, >20 tasks). Split protocol and examples." |

### Core File Contents (~90 lines)

The core file includes:

- Iron Law
- Phase tracking table with "Load Rule" column
- Resume logic
- Dispatch flow
- Phase 6 TDD essentials (Iron Laws, Verification Gate, Red Flags)
- Phase 7 Done Gate checklist
- Error Recovery table
- When to Split table (triggers only, not full protocol)
- Key Takeaways

Phase 6/7 essentials are inline because they're the most common phases.

### Deep Files Contents

**bdd-discovery.mdc (~50 lines):**

- Context check flow
- Discovery rounds (5 PM-style question categories)
- Max 5 rounds rule

**bdd-scenarios.mdc (~40 lines):**

- Given/When/Then drafting
- Validation criteria (atomic, observable, deterministic)
- Red flags table

**bdd-decomposition.mdc (~35 lines):**

- Component identification
- Test layer assignment (E2E → integration → unit)
- Dependency ordering

**bdd-tdd.mdc (~70 lines):**

- Outside-in test layering
- Walking skeleton
- Anti-pattern code example
- Detailed RED/GREEN/REFACTOR

**bdd-done.mdc (~30 lines):**

- Full checklist
- Flake detection (run 3x)
- Cross-scenario refactoring
- Parent epic update

**bdd-splitting.mdc (~40 lines):**

- Split protocol (new ticket vs promote)
- Restart points table
- Epic vs Feature examples
- Ticket structure diagram

## Implementation Steps

1. **Create bdd-core.mdc** - Core dispatch with TDD essentials inline
2. **Create phase files** - Extract content from SKILL.md into 6 phase-specific files
3. **Add WHEN/WHEN NOT sections** - In body of each file for 80%+ activation
4. **Compress Claude Code SKILL.md** - Single file ~475 lines
5. **Test activation** - Verify rules load at correct phases
6. **Update schema.ts** - Register new Cursor rule files

## Expected Outcome

### Cursor

| Metric           | Before        | After                   |
| ---------------- | ------------- | ----------------------- |
| Files            | 1 (628 lines) | 7 (all under 100 lines) |
| Tokens per phase | ~600 lines    | ~90-160 lines           |
| Under 100 lines  | ❌            | ✅ All files            |

### Claude Code

| Metric          | Before | After |
| --------------- | ------ | ----- |
| Total lines     | 630    | ~475  |
| Under 500 lines | ❌     | ✅    |

## Files to Create/Modify

### New Cursor Files

1. `.cursor/rules/bdd-core.mdc`
2. `.cursor/rules/bdd-discovery.mdc`
3. `.cursor/rules/bdd-scenarios.mdc`
4. `.cursor/rules/bdd-decomposition.mdc`
5. `.cursor/rules/bdd-tdd.mdc`
6. `.cursor/rules/bdd-done.mdc`
7. `.cursor/rules/bdd-splitting.mdc`

### Modify

1. `packages/cli/templates/skills/safeword-bdd-orchestrating/SKILL.md` (compress)
2. `packages/cli/templates/cursor/rules/safeword-bdd-orchestrating.mdc` (delete, replace with above)
3. `packages/cli/src/schema.ts` (register new files)

## Deferred (Separate Tickets)

1. **Single-source build** - Generate Cursor files from SKILL.md sections
2. **Cursor @file fix** - Revisit when Cursor fixes @file references
