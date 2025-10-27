# CLAUDE.md File Structure & Maintenance

## When to Create CLAUDE.md Files

**Root file** (`/CLAUDE.md`) - Always create for projects
- Architecture decisions with "why" (not just "what")
- Design philosophy and conventions
- Common gotchas specific to this codebase
- Cross-references to subdirectory files

**Subdirectory files** - Create when:
- Directory has complex, non-obvious conventions (e.g., `tests/AGENTS.md`, `agents/CLAUDE.md`)
- >3 unique rules that don't fit in root
- Working in that directory needs specialized context
- **Skip if:** Directory is straightforward or already covered in root

**Naming convention:**
- Use `AGENTS.md` for cross-agent compatibility (tests, docs, etc.)
- Use `CLAUDE.md` for Claude-specific guidance (agents, skills, etc.)

## Claude Code Auto-Loading Behavior

**How Context Loading Works:**

1. **Root CLAUDE.md** - Always loaded for the project
2. **Subdirectory CLAUDE.md** - Loaded when working in that directory
3. **Hierarchical loading** - Root + subdirectory both active when in subdirectory

**Example:**
```
Working in: /project/src/agents/rules-narrative-agent.ts
Loaded context:
  ✓ /project/CLAUDE.md (architecture decisions)
  ✓ /project/src/agents/CLAUDE.md (prompt engineering)
```

**Design implication:** Subdirectory files should assume root context is available
- Use "See root CLAUDE.md for architecture" cross-references
- Don't duplicate root content in subdirectory files
- Focus subdirectory files on specialized conventions for that area

**Reliability note:** Auto-loading works best when you explicitly reference CLAUDE.md in conversation ("following the guidelines in CLAUDE.md"). Implicit automatic reference can be less reliable.

**Deprecated:** CLAUDE.local.md is no longer recommended - use imports instead for better multi-worktree support

## File Structure Pattern

```
project/
├─ CLAUDE.md                    # 100-200 lines: architecture, design philosophy
├─ src/agents/CLAUDE.md         # 100-200 lines: prompt engineering (if complex)
└─ tests/AGENTS.md              # 60-100 lines: test conventions (cross-agent)
```

**Modular Approach (Recommended):**
```
project/
├─ CLAUDE.md                    # 50 lines: imports + structure
├─ docs/architecture.md         # 100 lines: architecture decisions
└─ docs/conventions.md          # 80 lines: coding conventions
```

Main CLAUDE.md imports modules:
```markdown
@docs/architecture.md
@docs/conventions.md
```

## Content Guidelines

**Include:**
- "Why" over "what" - Explain architectural trade-offs, not features
- Project-specific conventions - Unique to THIS codebase
- Concrete examples - Good vs bad patterns
- Gotchas - Common mistakes developers make HERE
- Cross-references - Link to subdirectories, don't duplicate

**Exclude:**
- Generic advice ("follow best practices")
- Feature lists (put in README.md)
- Setup instructions (put in README.md)
- Phase tracking (put in ROADMAP.md)
- API documentation (put in code comments)

## Target Line Counts

- Root: 100-200 lines (architecture + philosophy)
- Subdirectories: 60-100 lines (focused conventions)
- Total project: <500 lines across all files
- **With imports:** Main file 50 lines, modules 100-150 lines each

**Rule:** If >200 lines, extract to subdirectory or use imports.

**File size:** Keep under 50KB for optimal performance (though no hard limit)

## Anti-Patterns to Avoid

