# Project Structure Cleanup Plan

**Date:** 2025-11-28
**Status:** Planning

---

## Problem Statement

The project has significant duplication and organizational confusion:
1. `framework/` and `.safeword/` contain nearly identical content
2. Multiple SAFEWORD.md files (root, framework/, .safeword/)
3. Planning/tickets scattered across `.agents/`, `.safeword/`, `planning/`, `docs/`
4. Duplicate `learnings/` directories
5. Test artifacts in root directory

---

## Proposed Changes

### 1. Clarify framework/ vs .safeword/ Purpose

**Decision:**
- `framework/` = Source templates bundled by CLI for distribution
- `.safeword/` = Generated instance (created by `npx safeword setup`)
- This repo is the safeword source, so `.safeword/` should NOT exist here (it's for target projects)

**Action:** Delete `.safeword/` directory entirely. The CLI reads from `packages/cli/templates/` or `framework/`.

### 2. Remove Root SAFEWORD.md

**Current state:**
- `SAFEWORD.md` (root) - 542 bytes, stub
- `framework/SAFEWORD.md` - 31KB, full content

**Action:** Delete root `SAFEWORD.md`. Update `CLAUDE.md` to point to `framework/SAFEWORD.md`.

### 3. Consolidate Planning Directories

**Current state:**
- `.safeword/planning/` - AI working docs (12 files)
- `.safeword/tickets/` - Tickets (11 files)
- `.safeword/planning/` - Planning docs
- `.safeword/tickets/` - Tickets
- `planning/` - Various planning docs (9 files)
- `docs/` - Implementation plans (2 files)

**Action:**
- Keep `.agents/` for AI working space (gitignored, ephemeral)
- Move `planning/` contents to `docs/planning/`
- Delete `.safeword/planning/` and `.safeword/tickets/` (duplicates)

### 4. Consolidate learnings/

**Current state:**
- `learnings/` (root) - 4 files
- `.safeword/learnings/` - likely empty or duplicate

**Action:** Keep root `learnings/`, delete `.safeword/learnings/`.

### 5. Organize Test/Eval Files

**Current state:**
- `promptfoo.yaml` (127KB) - test setup
- `eval-results.json` (958KB) - test artifact

**Action:**
- Create `evals/` directory
- Move `promptfoo.yaml` to `evals/promptfoo.yaml`
- Add `eval-results.json` to `.gitignore`
- Update `package.json` scripts to use new path

---

## Files Requiring Path Updates

### Scripts to Check

1. `.claude/hooks/auto-quality-review.sh` - references `.safeword/`?
2. `.claude/hooks/run-quality-review.sh` - references prompts?
3. `.safeword/scripts/arch-review.sh` - references `.safeword/prompts/`
4. `framework/scripts/*.sh` - check all paths
5. `packages/cli/src/**/*.ts` - check template paths

### Markdown Files to Check

1. `CLAUDE.md` - points to `.safeword/SAFEWORD.md`
2. `AGENTS.md` - may reference `.safeword/`
3. `README.md` - may reference paths
4. `framework/README.md` - internal references
5. `packages/cli/ARCHITECTURE.md` - references to planning docs

---

## New Structure (After Cleanup)

```
safeword/
├── packages/cli/           # CLI source code
│   ├── src/
│   ├── templates/          # Bundled templates
│   ├── tests/
│   └── ARCHITECTURE.md
├── framework/              # Source templates & guides
│   ├── guides/
│   ├── prompts/
│   ├── templates/
│   ├── scripts/
│   ├── skills/
│   ├── mcp/
│   └── SAFEWORD.md
├── docs/                   # Project documentation
│   ├── planning/           # (moved from planning/)
│   └── *.md
├── evals/                  # LLM evaluation setup
│   └── promptfoo.yaml
├── learnings/              # Extracted learnings
├── .agents/                # AI working space (gitignored)
├── .claude/                # Claude Code config (tracked)
│   ├── commands/
│   ├── hooks/
│   ├── skills/
│   └── settings.json
├── CLAUDE.md               # Points to framework/SAFEWORD.md
├── AGENTS.md
├── README.md
└── package.json
```

---

## Execution Order

1. Update `.gitignore` first (add eval-results.json, .agents/)
2. Delete `.safeword/` directory
3. Delete root `SAFEWORD.md`
4. Move `planning/` to `docs/planning/`
5. Create `evals/` and move `promptfoo.yaml`
6. Update `CLAUDE.md` path reference
7. Update `package.json` eval scripts
8. Verify all script paths
9. Verify all markdown link paths
10. Test CLI still works

---

## Rollback Plan

If issues arise:
```bash
git checkout -- .
```

All changes should be in a single commit for easy revert.
