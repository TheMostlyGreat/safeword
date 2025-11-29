# Research: Reactive Fix Prevention

**Created:** 2025-11-27  
**Status:** Complete  
**Ticket:** 003-reactive-fix-prevention

---

## Problem Statement

AI coding agents fall into "error-fix-error" loops:

1. See error → attempt fix
2. Fix creates new error → attempt another fix
3. Repeat until codebase is tangled

This pattern ignores:

- Root cause analysis
- Architectural boundaries
- Broader system implications

## Research Sources

### 1. MASAI Framework (arxiv.org/abs/2406.11638)

**Key finding:** Modular sub-agents with well-defined objectives outperform monolithic agents.

**Relevance:** Instead of one agent that does everything, specialized agents (planner, implementer, reviewer) prevent reactive thrashing.

**Application:** Force planning phase before implementation phase.

### 2. ProSEA Framework (arxiv.org/abs/2510.07423)

**Key finding:** Manager Agent orchestrates Expert Agents. Failed attempts report back with "structured feedback" including constraints discovered.

**Relevance:** When a fix fails, the agent should learn WHY and carry that constraint forward—not just try another random fix.

**Application:** After any fix attempt, agent must document what was learned before retrying.

### 3. Factored Agents (arxiv.org/abs/2503.22931)

**Key finding:** Separating in-context learning (planning) from memorization (execution) improves accuracy.

**Relevance:** Agents that plan separately from executing make better architectural decisions.

**Application:** Explicit "planning mode" before "execution mode."

### 4. DEV.to Article (vuong_ngo)

**Key finding:** "AI Keeps Breaking Your Architectural Patterns. Documentation Won't Fix It."

**Relevance:** Long AGENTS.md files are insufficient. Agents need:

- Active validation mechanisms
- Enforcement gates
- Context retrieval at decision points

**Application:** Pre-commit hooks, session-level triggers, mandatory context loading.

---

## Synthesis

| Problem               | Root Cause                   | Solution                                                |
| --------------------- | ---------------------------- | ------------------------------------------------------- |
| Reactive fixing       | No planning phase            | Mandatory "understand first" before any fix             |
| Ignoring architecture | Docs loaded once, forgotten  | Force ARCHITECTURE.md reload at decision points         |
| Cascading fixes       | No threshold/circuit breaker | "3+ fixes = STOP" rule (exists in systematic-debugging) |
| Multi-file changes    | No blast radius awareness    | Approval gate for >3 file changes                       |

---

## Recommended Additions to SAFEWORD

### 1. Before ANY Error Fix (Mandatory)

```markdown
## Before ANY Error Fix (CRITICAL)

BEFORE attempting to fix any error:

1. **Load Context** - Read relevant ARCHITECTURE.md sections
2. **Ask "Why Here?"** - Is this error a symptom of a deeper issue?
3. **Check Pattern** - Does the fix match existing patterns, or introduce a new one?
4. **Consider Blast Radius** - What else touches this code?

If you've made 2+ fix attempts → STOP. Use systematic-debugging skill.
If fix would change >3 files → STOP. Get approval first.
```

### 2. Red Flags (Stop and Think)

```markdown
## Red Flags (Stop and Think)

If you catch yourself:

- Fixing an error you just created
- Changing the same file 3+ times in one session
- Adding workarounds instead of understanding root cause
- "Just trying" something without hypothesis
- Fixing in multiple layers for "one" issue

→ STOP. Read ARCHITECTURE.md. Use systematic-debugging.
```

### 3. Validation Triggers

| Trigger                 | Action                         |
| ----------------------- | ------------------------------ |
| 2+ fix attempts         | Stop, use systematic-debugging |
| 3+ changes to same file | Stop, investigate root cause   |
| 5+ files changed        | Run architecture review        |
| Fix touches 3+ layers   | Get explicit approval          |

---

## Integration Points

| Existing Asset              | How to Integrate                      |
| --------------------------- | ------------------------------------- |
| SAFEWORD.md                 | Add "Before ANY Error Fix" section    |
| code-philosophy.md          | Add "Reactive Fix Prevention" section |
| systematic-debugging skill  | Add architecture context loading step |
| arch-review.sh (ticket 002) | Use as validation gate                |

---

## Next Steps

1. ✅ User stories created (`.safeword/planning/user-stories/003-reactive-fix-prevention.md`)
2. Draft SAFEWORD.md additions (Stories 1-4)
3. Update systematic-debugging skill with architecture context loading
4. Session-level change counting (deferred—out of scope for ticket 003)
