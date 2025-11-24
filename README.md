# SAFEWORD - Claude Code Framework

Portable patterns and guides for Claude Code that deploy to any project.

**Repository**: https://github.com/TheMostlyGreat/safeword (private)

---

## Structure

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

## Usage

### Reference Guides in AGENTS.md

```markdown
# Import guides
@~/.agents/guides/testing-methodology.md
@~/.agents/guides/code-philosophy.md

# Reference templates
- **Template:** `@~/.agents/templates/user-stories-template.md`
- **Guide:** `@~/.agents/guides/user-story-guide.md`
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

## Setup Scripts

**One-command installer**: `setup-project.sh` deploys SAFEWORD framework to any project

```bash
cd /path/to/your/project
bash /path/to/.agents/setup-project.sh
```

**What it creates**:
- `.safeword/SAFEWORD.md` - Global patterns (copy of AGENTS.md)
- `.safeword/guides/` - Reference documentation
- `.claude/hooks/` - Quality review and linting automation
- `AGENTS.md` or `CLAUDE.md` - Project context with @./.safeword/SAFEWORD.md reference

**Result**: Fully portable - commit `.safeword/` and `.claude/` for team consistency

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

## Integration with AGENTS.md

**AGENTS.md location**: `~/.claude/AGENTS.md` (symlinked to `~/.agents/AGENTS.md`)

**How it works**:
1. AGENTS.md imports core guides via `@~/.agents/guides/`
2. AGENTS.md references templates via `@~/.agents/templates/`
3. Guides cross-reference each other via `@~/.agents/guides/`
4. Learnings referenced via `ls ~/.agents/learnings/`

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
