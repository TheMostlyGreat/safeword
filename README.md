# SAFEWORD - Claude Code Framework

**Problem**: AI agents write code without tests, skip design validation, and lack consistency across projects.

**Solution**: Portable patterns and guides that enforce TDD workflow, quality standards, and best practices across all your projects.

**Repository**: https://github.com/TheMostlyGreat/safeword (private)

---

## Quick Start (30 seconds)

**1. Clone this repo:**
```bash
git clone https://github.com/TheMostlyGreat/safeword ~/.agents
```

**2. Install in your project:**
```bash
cd /path/to/your/project
bash ~/.agents/setup-project.sh
```

**3. Verify installation:**
```bash
# Check that AGENTS.md references .safeword/SAFEWORD.md
cat AGENTS.md | grep "safeword"

# Or check CLAUDE.md if that's what exists
cat CLAUDE.md | grep "safeword" 2>/dev/null || echo "Using AGENTS.md"
```

**Result**: Your project now has:
- `.safeword/SAFEWORD.md` - Global patterns and workflows
- `.safeword/guides/` - TDD methodology, testing, code philosophy
- `.claude/hooks/` - Auto-linting and quality review
- `AGENTS.md` or `CLAUDE.md` - Project context with framework reference

**Commit these to your repo** for team consistency.

---

## How It Works

**Global framework**: `~/.agents/` is a git repo synced across your machines (guides, templates, learnings)

**Per-project deployment**: `setup-project.sh` copies framework to `.safeword/` and `.claude/` in your project

**Team consistency**: Teammates get the framework from your project repo (no global install needed)

**Living documentation**: Update guides as you learn, extract learnings from debugging, archive completed work

---

## What's Inside

```
~/.agents/
├── guides/           Core methodology and best practices
├── templates/        Fillable document structures
├── learnings/        Extracted knowledge from experience
├── planning/         Planning documentation
│   ├── user-stories/
│   ├── test-definitions/
│   ├── design/
│   └── issues/
├── hooks/            Automation scripts
└── skills/           Specialized agent capabilities
```

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
| **llm-instruction-design.md** | 13 principles for LLM-consumable docs (MECE, examples) | Creating AGENTS.md/guides |
| **agents-md-guide.md** | AGENTS.md structure, anti-patterns, modular approach | Setting up projects |
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

**Location**: `~/.agents/learnings/[concept].md`

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

# Auto-detect project type + quality review
bash ~/.agents/setup-project.sh

# Force Biome mode + quality review
bash ~/.agents/setup-project.sh --linting-mode biome

# Quality review only (skip linting)
bash ~/.agents/setup-project.sh --skip-linting
```

**Auto-detection**: Automatically detects project type from `package.json`:
- Biome → if `@biomejs/biome` installed
- Next.js → if `next` in dependencies
- Electron → if `electron` in dependencies
- Astro → if `astro` in dependencies
- React → if `react` in dependencies
- TypeScript → if `typescript` in dependencies or `tsconfig.json` exists
- Minimal → otherwise

### Reference Guides in Project AGENTS.md

```markdown
# Import guides from .safeword
@./.safeword/guides/testing-methodology.md
@./.safeword/guides/code-philosophy.md

# Reference templates
- **Template:** `@./.safeword/templates/user-stories-template.md`
- **Guide:** `@./.safeword/guides/user-story-guide.md`
```

Claude Code will auto-load these guides as context.

### Check for Existing Learnings

```bash
# Global learnings (all projects)
ls ~/.agents/learnings/

# Search by keyword
ls ~/.agents/learnings/*react*.md
ls ~/.agents/learnings/*electron*.md
```

### Extract New Learning

1. Follow recognition triggers in `learning-extraction.md`
2. Create `~/.agents/learnings/[concept].md`
3. Use template: Problem → Gotcha → Examples → Testing Trap

### Create Planning Documentation

```bash
# User stories
cd ~/.agents/planning/user-stories
touch feature-name.md

# Test definitions
cd ~/.agents/planning/test-definitions
touch feature-name.md

# Design docs
cd ~/.agents/planning/design
touch feature-name.md
```


---

## Syncing Across Machines

```bash
cd ~/.agents
git pull origin main   # Get latest from GitHub
git add .
git commit -m "docs: update [guide/learning] with [change]"
git push origin main   # Push to GitHub
```

---

## Integration with Project Context

**Project AGENTS.md/CLAUDE.md**: Created by `setup-project.sh`, references `.safeword/SAFEWORD.md`

**How it works**:
1. Project AGENTS.md imports core guides via `@./.safeword/guides/`
2. Guides reference templates via `@./.safeword/templates/`
3. Guides cross-reference each other via `@./.safeword/guides/`
4. Global learnings referenced via `ls ~/.agents/learnings/`

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
