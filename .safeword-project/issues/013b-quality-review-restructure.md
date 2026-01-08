---
id: '013b'
title: Phase-aware quality review skill with web research
type: feature
status: ready
priority: medium
created: 2026-01-08
parent: '013'
---

# Phase-Aware Quality Review Skill

## Problem

Current quality review has two issues:

1. **Duplicate skills** - `safeword-quality-reviewer` and `safeword-quality-reviewing` are identical
2. **Not phase-aware** - Skill uses generic review regardless of BDD phase, but hook IS phase-aware

The hook and skill should have consistent phase-aware behavior.

## Current Structure

| Component                   | Lines | Phase-aware? | Web research? |
| --------------------------- | ----- | ------------ | ------------- |
| Hook (`stop-quality.ts`)    | 305   | ✅ Yes       | ❌ No (fast)  |
| Hook lib (`lib/quality.ts`) | 125   | ✅ Yes       | N/A           |
| Skill (x2 duplicates)       | 158   | ❌ No        | ✅ Yes        |
| Command                     | 31    | ❌ No        | Invokes skill |

## Solution

### 1. Delete Duplicate Skill

Keep `safeword-quality-reviewing` (gerund form per skill-authoring-guide), delete `safeword-quality-reviewer`.

### 2. Make Skill Phase-Aware

The skill should detect current phase and apply phase-appropriate deep review WITH web research.

| Phase             | Hook (fast, no web)                          | Skill (deep, web research)                                        |
| ----------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `intake`          | "Edge cases covered? Scope clear?"           | Research similar features in ecosystem, verify scope patterns     |
| `define-behavior` | "Scenarios atomic/observable/deterministic?" | Research testing patterns, verify Given/When/Then best practices  |
| `scenario-gate`   | "Show validation evidence"                   | Verify scenario coverage against industry standards               |
| `decomposition`   | "Show component breakdown"                   | Research architecture patterns, verify test layer strategy        |
| `implement`       | "Correct? Elegant? Bloat-free?"              | **Verify library versions, check deprecated APIs, security scan** |
| `done`            | "Show evidence: tests pass"                  | Verify CI/CD patterns, check release best practices               |

### 3. Compress Skill

Current skill is 158 lines. Most content (sections 1-6) duplicates what the hook already prompts for.

**Keep only the differentiator:** Web research for versions, docs, security (sections 7-8).

Target: ~60-80 lines.

### 4. Skill Structure

```markdown
---
name: quality-reviewing
description: Deep code review with web research. USE WHEN user says 'double check against latest', 'verify versions', 'check security'. Complements automatic quality hook with ecosystem verification.
---

# Quality Reviewing

Deep review with web research. Complements automatic hook.

## Detect Phase

Read current ticket phase from `.safeword-project/issues/`. Apply phase-appropriate review.

## Phase-Specific Web Research

| Phase           | Research Focus                                  |
| --------------- | ----------------------------------------------- |
| intake          | Similar features in ecosystem, scope patterns   |
| define-behavior | Testing patterns, BDD best practices            |
| decomposition   | Architecture patterns, test layer strategy      |
| implement       | **Library versions, deprecated APIs, security** |
| done            | CI/CD patterns, release checklists              |

## Core Protocol (All Phases)

1. **Verify versions** - Search "[library] latest stable version 2026"
2. **Check security** - Search "[library] security vulnerabilities"
3. **Verify docs** - Fetch current documentation, check for deprecated APIs

## Output Format

[Keep existing format - it's good]
```

## Files to Modify

1. DELETE: `.claude/skills/safeword-quality-reviewer/` (duplicate)
2. DELETE: `packages/cli/templates/prompts/quality-review.md` (orphaned, unused)
3. EDIT: `packages/cli/templates/skills/safeword-quality-reviewing/SKILL.md` (compress, add phase detection)
4. EDIT: `packages/cli/templates/commands/quality-review.md` (add phase context)

## Acceptance Criteria

- [ ] Only one quality skill exists (gerund form)
- [ ] Skill detects current BDD phase
- [ ] Skill applies phase-appropriate web research
- [ ] Skill under 100 lines
- [ ] Command invokes skill with phase context
- [ ] Hook unchanged (already working)
