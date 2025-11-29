---
id: 007
status: pending
created: 2025-11-27
github: https://github.com/TheMostlyGreat/safeword/issues/3
---

# Flesh Out Questioning System

**Goal:** Improve the `ask_questions` functionality in quality review to be more strategic and useful.

**Why:** Current questioning is binary (on/off). Needs guidance on _what_ questions to ask and _when_.

## Current State

- `.auto-quality-review.config` has `ask_questions=true|false`
- Quality review prompt says "Ask me any non-obvious questions..."
- No guidance on question types, timing, or prioritization

## Scope

**Improvements:**

1. **Question taxonomy** - Types of questions (clarification, confirmation, scope, edge cases)
2. **Question triggers** - When to ask vs assume
3. **Question format** - How to phrase actionable questions
4. **Question limits** - Max questions per review (avoid question fatigue)

**Deliverables:**

- Questioning guide in `framework/guides/questioning-guide.md`
- Update quality-reviewer SKILL.md with questioning protocol
- Update quality review prompts

## Acceptance Criteria

- [ ] Guide defines question types with examples
- [ ] Clear triggers for when to ask
- [ ] Limit guidance (e.g., "max 2-3 questions per review")
- [ ] Quality reviewer SKILL.md references new guide

## Work Log

- 2025-11-27 Created ticket
