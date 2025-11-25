# SAFEWORD - Claude Code Framework

**Problem**: AI agents write code without tests, skip design validation, and lack consistency across projects.

**Solution**: Portable patterns and guides that enforce TDD workflow, quality standards, and best practices across all your projects.

**Repository**: https://github.com/TheMostlyGreat/safeword (private)

---

## Quick Start (30 seconds)

**1. Install in your project:**
```bash
cd /path/to/your/project
bash ./framework/scripts/setup-safeword.sh
```

**2. Verify installation:**
```bash
# Check for SAFEWORD files and hooks
test -f .safeword/SAFEWORD.md && echo ".safeword/SAFEWORD.md ✓"
test -f .claude/settings.json && echo ".claude/settings.json ✓"
```

**Result**: Your project now has:
- `.safeword/SAFEWORD.md` - Global patterns and workflows
- `.safeword/guides/` - TDD methodology, testing, code philosophy
- `.claude/hooks/` - Auto-linting and quality review
- `SAFEWORD.md` or `CLAUDE.md` - Project context with framework reference

**Commit these to your repo** for team consistency.

---

## How It Works

**Project-local framework**: Scripts write to `.safeword/` and `.claude/` in your project (no global install needed)

**Team consistency**: Teammates get the framework from your project repo (no global install needed)

**Living documentation**: Update guides as you learn, extract learnings from debugging, archive completed work

---

## What's Inside

Key directories created in your project:
- `.safeword/guides/` - Core methodology and best practices
- `.safeword/templates/` - Fillable document structures
- `.safeword/planning/` - Planning documentation (user-stories, test-definitions, design, issues)
- `.claude/hooks/` - Automation scripts

---

## Core Guides

**Purpose**: Reusable methodology applicable to all projects

| Guide | Purpose | When to Read |
|-------|---------|--------------|
| **code-philosophy.md** | Core coding principles, TDD philosophy, self-review checklist | Before writing code |
| **testing-methodology.md** | TDD workflow (RED/GREEN/REFACTOR), test pyramid, decision trees | Starting any feature |
| **tdd-templates.md** | User story + test definition templates and examples | Creating tests/stories |
| **learning-extraction.md** | Extract learnings from debugging, recognition triggers | After complex debugging |

---

## Documentation Guides

**Purpose**: Writing effective feature documentation

| Guide | Purpose | When to Read |
|-------|---------|--------------|
| **user-story-guide.md** | Writing effective user stories (INVEST criteria) | Creating user stories |
| **test-definitions-guide.md** | Writing test definitions (unit/integration/E2E) | Planning test suites |
| **design-doc-guide.md** | Design doc structure and best practices | Designing complex features |
| **architecture-guide.md** | Architecture decisions (tech choices, data models) | Making architectural decisions |
| **data-architecture-guide.md** | Data model design (schemas, validation, flows) | Database/schema design |

---

## Meta Guides

**Purpose**: Working with LLMs and documentation structure

| Guide | Purpose | When to Read |
|-------|---------|--------------|
| **llm-prompting.md** | Prompt engineering, LLM cost optimization, caching | Building AI features |
| **llm-instruction-design.md** | 13 principles for LLM-consumable docs (MECE, examples) | Creating SAFEWORD.md/guides |
| **context-files-guide.md** | CLAUDE.md/CURSOR.md/AGENTS.md structure, anti-patterns, modular approach | Setting up projects |
| **zombie-process-cleanup.md** | Port-based cleanup, multi-project isolation | Managing dev servers |

---

## Templates

**Purpose**: Fillable structures for feature documentation

| Template | Purpose | Used By |
|----------|---------|---------|
| **user-stories-template.md** | User story structure (As a X / Given-When-Then) | user-story-guide.md |
| **test-definitions-feature.md** | Test definition structure (suites, tests, steps) | test-definitions-guide.md |
| **design-doc-template.md** | Design doc structure (architecture, components) | design-doc-guide.md |

---

## Learnings

**Purpose**: Extracted knowledge that compounds across sessions

**Location**: `.safeword/learnings/[concept].md`

**What goes here**:
- Debugging discoveries (non-obvious gotchas, integration struggles)
- Trial-and-error findings (tried 3+ approaches before right one)
- Architecture insights (discovered during implementation)
- Testing traps (tests pass but UX broken, or vice versa)

