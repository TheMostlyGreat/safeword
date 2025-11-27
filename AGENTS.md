**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**

The SAFEWORD.md file contains core development patterns, workflows, and conventions.
Read it BEFORE working on any task in this project.

---

# SAFEWORD - Claude Code Framework

A portable framework that enforces TDD workflow, quality standards, and best practices for AI coding agents.

## Project Purpose

**Problem:** AI agents write code without tests, skip design validation, and lack consistency across projects.

**Solution:** Guides, templates, and hooks that get copied into any project via `setup-safeword.sh`.

## Tech Stack

- **Bash** - Setup scripts and hooks (`framework/scripts/`)
- **promptfoo** - LLM evaluation testing (143 test cases)
- **ESLint + Prettier** - Code quality

## Project Structure

```
safeword/
├── framework/              # CANONICAL SOURCE - All guides, templates, scripts
│   ├── SAFEWORD.md         # Master patterns file (copied to projects)
│   ├── guides/             # 13 methodology guides
│   ├── templates/          # Doc templates (user stories, tests, tickets)
│   ├── scripts/            # Setup scripts (setup-safeword.sh, etc.)
│   ├── prompts/            # Quality review prompts
│   └── skills/             # Agent skills (quality-reviewer)
│
├── examples/superpowers/   # REFERENCE - Example skills and agents
│
├── learnings/              # EXTRACTED KNOWLEDGE - Debugging discoveries
│
├── planning/               # PROJECT PLANNING - This repo's feature planning
│
├── .agents/                # ACTIVE WORK - Tickets and planning for this repo
│   ├── tickets/            # Current work items
│   └── planning/           # User stories, designs for active tickets
│
└── promptfoo.yaml          # LLM EVALS - 143 test cases validating guides
```

## Key Files

| File | Purpose |
|------|---------|
| `framework/SAFEWORD.md` | Master patterns (canonical source) |
| `.safeword/SAFEWORD.md` | Local copy for this project |
| `promptfoo.yaml` | LLM eval test definitions |

## Development Workflow

### Making Changes to Guides

1. Edit in `framework/guides/` (canonical source)
2. Run evals: `npm run eval`
3. Copy to `.safeword/guides/` for this project

### Making Changes to SAFEWORD.md

1. Edit `framework/SAFEWORD.md` (canonical source)
2. Copy to `.safeword/SAFEWORD.md`

### Running LLM Evals

```bash
npm run eval           # Run all 143 tests
npm run eval:no-cache  # Fresh API calls (no cache)
npm run eval:view      # Open web UI for results
```

**Requires:** `ANTHROPIC_API_KEY` environment variable

## Architecture Decisions

### Two Copies of SAFEWORD.md

**Decision:** Maintain SAFEWORD.md in two locations
**Why:** Canonical source separate from local dev copy
**Trade-off:** Manual sync required, but keeps framework clean

| Location | Purpose |
|----------|---------|
| `framework/SAFEWORD.md` | Canonical source, edit here first |
| `.safeword/SAFEWORD.md` | Local copy for developing this repo |

### LLM Evals with promptfoo

**Decision:** Use promptfoo for guide validation
**Why:** Ensures guides are effective for LLM consumption, catches regressions
**Trade-off:** Requires API calls (costs money), but validates quality

### Bash Scripts for Setup

**Decision:** Use bash scripts for setup
**Why:** Zero dependencies, works without npm, portable
**Trade-off:** Less cross-platform, but simpler for Unix users

## Common Gotchas

1. **Two SAFEWORD.md files:** Always edit `framework/SAFEWORD.md` first, then sync to `.safeword/`.

2. **Eval failures:** If evals fail, the guide may need clearer instructions, not the test.

3. **`.agents/` vs `planning/`:** `.agents/` is for active development of this repo. `planning/` contains older planning docs.

## File Organization

| Dir | Purpose |
|-----|---------|
| `framework/guides/` | Methodology guides (TDD, testing, architecture) |
| `framework/templates/` | Fillable doc structures |
| `framework/scripts/` | Setup and hook scripts |
| `learnings/` | Extracted debugging knowledge |
| `.agents/tickets/` | Active work items for this repo |
