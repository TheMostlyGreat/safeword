# SAFEWORD - Claude Code Framework

**Problem**: AI agents write code without tests, skip design validation, and lack consistency across projects.

**Solution**: Portable patterns and guides that enforce TDD workflow, quality standards, and best practices across all your projects.

**Repository**: <https://github.com/TheMostlyGreat/safeword> (private)

---

## Quick Start (30 seconds)

**1. Install in your project:**

```bash
cd /path/to/your/project
npx safeword@latest setup
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
- `.safeword/hooks/` - Claude Code hooks (auto-linting, quality review)
- `.claude/settings.json` - Hook configuration for Claude Code
- `.claude/commands/` - Slash commands (`/lint`, `/quality-review`, `/architecture`)
- `AGENTS.md` - Project context with framework reference (also patches `CLAUDE.md` if it exists)

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
- `.safeword/hooks/` - Automation scripts for Claude Code
- `.claude/commands/` - Slash commands
- `.claude/skills/` - Specialized agent capabilities

---

## Core Guides

**Purpose**: Reusable methodology applicable to all projects

| Guide                       | Purpose                                                         | When to Read            |
| --------------------------- | --------------------------------------------------------------- | ----------------------- |
| **code-philosophy.md**      | Core coding principles, TDD philosophy, self-review checklist   | Before writing code     |
| **development-workflow.md** | TDD workflow (RED/GREEN/REFACTOR), test pyramid, decision trees | Starting any feature    |
| **tdd-best-practices.md**   | User story + test definition patterns and examples              | Creating tests/stories  |
| **learning-extraction.md**  | Extract learnings from debugging, recognition triggers          | After complex debugging |

---

## Documentation Guides

**Purpose**: Writing effective feature documentation

| Guide                          | Purpose                                            | When to Read                   |
| ------------------------------ | -------------------------------------------------- | ------------------------------ |
| **user-story-guide.md**        | Writing effective user stories (INVEST criteria)   | Creating user stories          |
| **test-definitions-guide.md**  | Writing test definitions (unit/integration/E2E)    | Planning test suites           |
| **design-doc-guide.md**        | Design doc structure and best practices            | Designing complex features     |
| **architecture-guide.md**      | Architecture decisions (tech choices, data models) | Making architectural decisions |
| **data-architecture-guide.md** | Data model design (schemas, validation, flows)     | Database/schema design         |

---

## Meta Guides

**Purpose**: Working with LLMs and documentation structure

| Guide                         | Purpose                                                                  | When to Read         |
| ----------------------------- | ------------------------------------------------------------------------ | -------------------- |
| **llm-guide.md**              | LLM integration (caching, evals) + writing docs for LLMs (13 principles) | Building AI features |
| **context-files-guide.md**    | CLAUDE.md/CURSOR.md/AGENTS.md structure, anti-patterns, modular approach | Setting up projects  |
| **zombie-process-cleanup.md** | Port-based cleanup, multi-project isolation                              | Managing dev servers |

---

## Templates

**Purpose**: Fillable structures for feature documentation

| Template                        | Purpose                                          | Used By                   |
| ------------------------------- | ------------------------------------------------ | ------------------------- |
| **user-stories-template.md**    | User story structure (As a X / Given-When-Then)  | user-story-guide.md       |
| **test-definitions-feature.md** | Test definition structure (suites, tests, steps) | test-definitions-guide.md |
| **design-doc-template.md**      | Design doc structure (architecture, components)  | design-doc-guide.md       |

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

---

## Planning

**Purpose**: Feature planning and design documentation

**Structure**:

```plaintext
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

## Hooks, Commands & Skills

**Hooks** (in `.safeword/hooks/`): Automation scripts triggered by Claude Code events

- `session-verify-agents.sh` - Verifies AGENTS.md link on session start
- `session-version.sh` - Shows safeword version on session start
- `session-lint-check.sh` - Checks for lint errors on session start
- `prompt-timestamp.sh` - Injects timestamp into prompts
- `prompt-questions.sh` - Reminds agent to ask clarifying questions
- `post-tool-lint.sh` - Auto-lints after file edits
- `stop-quality.sh` - Quality review prompt on stop

**Skills** (in `.claude/skills/`): Specialized agent capabilities

- `safeword-quality-reviewer/` - Deep code quality review with web research

**Commands** (in `.claude/commands/`): Slash commands

- `/lint` - Run linters and formatters
- `/architecture` - Review architecture guidelines
- `/quality-review` - Deep code review with web research

---

## CLI Commands

