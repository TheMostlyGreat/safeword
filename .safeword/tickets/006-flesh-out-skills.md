---
id: 006
status: pending
created: 2025-11-27
github: https://github.com/TheMostlyGreat/safeword/issues/2
---

# Flesh Out Framework Skills

**Goal:** Expand `framework/skills/` with high-value skills from examples/superpowers.

**Why:** Only `quality-reviewer` exists in framework. Superpowers has 20+ battle-tested skills ready to port.

## Scope

**Priority skills to port:**

| Skill                            | Value                          | Complexity |
| -------------------------------- | ------------------------------ | ---------- |
| `systematic-debugging`           | Prevents fix-by-guessing loops | Medium     |
| `test-driven-development`        | Core TDD workflow              | Low        |
| `verification-before-completion` | Prevents incomplete work       | Low        |
| `root-cause-tracing`             | Debug methodology              | Medium     |
| `writing-plans`                  | Planning discipline            | Low        |
| `executing-plans`                | Plan execution                 | Low        |
| `brainstorming`                  | Creative problem solving       | Low        |

**Out of scope:**

- Agent-specific skills (dispatching-parallel-agents, subagent-driven-development)
- Git workflow skills (using-git-worktrees, finishing-a-development-branch)
- Meta skills (writing-skills, sharing-skills)

## Acceptance Criteria

- [ ] 5+ skills ported to framework/skills/
- [ ] Each skill has SKILL.md with clear triggers and protocol
- [ ] Skills work standalone (no superpowers dependency)
- [ ] README updated with skills section

## Work Log

- 2025-11-27 Created ticket