**How to extract**: Follow `learning-extraction.md` recognition triggers and templates

**Example learnings**:
- React hooks async behavior
- Electron IPC patterns
- Browser storage quota quirks
- E2E test zombie processes
- ProseMirror fragment traversal

---

## Planning

**Purpose**: Feature planning and design documentation

**Structure**:
```
planning/
├── user-stories/       User story documents
├── test-definitions/   Test definition documents
├── design/            Design docs and research
└── issues/            Issue capture and tracking
```

Each directory has an `archive/` subfolder for completed work.

**What goes here**:
- User stories for features
- Test definitions for TDD workflow
- Design documents for complex features
- Research and analysis documents
- Issue tracking and capture

---

## Hooks & Skills

**Hooks**: Automation scripts triggered by Claude Code events
- `auto-quality-review.sh` - Automated quality control on responses

**Skills**: Specialized agent capabilities
- `quality-reviewer/` - Deep code quality review with web research

---

## Advanced Setup

### Custom Installation Options

```bash
cd /path/to/your/project
# SAFEWORD structure + (optionally) Claude Code hooks
bash ./framework/scripts/setup-safeword.sh
# Claude Code hooks only (if SAFEWORD already configured)
bash ./framework/scripts/setup-claude.sh --linting-mode biome
bash ./framework/scripts/setup-claude.sh --skip-linting
```

**Auto-detection**: Automatically detects project type from `package.json`:
- Biome → if `@biomejs/biome` installed
- Next.js → if `next` in dependencies
- Electron → if `electron` in dependencies
- Astro → if `astro` in dependencies
- React → if `react` in dependencies
- TypeScript → if `typescript` in dependencies or `tsconfig.json` exists
- Minimal → otherwise

### Reference Guides in Project SAFEWORD.md

```markdown
# Import guides from .safeword (SAFEWORD.md)
@./.safeword/guides/testing-methodology.md
@./.safeword/guides/code-philosophy.md
@./.safeword/guides/user-story-guide.md
@./.safeword/guides/test-definitions-guide.md
@./.safeword/guides/design-doc-guide.md
```

Claude Code will auto-load these guides as context.

### Check for Existing Learnings

```bash
# Project learnings (this repo)
ls .safeword/learnings/
```

### Extract New Learning

1. Follow recognition triggers in `learning-extraction.md`
2. Create `.safeword/learnings/[concept].md`
3. Use template: Problem → Gotcha → Examples → Testing Trap

### Create Planning Documentation

```bash
# User stories
mkdir -p .safeword/planning/user-stories && touch .safeword/planning/user-stories/feature-name.md
# Test definitions
mkdir -p .safeword/planning/test-definitions && touch .safeword/planning/test-definitions/feature-name.md
# Design docs
mkdir -p .safeword/planning/design && touch .safeword/planning/design/feature-name.md
```


---

## Syncing Across Machines

Commit `.safeword/` and `.claude/` in your project repo for team consistency.

---

## Integration with Project Context

**Project SAFEWORD.md/CLAUDE.md**: Created by `setup-safeword.sh` or manually, references `.safeword/SAFEWORD.md`

**How it works**:
1. Project SAFEWORD.md imports core guides via `@./.safeword/guides/`
2. Guides reference templates via `@./.safeword/templates/`
3. Guides cross-reference each other via `@./.safeword/guides/`
4. Learnings referenced via `ls .safeword/learnings/`

**Result**: Modular, maintainable documentation with clear separation of concerns

---

## Principles

1. **Guides** - Reusable methodology (test pyramid, TDD workflow)
2. **Templates** - Fillable structures (user stories, test definitions)
3. **Learnings** - Extracted knowledge (gotchas, discoveries)
4. **Planning** - Feature planning and design (user stories, test definitions, design docs)
5. **Hooks/Skills** - Automation and specialized capabilities

**Living Documentation**: Update as you learn, archive completed work, consolidate when needed

**Cross-Agent Compatible**: Works with Claude Code, Cursor, and other AI coding agents

---

## Getting Help

- **Claude Code docs**: https://docs.claude.com/en/docs/claude-code
- **Issues**: https://github.com/anthropics/claude-code/issues
- **This repo**: https://github.com/TheMostlyGreat/safeword (private)
