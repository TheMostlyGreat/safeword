# Feature: Refactoring Skill

**Level:** L2 Feature
**Status:** Draft

## Problem

The TDD enforcer skill has a Phase 3: REFACTOR, but it's only 10 lines:

```markdown
## Phase 3: REFACTOR

**Protocol:**

1. Tests pass before changes
2. Improve code (rename, extract, dedupe)
3. Tests pass after changes
4. Commit if changed: `refactor: [improvement]`

**NOT Allowed:** New behavior, changing assertions, adding tests.
```

This is insufficient because:

1. **No guidance on WHICH refactorings** - "rename, extract, dedupe" covers 3 of 60+ patterns
2. **No safety protocol** - LLMs tend to make large changes, breaking tests
3. **No characterization tests** - Critical for legacy code refactoring
4. **No decision framework** - When to refactor vs. when to stop?
5. **No LLM-specific guardrails** - Research shows LLMs fail at large refactorings

## Scope

### In Scope

- Dedicated skill for systematic refactoring with safety rails
- Small-step discipline (1-10 edits between test runs)
- Characterization test protocol for untested code
- Curated catalog of most useful refactorings (not all 60+)
- LLM-specific anti-patterns and guardrails
- Integration with TDD enforcer (handoff from Phase 3)
- Integration with debugging skill (when refactoring breaks things)

### Out of Scope

- Performance optimization (different skill)
- Architecture migration (too complex for single skill)
- Database refactoring (specialized domain)
- Full Martin Fowler catalog (bloat)

## Design Decisions

### 1. Trigger Strategy

**Decision:** Complement TDD enforcer through distinct trigger terms (no explicit handoff).

Skills are model-invoked based on description matching. No "handoff" mechanism exists.
Good descriptions prevent conflict - let the model pick based on user intent.

- **TDD enforcer triggers:** "implement", "add", "build", "create", "fix", "change", "feature", "bug"
- **Refactoring skill triggers:** "refactor", "clean up", "restructure", "extract", "rename", "simplify", "code smell"

**Overlap is OK** if behavior is consistent (both enforce tests pass before/after).

**NOT a trigger:** "TDD Phase 3 with >10 lines" - unenforceable, removed.

**Style vs structure:** "Clean up" could mean formatting (→ `/lint`) or structure (→ this skill).
Description clarifies: "For structural improvements, NOT style/formatting (use /lint for that)."

### 2. Small Steps as Iron Law

**Decision:** Enforce 1-10 edits between test runs.

Research shows LLMs fail at large refactorings. The skill must enforce:

- ONE refactoring at a time
- Run tests after EVERY change
- Commit after each successful refactoring
- Never batch multiple refactorings

**Revert protocol (if tests fail):**

```bash
git checkout -- <changed-files>
```

Then investigate: Was the refactoring too large? Did it change behavior?
Either try a smaller step, or abandon this refactoring. DO NOT attempt to "fix" a failed refactoring.

### 3. Curated Refactoring Catalog

**Decision:** Include only high-value, low-risk refactorings.

From Martin Fowler's 60+ patterns, select ~15 that are:

- Safe (low risk of breaking behavior)
- Common (used frequently)
- LLM-friendly (can be done in small steps)

**Tier 1 - Always Safe:**

- Rename (function, variable, class)
- Extract Function/Variable
- Inline Function/Variable
- Move Function/Field

**Tier 2 - Safe with Tests:**

- Replace Temp with Query
- Decompose Conditional
- Replace Nested Conditional with Guard Clauses
- Consolidate Conditional Expression
- Replace Magic Literal
- Remove Dead Code

**Tier 3 - Requires Care:**

- Extract Class
- Replace Conditional with Polymorphism
- Introduce Parameter Object
- Replace Loop with Pipeline

### 4. Characterization Tests Protocol

**Decision:** Conditional - only when code lacks tests.

From Michael Feathers' "Working Effectively with Legacy Code":

- Before refactoring untested code, capture current behavior
- Write tests that pass with current implementation
- Then refactor with safety net

**Conditional logic:** If code has tests → skip to REFACTOR. If not → PROTECT phase required.
This keeps the skill useful for both greenfield and legacy code without bloating the happy path.

### 5. Skill Structure & Naming

**Decision:** Single SKILL.md under 300 lines, named `safeword-refactoring`.

The `safeword-` prefix enables reset/upgrade to identify managed skills vs user-created ones.
Simple name (`refactoring`) is clearer than verbose alternatives (`systematic-refactorer`).

**Phases:**

1. **ASSESS** - Determine if refactoring is appropriate (not a feature/bug)
2. **PROTECT** - _Conditional:_ If code lacks tests, add characterization tests. Otherwise skip.
3. **REFACTOR** - One small step at a time
4. **VERIFY** - Run tests, commit if green
5. **ITERATE** - Continue or stop

### 6. Draft Description (for SKILL.md frontmatter)

```yaml
name: refactoring
description: Systematic refactoring with small-step discipline. Use when user says 'refactor', 'clean up', 'restructure', 'extract', 'rename', 'simplify', or 'code smell'. Enforces one change → test → commit cycle. For structural improvements, NOT style/formatting (use /lint). NOT for adding features or fixing bugs.
```

## Success Criteria

1. Skill triggers appropriately (not on every change)
2. Enforces small-step discipline
3. Provides clear refactoring pattern guidance
4. Handles untested code safely
5. Integrates with existing skills
6. Stays under 300 lines (avoid bloat)

## Test Plan

See `.safeword/planning/test-definitions/feature-refactoring-skill.md`

## References

- [Martin Fowler's Refactoring Catalog](https://refactoring.com/catalog/)
- [TDD Red-Green-Refactor](https://www.codecademy.com/article/tdd-red-green-refactor)
- [Working Effectively with Legacy Code](https://understandlegacycode.com/blog/key-points-of-working-effectively-with-legacy-code/)
- [LLM-Driven Code Refactoring Challenges](https://seal-queensu.github.io/publications/pdf/IDE-Jonathan-2025.pdf)
- [Claude Code Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
