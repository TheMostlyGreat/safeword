---
id: 017
type: epic
phase: intake
status: ready
created: 2026-01-10T20:00:00Z
last_modified: 2026-01-10T20:31:00Z
children: ['017a', '017b', '017c', '017d']
---

# Continuous Quality Monitoring for Long-Running Agent Sessions

**User Story:** When I run `/bdd` for a complex feature, the agent may implement for 30+ minutes without stopping. I want quality checks to happen during that time so I don't discover a pile of compounding errors at the end.

**Goal:** Ensure quality checks happen at appropriate intervals during long BDD runs, not just when the agent stops for user input.

**Why:** As BDD automation matures, agents run longer without human intervention. The Stop hook (which triggers quality review) fires only when waiting for user input. In a 30-minute implement phase, quality issues can accumulate unchecked.

## The Problem

**Current quality check timing:**

| Hook        | When It Fires        | What It Checks      |
| ----------- | -------------------- | ------------------- |
| PostToolUse | Every file edit      | Linting only        |
| Stop        | Agent waits for user | Full quality review |

**BDD phases and typical duration:**

| Phase           | Duration    | Human Gate?        | Quality Review? |
| --------------- | ----------- | ------------------ | --------------- |
| intake          | 5-10 min    | Yes (questions)    | Stop hook fires |
| define-behavior | 10-15 min   | No                 | May not fire    |
| scenario-gate   | 2-5 min     | **Yes (approval)** | Stop hook fires |
| decomposition   | 5-10 min    | No                 | May not fire    |
| implement       | **30+ min** | No                 | **Gap!**        |
| done            | 5 min       | Yes (verification) | Stop hook fires |

**The gap:** Implement phase can run 30+ minutes without quality review. Agent may:

- Accumulate technical debt
- Drift from spec/scenarios
- Make compounding errors
- Miss better approaches

## Research Summary

### Claude Code Hook Capabilities

1. **SubagentStop**: Fires when subagents complete (could use for phase transitions)
2. **Prompt-based hooks**: LLM (Haiku) evaluates context for decisions
3. **PostToolUse**: Already fires on every edit (currently only lints)
4. **No periodic hook**: No built-in timer or "every N calls" trigger

### Cursor Capabilities

1. **stop hook**: Has `followup_message` for auto-continuation (up to 5x)
2. **afterFileEdit**: Equivalent to PostToolUse
3. **No periodic hook**: Same limitation as Claude Code

### Industry Patterns

1. **Code review research**: 200-400 LOC per review session is optimal
2. **Beyond 400 LOC**: Reviewers skim instead of understanding
3. **Teams with <400 LOC reviews**: 40% fewer production defects
4. **Checkpoint systems**: Save state for rollback (Claude Code `/rewind`)
5. **Context rot**: Quality degrades as context grows longer

Sources:

- [Code Review Best Practices - 200-400 LOC optimal](https://www.qodo.ai/blog/code-review-best-practices/)
- [QA trends for 2026: AI, agents, and the future of testing](https://www.tricentis.com/blog/qa-trends-ai-agentic-testing)
- [Validating multi-agent AI systems](https://www.pwc.com/us/en/services/audit-assurance/library/validating-multi-agent-ai-systems.html)

## Solution: Multi-Layer Quality Monitoring

Four complementary mechanisms, each a separate ticket:

| Layer | Ticket | What It Does                          | Priority |
| ----- | ------ | ------------------------------------- | -------- |
| 1     | 017a   | LOC-based thresholds in PostToolUse   | High     |
| 2     | 017b   | Phase transition quality gates        | Medium   |
| 3     | 017c   | Git-anchored checkpoints for rollback | Medium   |
| 4     | 017d   | Prompt-based smart review (opt-in)    | Low      |

### Why This Layering

- **Layer 1 is the core solution** - Deterministic, no LLM cost, works in both IDEs
- **Layer 2 catches phase boundaries** - Natural review points in BDD workflow
- **Layer 3 enables recovery** - When quality issues are found, easy rollback
- **Layer 4 is optional intelligence** - For teams wanting deeper analysis

## Design Decisions

| Decision          | Choice               | Rationale                                |
| ----------------- | -------------------- | ---------------------------------------- |
| Primary metric    | Lines of code        | Industry-validated (200-400 LOC optimal) |
| Primary mechanism | Threshold-based      | Deterministic, no LLM cost, predictable  |
| Threshold trigger | PostToolUse          | Already fires on every edit              |
| State location    | `.safeword-project/` | Survives `safeword upgrade`              |
| Checkpoint format | Git-anchored summary | Don't duplicate what git does            |
| Smart review      | Opt-in               | Cost negligible but adds latency         |

## Existing Infrastructure

Already implemented (can be leveraged):

- `post-tool-lint.ts` - PostToolUse hook for linting
- `stop-quality.ts` - Phase-aware quality review (Claude Code)
- `cursor/stop.ts` - Quality review (Cursor) - **needs phase-awareness fix**
- `lib/quality.ts` - Phase-specific quality messages

## Success Criteria

- [ ] Quality gaps in 30+ minute implement phases eliminated
- [ ] Works in both Claude Code and Cursor
- [ ] No noticeable latency impact (<100ms per hook)
- [ ] Recovery possible when quality issues found
- [ ] All subtickets completed

## Work Log

---

- 2026-01-10T20:31:00Z Added: User stories to epic and all subtickets for /bdd context
- 2026-01-10T20:23:00Z Refactored: Converted to epic with 4 focused subtickets
- 2026-01-10T20:08:00Z Refined: LOC-based thresholds (200/400), git-anchored checkpoints, Haiku cost analysis
- 2026-01-10T20:00:00Z Created: Research complete, multi-layer solution designed

---
