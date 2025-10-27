# AI Agent Guides

Personal knowledge base for AI coding agents (Claude Code, Cursor, etc.)

**Repository**: https://github.com/TheMostlyGreat/agents (private)

---

## Structure

```
~/.agents/coding/
├── guides/      (12 files - core methodology)
├── templates/   (3 files - fillable documents)
├── learnings/   (extracted knowledge from debugging/implementation)
└── analysis/    (4 files - automation research & planning)
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
| **llm-instruction-design.md** | 13 principles for LLM-consumable docs (MECE, examples) | Creating CLAUDE.md/guides |
| **claude-md-guide.md** | CLAUDE.md structure, anti-patterns, modular approach | Setting up projects |

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

**Location**: `~/.agents/coding/learnings/[concept].md`

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

---

## Analysis

**Purpose**: One-time research documents (reference/planning)

| Document | Purpose |
|----------|---------|
| **automation-plan.md** | Claude Code automation opportunities (Skills, Hooks, Slash Commands) |
| **mcp-analysis.md** | MCP servers vs Skills for quality automation |
| **phase2-subagents-vs-skills-analysis.md** | Subagents vs Skills comparison |
| **settings-improvements.md** | settings.json optimization for auto-approval |

---

## Usage

### Reference Guides in CLAUDE.md

```markdown
# Import guides
@~/.agents/coding/guides/testing-methodology.md
@~/.agents/coding/guides/code-philosophy.md

# Reference templates
- **Template:** `@~/.agents/coding/templates/user-stories-template.md`
- **Guide:** `@~/.agents/coding/guides/user-story-guide.md`
```

Claude Code will auto-load these guides as context.

### Check for Existing Learnings

```bash
# Global learnings (all projects)
ls ~/.agents/coding/learnings/

# Search by keyword
ls ~/.agents/coding/learnings/*react*.md
ls ~/.agents/coding/learnings/*electron*.md
```

### Extract New Learning

1. Follow recognition triggers in `learning-extraction.md`
2. Create `~/.agents/coding/learnings/[concept].md`
3. Use template: Problem → Gotcha → Examples → Testing Trap

---

## Maintenance

### Adding New Content

**New guide**: Create in `coding/guides/`, reference from CLAUDE.md
```bash
cd ~/.agents/coding/guides
touch new-guide.md
# Add to CLAUDE.md: @~/.agents/coding/guides/new-guide.md
```

**New learning**: Create in `coding/learnings/`, update this README
```bash
cd ~/.agents/coding/learnings
touch [concept].md
# Document pattern, anti-pattern, examples
```

**New analysis**: Create in `coding/analysis/`
```bash
cd ~/.agents/coding/analysis
touch new-analysis.md
# Research, planning, evaluation documents
```

### Reviewing Content

**Monthly**: Review existing learnings for relevance
- Remove obsolete (technology deprecated, pattern no longer used)
- Update outdated examples
- Consolidate similar learnings

**Quarterly**: Archive analysis docs when work complete
- Move completed automation work to archive/
- Keep active planning/research in analysis/

**Per feature**: After major features, assess new learnings
- Did we discover reusable patterns?
- Should extraction be suggested?
- Update guides if methodology evolved

### Syncing Across Machines

```bash
cd ~/.agents
git pull origin main   # Get latest from GitHub
git add .
git commit -m "docs: update [guide/learning] with [change]"
git push origin main   # Push to GitHub
```

---

## Quick Reference: File Counts

| Directory | Files | Purpose |
|-----------|-------|---------|
| `guides/` | 12 | Core methodology (all projects) |
| `templates/` | 3 | Fillable structures (features) |
| `learnings/` | Variable | Extracted knowledge (debugging) |
| `analysis/` | 4 | Research & planning (reference) |

**Total size**: ~130 KB (guides) + ~125 KB (analysis) = ~255 KB

---

## Integration with CLAUDE.md

**CLAUDE.md location**: `~/.claude/CLAUDE.md` (stays in Claude Code directory)

**How it works**:
1. CLAUDE.md imports 6 core guides via `@~/.agents/coding/guides/`
2. CLAUDE.md references templates via `@~/.agents/coding/templates/`
3. Guides cross-reference each other via `@~/.agents/coding/guides/`
4. Learnings referenced via `ls ~/.agents/coding/learnings/`

**Result**: Modular, maintainable documentation with clear separation of concerns

---

## Principles

1. **Guides** - Reusable methodology (test pyramid, TDD workflow)
2. **Templates** - Fillable structures (user stories, test definitions)
3. **Learnings** - Extracted knowledge (gotchas, discoveries)
4. **Analysis** - One-time research (automation planning, evaluations)

**Living Documentation**: Update frequently, archive obsolete content, consolidate when needed

**Cross-Agent Compatible**: Works with Claude Code, Cursor, and other AI coding agents

---

## Getting Help

- **Claude Code docs**: https://docs.claude.com/en/docs/claude-code
- **Issues**: https://github.com/anthropics/claude-code/issues
- **This repo**: https://github.com/TheMostlyGreat/agents (private)

---

**Last Updated**: 2025-10-26
**Version**: 1.0