❌ **Redundancy between root and subdirectory files** (#1 source of bloat)
- Don't list all stores in root if packages/web/CLAUDE.md covers them
- Don't document testing patterns in root if tests/AGENTS.md exists
- Don't repeat gotchas - reference subdirectory for details
- Each fact stated exactly once, use cross-references elsewhere

❌ **Implementation details in root file**
- File paths (store.ts:127-137) belong in subdirectory files
- Specific line numbers change frequently
- File trees and directory structures
- Line counts and feature status lists

❌ **Testing sections in non-test files**
- Testing philosophy → tests/AGENTS.md (always)
- Test commands → tests/AGENTS.md or README.md
- Test patterns → tests/AGENTS.md

❌ **User-facing documentation**
- Setup instructions → README.md
- Development commands → README.md
- Feature lists → ROADMAP.md
- API documentation → Code comments or separate docs

❌ **Generic advice**
- "Use TypeScript" (not project-specific)
- "Follow best practices" (too vague)
- "Write tests" (duh - say WHICH tests for WHAT)

❌ **Meta-commentary**
- "Last Updated: 2025-01-19"
- "This file was reduced from 634 → 152 lines"
- Commit history (that's what git is for)

❌ **Outdated information**
- Revisit after major architectural changes
- Remove sections when they no longer apply
- Update cross-references when files move

## Cross-Reference Pattern

**Root file:**
```markdown
**Agents** (`app/src/agents/`) - LLM logic. See `agents/CLAUDE.md`.
```

**Subdirectory file:**
```markdown
**Context:** Working with AI agents. See root `CLAUDE.md` for architecture.
```

**Import pattern:**
```markdown
# Project Context

See @README for project overview and @package.json for available npm commands.

## Architecture
@docs/architecture.md

## Coding Standards
@~/.claude/llm-prompting.md

## Git Workflow
Details in @docs/git-workflow.md
```

**Import features:**
- **Relative paths:** `@docs/file.md` (relative to CLAUDE.md location)
- **Absolute paths:** `@/path/to/file.md`
- **Home directory:** `@~/.claude/file.md` (personal conventions across all projects)
- **Recursive imports:** Imported files can import others (max depth: 5 hops)
- **Inline usage:** Can reference imports in text, not just standalone lines
- **Code blocks:** Imports ignored inside `` `code spans` `` and code blocks

## Example: Well-Structured Root

```markdown
# Project Name - Project Context

Brief description. Current status.

## Design Philosophy
1. **Test-Driven Development (TDD):** Write tests before implementation
2. **Core principle:** Why we chose this approach
3. **Core principle:** Trade-offs we accepted

## Architecture Decisions
### Tech Choice 1
**Decision:** What we chose
**Why:** Reduces X, improves Y (specific numbers)
**Trade-off:** Harder to debug, but worth it for UX
**Gotcha:** Must do Z or it breaks

## Common Gotchas
1. **Thing:** Why it breaks (see Design Philosophy → Section)

## File Organization
**Dir** (`path/`) - Purpose. See `path/CLAUDE.md`.
```

## Maintenance

- Update when architecture changes
- Remove outdated sections immediately
- Consolidate if multiple files reference same concept
- Test: Can new developer understand "why" from reading this?
- **Use imports** to keep main file under 200 lines
- Verify loaded context matches intent (check hierarchical loading behavior)

---

## Writing for LLM Comprehension

**Critical:** CLAUDE.md files are instructions consumed by LLMs.

**See:** `@~/.claude/llm-instruction-design.md` for 13 core principles for writing LLM-consumable documentation.

### Quality Checklist for CLAUDE.md

Before committing:

- [ ] All decision logic uses MECE principle (mutually exclusive, collectively exhaustive)
- [ ] All project-specific terms are defined
- [ ] No contradictions between sections
- [ ] Rules have concrete examples
- [ ] Edge cases explicitly covered
- [ ] Vague terms replaced with actionable principles
- [ ] No redundancy (each fact stated once)
- [ ] File under 200 lines (or uses imports)

---

## Best Practices from Anthropic

**Conciseness:**
- Use short, declarative bullet points (not narrative paragraphs)
- Trim redundancy (don't explain obvious folder names like "components folder contains components")
- Don't include commentary or nice-to-have information
- Files are loaded with every request - keep lean

**Effectiveness:**
- **Treat as living document** - Constantly refine based on what works
- Periodically review and refactor for clarity
- At Anthropic, teams use prompt improver to tune instructions
- Add emphasis ("IMPORTANT", "YOU MUST") for critical rules
- Explicitly reference CLAUDE.md in prompts ("following CLAUDE.md guidelines") for better adherence

**Token Budget:**
- CLAUDE.md prepended to every prompt - consumes context with each interaction
- Bloated files cost more tokens and introduce noise
- Keep under 50KB for optimal performance (though no hard limit)
- Use imports to modularize instead of monolithic files
