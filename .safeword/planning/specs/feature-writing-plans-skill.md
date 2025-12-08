# Feature Spec: writing-plans Skill

**Guide**: `.safeword/guides/planning-guide.md`
**Template**: `.safeword/templates/feature-spec-template.md`

**Feature**: Add a `safeword-writing-plans` skill that converts specs into detailed execution plans for LLM agents

**Status**: ✅ Complete (2/2 stories complete)

---

## Decisions

| Question                        | Decision                               | Rationale                                                                  |
| ------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Target audience                 | LLM agent (subagent/fresh session)     | Plans are for autonomous execution                                         |
| Relationship to existing skills | Separate skill with handoff            | brainstorming → spec → writing-plans → plan → enforcing-tdd                |
| Output granularity              | Exact (paths, code, commands)          | LLMs need explicit instructions; verification gates require exact commands |
| Plan template                   | Inline in skill (no separate template) | YAGNI - extract later if needed                                            |

---

## Technical Constraints

### Compatibility

- [ ] Claude Code skill format (YAML frontmatter)
- [ ] Cursor rule parity (`.mdc` format)
- [ ] Schema registration in `packages/cli/src/schema.ts`

### Dependencies

- [ ] Must reference existing templates: feature-spec, task-spec
- [ ] Must hand off to enforcing-tdd skill for execution
- [ ] Plan output location: `.safeword/planning/plans/`

---

## Story 1: Create writing-plans skill

**As a** safeword user
**I want to** invoke a writing-plans skill
**So that** Claude generates detailed execution plans from my specs

**Acceptance Criteria**:

- [ ] Skill at `packages/cli/templates/skills/safeword-writing-plans/SKILL.md`
- [ ] Cursor rule at `packages/cli/templates/cursor/rules/safeword-writing-plans.mdc`
- [ ] YAML frontmatter: name, description (with triggers), allowed-tools: '\*'
- [ ] Phases: CONTEXT → DECOMPOSE → DETAIL → SAVE → HANDOFF
- [ ] Plan format defined inline (header, tasks with files/code/verification)
- [ ] Saves to `.safeword/planning/plans/{slug}.md`

**Implementation Status**: ✅ Complete
**Tests**: `packages/cli/tests/schema.test.ts` (parity tests)

---

## Story 2: Register in schema

**As a** CLI maintainer
**I want** writing-plans in the schema
**So that** it installs correctly via `npx safeword setup/upgrade`

**Acceptance Criteria**:

- [ ] Added to `ownedFiles` in `packages/cli/src/schema.ts`
- [ ] Plans directory `.safeword/planning/plans/` added to `ownedDirs`
- [ ] Parity test passes (Claude skill ≈ Cursor rule)

**Implementation Status**: ✅ Complete
**Tests**: `packages/cli/tests/schema.test.ts`

---

## Out of Scope

- Subagent dispatch logic (future: executing-plans skill)
- Plan execution tracking/checkpoints
- Plan diffing or updating existing plans
- Separate plan template file

---

## Summary

**Completed**: 2/2 stories (100%)

**Next Steps**: Run `npx safeword upgrade` to install to local project, then test the skill