```bash
# Set up safeword in current project
npx safeword@latest setup
npx safeword@latest setup -y   # Non-interactive mode

# Check project health and versions
npx safeword@latest check
npx safeword@latest check --offline   # Skip remote version check

# Upgrade to latest version
npx safeword@latest upgrade

# Preview changes before upgrading
npx safeword@latest diff
npx safeword@latest diff -v           # Show full diff output

# Sync linting plugins with project dependencies
npx safeword sync
npx safeword sync -q           # Quiet mode
npx safeword sync -s           # Stage modified files (for pre-commit)

# Remove safeword from project
npx safeword reset
npx safeword reset -y          # Skip confirmation
npx safeword reset --full      # Also remove linting config + packages
```

**Auto-detection**: Detects project type from `package.json` and installs relevant ESLint/Prettier plugins:

- TypeScript, React, Next.js, Astro, Vue, Svelte, Electron
- Vitest, Playwright, Tailwind
- Publishable libraries (adds publint)

### How Guide Imports Work

`AGENTS.md` contains a link: `@./.safeword/SAFEWORD.md` (also added to `CLAUDE.md` if present)

SAFEWORD.md then imports guides via the Quick Reference table. Claude Code auto-loads these as context.

### Check for Existing Learnings

```bash
ls .safeword/learnings/
```

### Extract New Learning

1. Follow recognition triggers in `learning-extraction.md`
2. Create `.safeword/learnings/[concept].md`
3. Use template: Problem → Gotcha → Examples → Testing Trap

---

## Syncing Across Machines

Commit `.safeword/` and `.claude/` in your project repo for team consistency.

---

## Integration with Project Context

**How it works**:

1. `AGENTS.md` links to `.safeword/SAFEWORD.md` (also patches `CLAUDE.md` if present)
2. `SAFEWORD.md` imports guides via Quick Reference table
3. Guides cross-reference each other and templates
4. Learnings stored in `.safeword/learnings/`

**Result**: Modular, maintainable documentation with clear separation of concerns

---

## Principles

1. **Guides** - Reusable methodology (test pyramid, TDD workflow)
2. **Templates** - Fillable structures (user stories, test definitions)
3. **Learnings** - Extracted knowledge (gotchas, discoveries)
4. **Planning** - Feature planning and design (user stories, test definitions, design docs)
5. **Hooks/Skills** - Automation and specialized capabilities

**Living Documentation**: Update as you learn, archive completed work, consolidate when needed

---

## LLM Eval Testing

**Purpose**: Validate that guides are effective for LLM consumption using promptfoo.

### Running Evals

```bash
# Run all eval tests
npm run eval

# Run without cache (fresh API calls)
npm run eval:no-cache

# Open web UI to view results
npm run eval:view
```

### What's Tested

The eval suite tests that LLMs correctly follow guide instructions:

| Category               | Tests   | What's Validated                                                                       |
| ---------------------- | ------- | -------------------------------------------------------------------------------------- |
| Architecture           | 21      | Doc type selection, layers, dependencies, ESLint, LLM review, pre-commit, CI, template |
| Code Philosophy        | 14      | Bloat avoidance, error handling, TDD, self-review, git workflow                        |
| Testing Methodology    | 13      | Test type selection, TDD phases, test integrity, cost controls                         |
| Zombie Process         | 7       | Port-based cleanup, scripts, tmux isolation, best practices                            |
| User Stories           | 13      | INVEST validation, size guidelines, templates, technical constraints                   |
| LLM Instruction Design | 15      | MECE trees, tie-breaking, lookup tables, anti-patterns                                 |
| TDD Best Practices     | 10      | Template selection, story formats, data builders                                       |
| Design Doc             | 10      | Prerequisites, template, components, user flow, decisions                              |
| Context Files          | 11      | File selection, triggers, imports, size, cross-references                              |
| Data Architecture      | 7       | Decision tree, principles, flows, policies, checklist                                  |
| Learning Extraction    | 11      | Triggers, templates, precedence, cross-references                                      |
| LLM Prompting          | 10      | Caching, structured outputs, LLM-as-judge, costs                                       |
| Test Definitions       | 12      | Suites, status, naming, mapping, LLM-friendly                                          |
| **Total**              | **154** |                                                                                        |

### Adding New Tests

Edit `promptfoo.yaml` and add a test case:

```yaml
- description: 'test-id: Description'
  vars:
    input: 'User prompt to test'
    context: |
      Relevant excerpt from guide
  assert:
    - type: llm-rubric
      value: |
        EXCELLENT: Best response criteria
        ACCEPTABLE: Minimum passing criteria
        POOR: Failing criteria
```

### Requirements

- `ANTHROPIC_API_KEY` environment variable set
- Tests use Claude Sonnet 4 by default

### Interpreting Results

- **PASS**: LLM followed guide correctly
- **FAIL**: Guide may need improvement (clearer instructions, examples, tie-breakers)

Results saved to `eval-results.json` after each run.

---

## Getting Help

- **Claude Code docs**: <https://docs.claude.com/en/docs/claude-code>
- **Issues**: <https://github.com/anthropics/claude-code/issues>
- **This repo**: <https://github.com/TheMostlyGreat/safeword> (private)
