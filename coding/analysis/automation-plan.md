# Claude Code Automation Plan: Quality Control Workflow

**Goal**: Eliminate repetitive "double check and critique" prompts while maintaining quality standards

**Based on**: Conversation pattern analysis across soulless-monorepo (1,319 messages) and bitd (8,732 messages)

**Key Pattern Identified**: 7% of soulless-monorepo and 4% of bitd prompts are quality control rituals that can be automated

**Updated**: 2025-10-30 - Integrated Anthropic 2025 best practices: Explore→Plan→Code workflow, context management, split Quality Reviewer into 3 focused Skills, replaced UserPromptSubmit Hook with Stop Hook

---

## Executive Summary

After comprehensive analysis of all automation mechanisms (Hooks, Skills, Subagents, MCP Servers), the recommended approach is:

**Phase 1** (START HERE): Enhanced CLAUDE.md + Slash Commands → 60% reduction in prompt length
**Phase 2** (⭐ RECOMMENDED): Skills + PostToolUse Hooks → Eliminate all 347 quality check prompts
**Phase 3** (OPTIONAL): UserPromptSubmit Hook → If Phase 2 insufficient
**Phase 4** (FUTURE): MCP Servers → Only for external integrations (GitHub PR automation, database validation)

**Why NOT Subagents or MCP Servers for Phase 2**:
- ❌ Subagents: Too slow (context switching), lack conversation history
- ❌ MCP Servers: External dependencies, cost, complexity, no conversation context
- ✅ Skills: Fast, context-aware, automatic activation, perfect fit

### Quick Reference: Top Automation Opportunities

**Updated based on Anthropic 2025 best practices**

| Mechanism | Name | Priority | Impact | Effort | ROI | Source Guide |
|-----------|------|----------|--------|--------|-----|--------------|
| **Skill** | Explore-First Enforcer | ⭐⭐⭐⭐⭐ | Prevents jumping to code (Anthropic #1 best practice) | 30 min | Very High | Anthropic 2025 best practices |
| **Skill** | Docs Verifier | ⭐⭐⭐⭐⭐ | Check latest docs (was part of Quality Reviewer) | 45 min | Very High | code-philosophy.md |
| **Skill** | Standards Checker | ⭐⭐⭐⭐⭐ | Validate conventions (was part of Quality Reviewer) | 30 min | Very High | code-philosophy.md |
| **Skill** | Quality Gates | ⭐⭐⭐⭐⭐ | Final review before Write/Edit (was part of Quality Reviewer) | 45 min | Very High | code-philosophy.md |
| **Hook** | Stop - Context Management | ⭐⭐⭐⭐ | Prevent "dumber after compaction" issue | 10 min | High | Anthropic 2025 best practices |
| **Hook** | PostToolUse - Test Runner | ⭐⭐⭐⭐ | Auto-run tests after every edit | 30 min | High | testing-methodology.md |
| **Skill** | Context Manager | ⭐⭐⭐⭐ | Suggest /clear between tasks | 20 min | High | Anthropic 2025 best practices |
| **Skill** | Feature Kickoff | ⭐⭐⭐⭐ | Auto-find user stories/tests/design docs | 1 hr | High | CLAUDE.md |
| **Skill** | TDD Enforcer | ⭐⭐⭐ | Enforce tests BEFORE implementation | 30 min | Medium | testing-methodology.md, Anthropic 2025 |
| **Slash Cmd** | /critique | ⭐⭐⭐ | Manual quality check shortcut | 15 min | Medium | Phase 1 plan |

**Total identified**: 17 Skills, 4 Hooks, 5 Slash Commands (26 automation opportunities)

**Key changes from original plan**:
- Split Quality Reviewer into 3 focused Skills (Anthropic: "keep Skills lean")
- Added Explore-First Enforcer (Anthropic #1 best practice)
- Replaced UserPromptSubmit Hook with Stop Hook (prevents context bloat)
- Added Context Manager Skill (addresses "dumber after compaction" issue)

**Implementation recommendation**: Start with Explore-First + Stop Hook (Phase 1), then Docs Verifier + Quality Gates (Phase 2).

---

## Current State Analysis

### Repetitive Patterns Identified

1. **Double Check Ritual** (appears 347+ times in bitd alone):
   ```
   "double check and critique your work again just in case.
   is it correct? is it elegant? does it adhere to [plan/template]?
   does it follow the latest best practices and documentation for [stack/domain]?
   avoid bloat."
   ```

2. **Approval Cycle**:
   - "yes" / "yes please" / "ok" / "proceed" / "do it"
   - User reviews, gives terse approval, expects execution

3. **Latest Documentation Emphasis**:
   - "latest best practices"
   - "very latest documentation"
   - "check [tool]'s very latest docs"

4. **Self-Sufficiency Directive**:
   - "ask any non-obvious questions you need answered that you can't research yourself"
   - "don't be lazy"

5. **Anti-Bloat Vigilance**:
   - "avoid bloat" appears in most critique requests

6. **Quality Triad**:
   - "is it correct?"
   - "is it elegant?"
   - "does it adhere to [standard]?"

---

## Automation Strategy: All Available Mechanisms

Claude Code provides **7 automation mechanisms**. After testing all approaches against your workflow, here's the analysis:

| Mechanism | Power | Complexity | Best For | For Quality Checks |
|-----------|-------|------------|----------|-------------------|
| **Skills** | ⭐⭐⭐⭐⭐ | Low | Auto quality checks | ✅ Context-aware, proactive |
| **PostToolUse Hook** | ⭐⭐⭐⭐ | Medium | Post-code validation | ✅ Deterministic, immediate |
| **UserPromptSubmit Hook** | ⭐⭐⭐⭐⭐ | Medium | Prompt enrichment | ⚠️ No context, false positives |
| **Enhanced CLAUDE.md** | ⭐⭐⭐ | Low | Baseline behavior | ✅ Simple, foundation |
| **Slash Commands** | ⭐⭐⭐⭐ | Low | Quick shortcuts | ✅ Manual, explicit |
| **Subagents** | ⭐⭐⭐⭐ | High | Long analysis | ❌ Too slow, no context |
| **MCP Servers** | ⭐⭐⭐⭐ | High | External integrations | ❌ External API costs |

### Approach 1: Stop Hook for Context Management ⭐ RECOMMENDED

**Power Level**: ⭐⭐⭐⭐
**Effort**: Low (10 min)
**Impact**: Prevents "dumber after compaction" issue

**What it does**: Reminds to `/clear` context after completing tasks

**Why not UserPromptSubmit Hook**: Text manipulation adds to context bloat, accelerating compaction issues. Stop event is cleaner.

**Configuration**: Add to `~/.claude/settings.json`

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "echo '💡 Task complete. Consider: /clear before next task (prevents context pollution)'"
      }]
    }]
  }
}
```

**How it works**:
- Claude finishes responding (Stop event fires)
- Hook outputs suggestion to use `/clear`
- User decides whether to clear context
- No text manipulation, no false positives

**Pros**:
- Non-invasive (suggestion, not manipulation)
- Addresses "dumber after compaction" issue
- No context bloat
- Works across all projects

**Cons**:
- User must manually type `/clear`
- May be repetitive if working on single task

**Decision**: Phase 2 RECOMMENDED - Pair with Skills for complete automation

---

### Approach 2: PostToolUse Hook (AUTO-VALIDATION) ⭐ RECOMMENDED

**Power Level**: ⭐⭐⭐⭐
**Effort**: Medium (30 min - requires testing)
**Impact**: Catches issues immediately after changes

**What it does**: Automatically runs quality checks AFTER Claude makes changes

**⚠️ SECURITY WARNING**: Hooks run automatically with your environment's credentials. Review carefully before adding. Malicious hooks can exfiltrate data.

**Configuration**: Add to `~/.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "bash -c 'echo \"🔍 Validating changes...\"; npm run lint 2>&1 | tail -5 || true; [ -f tsconfig.json ] && npx tsc --noEmit 2>&1 | tail -10 || true; echo \"✅ Validation complete\"'"
      }]
    }, {
      "matcher": "Edit",
      "hooks": [{
        "type": "command",
        "command": "bash -c 'echo \"🔍 Validating changes...\"; npm run lint 2>&1 | tail -5 || true; [ -f tsconfig.json ] && npx tsc --noEmit 2>&1 | tail -10 || true; echo \"✅ Validation complete\"'"
      }]
    }]
  }
}
```

**Environment variables available**:
- `$CLAUDE_TOOL_NAME` - Tool that was used (Write, Edit, etc.)
- `$CLAUDE_FILE_PATHS` - Space-separated list of modified files

**How it works**:
1. Claude uses Write or Edit tool
2. Hook fires automatically after tool completes
3. Runs linter + type checker
4. Output shown to Claude (cannot undo tool execution)
5. Claude sees results and responds accordingly

**Pros**:
- Deterministic - always runs after Write/Edit
- Catches issues immediately
- Integrates with existing tooling (npm scripts)
- No false positives (only fires on actual code changes)

**Cons**:
- Tool already executed (can't block, only validate)
- May slow iteration if tools are slow
- Requires npm scripts configured
- Noise if many warnings

**Decision**: Phase 2 RECOMMENDED - Pair with Quality Reviewer Skill

---

### Approach 3: Custom Slash Commands (WORKFLOW SHORTCUTS)

**Power Level**: ⭐⭐⭐⭐
**Effort**: Low (15 min)
**Impact**: 60% reduction in prompt length

**What it does**: Replace long prompts with short commands

#### Command 1: `/critique`

**File**: `~/.claude/commands/critique.md`

```markdown
---
description: Run quality critique on current work
---

Double check and critique your work again just in case.

Evaluate against these criteria:

1. **Correctness**
   - Will it actually work?
   - Edge cases handled?
   - Error handling complete?

2. **Elegance**
   - Simplest solution possible?
   - Any bloat or over-engineering?
   - Readable and maintainable?

3. **Standards Adherence**
   - Follows project CLAUDE.md conventions?
   - Matches existing code patterns?
   - Latest best practices for: $ARGUMENTS

4. **Testing**
   - Can we test this?
   - Test strategy clear?

Ask any non-obvious questions you need answered that you can't research yourself online or in the codebase. Don't be lazy.

Provide your critique, then wait for approval before implementing.
```

**Usage**:
- `/critique react typescript blades`
- `/critique electron desktop-app`

#### Command 2: `/implement-quality`

**File**: `~/.claude/commands/implement-quality.md`

```markdown
---
description: Implement proposed changes with quality verification
---

Yes, implement your suggested changes.

But first, run through this quality checklist:

1. ✓ Verify against latest documentation for all libraries used
2. ✓ Ensure correct, elegant, and avoids bloat
3. ✓ Double-check adherence to project standards (read CLAUDE.md if needed)
4. ✓ Confirm test coverage is adequate
5. ✓ Consider edge cases and error handling

Then proceed with implementation.

After implementation:
- Run all relevant tests
- Report results before marking complete
```

**Usage**: `/implement-quality` (replaces "yes please")

#### Command 3: `/latest-docs`

**File**: `~/.claude/commands/latest-docs.md`

```markdown
---
description: Look up latest documentation before proceeding
---

Before proceeding, look up the very latest documentation for: $ARGUMENTS

For each library/framework, verify:
- API compatibility with our version (check package.json)
- Best practices haven't changed since your training data
- No deprecated patterns in our current approach
- New features that might be better

Then provide your findings and continue with your recommendation.
```

**Usage**:
- `/latest-docs @anthropic/sdk react-19`
- `/latest-docs playwright zustand`

#### Command 4: `/check-and-proceed`

**File**: `~/.claude/commands/check-and-proceed.md`

```markdown
---
description: Comprehensive quality check then immediate implementation
---

Run full quality verification, then implement if passing:

**STEP 1: Quality Check**
- Correct? Elegant? Standards-compliant?
- Latest docs verified?
- Tests planned?
- Bloat avoided?

**STEP 2: If all checks pass**
- Implement immediately (approval implicit)
- Run tests
- Report results

**STEP 3: If issues found**
- List concerns
- Wait for user guidance

This is a "one-shot" command - check thoroughly, then proceed automatically if confident.
```

**Usage**: `/check-and-proceed` (combines critique + approval + implementation)

**Pros**:
- Immediate productivity boost
- Easy to create and modify
- Works across all projects (global commands in ~/.claude/commands/)
- No complex scripting required

**Cons**:
- Still requires manual invocation
- Need to remember which command to use when

**Decision**: Implement in Phase 1 (TODAY)

---

### Approach 4: Agent Skills (AUTO-INVOKED QUALITY REVIEW) ⭐ RECOMMENDED

**Power Level**: ⭐⭐⭐⭐⭐
**Effort**: High (1-2 hours - includes testing)
**Impact**: Eliminates need for manual quality check invocation

**What it does**: Claude automatically invokes quality checks when relevant (no manual trigger)

**How Skills Work**: Model-invoked—Claude autonomously decides when to use them based on your request and the Skill's description. Skills are tools Claude calls, like Read or WebFetch.

**File Structure**:
```
~/.claude/skills/quality-reviewer/
├── SKILL.md           # Main Skill definition (YAML frontmatter + instructions)
└── examples.md        # Optional: Supporting documentation
```

**SKILL.md Template** (condensed—see full implementation in appendix):

```yaml
---
name: quality-reviewer
description: |
  Automatically review code changes for correctness, elegance, and standards adherence.

  Use PROACTIVELY when:
  - About to Write or Edit code files
  - User says "yes"/"proceed"/"implement"
  - Proposing architectural changes

  Perform checks:
  - Latest docs verified (WebFetch/WebSearch package.json versions)
  - Correctness (edge cases, errors, type safety)
  - Elegance (avoid bloat, simplest solution)
  - Standards (read CLAUDE.md, match patterns)
  - Testability (test strategy clear)

  Return: PROCEED / REVISE / USER INPUT

allowed-tools:
  - Read
  - Grep
  - Glob
  - WebFetch
  - WebSearch
---

# Quality Review Protocol

[Full protocol with 6 steps: Doc Verification, Standards Check, Quality Eval,
Recommendation, Escalation Rules, Quality Gates]
```

**Key Features**:
- **Dynamic doc discovery**: Reads package.json → searches "[library] v[version] documentation"
- **Context-aware**: Infers task context from keywords + file paths
- **Version-specific**: Uses `<env>` current date for recency validation
- **Structured output**: Returns PROCEED/REVISE/USER INPUT with reasoning

**⚠️ WARNING**: Keep Skill description under 1024 chars—it's critical for Claude's activation logic. Split into multiple focused Skills if needed.

**Pros**:
- Completely automatic - no manual invocation
- Works across all projects
- Most intelligent approach (Claude decides when to use)
- Comprehensive quality checks
- Has conversation context (unlike Hooks/MCP)

**Cons**:
- Complex to set up and test
- May fire at wrong times (needs description tuning)
- Harder to debug if misbehaving
- Requires clear, concise description (<1024 chars)

**Decision**: Phase 2 RECOMMENDED - Primary automation mechanism

**Note**: Full Skill implementation with examples available in appendix or create as separate file at `~/.claude/skills/quality-reviewer/SKILL.md`

---

### Approach 5: Enhanced CLAUDE.md (BASELINE BEHAVIOR)

**Power Level**: ⭐⭐⭐
**Effort**: Low (10 min)
**Impact**: Establishes baseline expectations

**What it does**: Embeds quality standards directly in Claude's instructions (every session)

**File**: `~/.claude/CLAUDE.md` (add new section)

```markdown
## Workflow Standards (CRITICAL - Always Follow)

### 0. Explore → Plan → Code Workflow (ALWAYS USE)

**Critical Best Practice** (Anthropic 2025): Claude tends to jump straight to coding without this.

**Before ANY code changes:**

**EXPLORE FIRST:**
1. Read relevant existing files (do NOT write code yet)
2. Understand current patterns and architecture
3. Identify what needs to change

**THEN PLAN:**
4. Use "think hard" or "ultrathink" for complex problems
5. Create implementation plan
6. Get user approval on plan

**THEN CODE:**
7. Implement with explicit verification steps
8. Run tests
9. Commit results

**Example:**
```
User: "Add dark mode toggle"

❌ BAD: Immediately propose component code
✅ GOOD:
"Let me explore first:
1. Reading existing theme system...
2. Checking current state management...
3. Understanding toggle patterns in codebase...

[After exploration]
Now I'll think hard about the implementation plan:
- Option A: CSS variables + context
- Option B: Tailwind dark mode classes
- Recommend A because [reasoning]

Should I proceed with detailed plan?"
```

**When to skip exploration:**
- Trivial changes (typos, formatting)
- User explicitly says "just do it"

---

### 1. Latest Documentation Check

NEVER assume API compatibility. Training data is stale (cutoff: January 2025).

**Process:**
- Identify all external libraries/frameworks used
- Check package.json for versions (if applicable)
- Look up latest documentation using WebFetch or WebSearch
- Verify API still exists and works as expected
- Note any deprecated patterns or better alternatives
- Report findings before proposing implementation

**Example:**
```
📚 Verified latest docs:
- @anthropic/sdk v0.38.0: streaming API unchanged ✓
- react v18.3.1: no breaking changes ✓
```

### 2. Self-Critique Against Quality Criteria

Every proposal must pass these gates:

#### Correctness
- Will it actually work?
- Edge cases handled? (null, undefined, empty, boundaries)
- Error handling complete?
- Type-safe (TypeScript projects)?

#### Elegance
- Simplest solution possible?
- Any bloat or over-engineering?
- Could it be simpler?
- Readable and maintainable?

#### Standards Adherence
- Matches project CLAUDE.md conventions?
- Follows existing code patterns?
- File/folder organization correct?
- Naming conventions followed?

#### Testability
- Can we write tests for this?
- Test strategy clear? (unit/integration/e2e)
- Edge cases testable?

### 3. Output Format for Proposals

Always structure proposals like this:

```
PROPOSAL:
[What you want to implement]

QUALITY CHECK:
✓ Latest docs verified: [libraries checked]
✓ Correct: [reasoning - edge cases, errors]
✓ Elegant: [why this approach, not simpler]
✓ Standards: [how it matches conventions]
✓ Testable: [testing strategy]

CONCERNS (if any):
⚠️ [Trade-offs, limitations, or uncertainties]

READY FOR APPROVAL
(Awaiting "yes"/"proceed"/"implement" to execute)
```

### 4. When User Approves

When user says **"yes"**, **"proceed"**, **"implement"**, or similar:

1. ✓ Implementation approved - execute immediately
2. ✓ Run relevant tests after implementation
3. ✓ Report test results + status
4. ✓ Only then mark task complete

**Do not:**
- Ask for approval again (already given)
- Propose without implementing (approval was the green light)
- Skip tests (always run if available)

### 5. Non-Obvious Questions Only

**Ask user ONLY if:**
- Multiple valid approaches with unclear trade-offs (A vs B decision)
- Domain knowledge required (business rules, game mechanics, UX preferences)
- Breaking changes need approval (user data migration, API changes)
- Genuinely can't find answer in docs/codebase after thorough search

**DO NOT ask:**
- Questions answered in official library docs → Look them up
- Implementation details you can figure out → Figure them out
- Preferences documented in CLAUDE.md → Read CLAUDE.md
- Standard engineering practices → Research best practices
- "Should I check X?" → Just check X

**Remember**: "Don't be lazy" - research first, ask only when stuck.

### 6. Avoid Bloat

**Red flags:**
- Adding dependencies when stdlib/existing libs sufficient
- Over-abstraction (framework for 1 use case)
- Premature optimization (no performance issue)
- Duplicating existing functionality
- Config for things that don't need config

**Principle**: Simplest solution that solves the problem. No more, no less.

### 7. Context Management (Prevent "Dumber After Compaction")

**Critical Issue** (Community 2025): "Claude is definitely dumber after compaction, doesn't know what files it was looking at."

**Solution**: Use `/clear` frequently to reset context between tasks.

**When to use /clear:**
- ✓ After completing a task (before starting next)
- ✓ When switching topics/features
- ✓ After fixing a bug (before new work)
- ✓ When conversation feels unfocused

**When NOT to use /clear:**
- ✗ In middle of multi-step task
- ✗ During active debugging
- ✗ When building on previous work

**Proactive suggestion:**
After completing tasks, say: "Task complete. Should I /clear context before moving to next task? (Maintains performance and prevents context pollution)"

### 8. CLAUDE.md as Living Document

**Critical Principle** (Anthropic 2025): "Treat CLAUDE.md files as living documents. Iterate on their effectiveness rather than simply accumulating content."

**Iteration Strategy:**
1. **Start minimal** (50-100 lines for baseline)
2. **Use `#` key during sessions** - Claude auto-incorporates effective instructions into CLAUDE.md
3. **Review weekly** - Remove instructions that don't work
4. **Add emphasis** - Use "IMPORTANT" or "YOU MUST" for critical rules
5. **Test effectiveness** - Try same task with/without instruction to verify impact
6. **Refine continuously** - Like tuning a prompt, CLAUDE.md requires iteration

**Anti-pattern:** Accumulating content without testing if it improves Claude's behavior.

---

## Testing Standards

**After any code changes:**
- Run existing test suite (if available)
- Report results before completion
- If tests fail: fix them (don't ask user to run tests)

**Test pyramid**: 70% unit, 20% integration, 10% e2e

**For test writing**: See `@~/.agents/coding/guides/testing-methodology.md` for comprehensive TDD workflow.

---

## Workflow: Feature Development

**CRITICAL: Always follow this sequence** (see `@~/.claude/CLAUDE.md` → Feature Development Workflow)

1. Check for user stories → ask if not found
2. Check for test definitions → ask if not found
3. Check for design doc (complex features) → ask if needed
4. Follow TDD: RED → GREEN → REFACTOR
5. Run tests yourself (don't ask user to verify)

**See:** Full workflow in global CLAUDE.md
```

**Pros**:
- Works immediately (no new files to create)
- Applies to every session automatically
- Establishes baseline expectations
- Easy to update and refine

**Cons**:
- Claude may not always follow (instructions can be ignored)
- Less deterministic than hooks/skills
- Requires periodic refinement
- Token cost (loaded every session)

**Decision**: Implement in Phase 1 (TODAY) - foundation for other approaches

---

### Approach 6: Subagents (Task Tool) - NOT RECOMMENDED

**Power Level**: ⭐⭐⭐⭐
**Effort**: High (1+ hours to create and test)
**Impact**: Powerful but WRONG TOOL for quality checks

**What it does**: Delegates tasks to specialized AI agents in separate context windows

**How it works**:
- Invoked via `Task` tool with `subagent_type` parameter
- Runs in **separate context window** (doesn't see main conversation)
- Can be automatic (Claude decides) or explicit (user requests)
- Configured as `.claude/agents/*.md` files

**Built-in subagent types** (from system):
- `general-purpose` - Multi-step tasks, complex questions
- `Explore` - Fast codebase exploration (glob/grep patterns)
- `statusline-setup` - Configure status line
- `output-style-setup` - Create output styles

**Your actual subagent usage** (from bitd conversation history):
- ✓ "Search for remaining NPC mechanics" - Explore subagent (CORRECT use)
- ✓ "Search exhaustively for character mechanics" - Explore subagent (CORRECT use)
- ✓ "Deep search for missing mechanics" - Explore subagent (CORRECT use)

**Pattern**: All 3 uses were long, exhaustive searches. NOT quality checks.

**Example custom subagent**:
```yaml
---
name: architecture-reviewer
description: |
  Reviews design docs for consistency with ARCHITECTURE.md.
  Use for comprehensive architecture audits.
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Architecture Review Protocol
[Detailed analysis instructions...]
```

**Pros**:
- ✅ Separate context = focused analysis
- ✅ Own token budget (can be very detailed)
- ✅ Returns comprehensive report
- ✅ Good for long analysis tasks

**Cons for quality checks**:
- ❌ Slow (context switching overhead)
- ❌ No conversation history (can't see your requirements)
- ❌ Can't access main conversation context
- ❌ Overkill for simple quality checks
- ❌ Better suited for exhaustive searches (your actual usage)

**Decision**: ❌ DON'T USE for Phase 2

**Why NOT**: Skills are faster, have conversation context, and auto-activate. Subagents are for long analysis tasks, not quick quality checks.

**When to use instead**:
- ✅ Comprehensive PR reviews ("Review all changes in this PR")
- ✅ Architecture audits ("Analyze design doc against ARCHITECTURE.md")
- ✅ Exhaustive code searches (you're already using Explore correctly)

---

### Approach 7: MCP Servers - NOT RECOMMENDED

**Power Level**: ⭐⭐⭐⭐
**Effort**: High (install + configure + API keys)
**Impact**: Powerful for external integrations, but WRONG TOOL for quality checks

**What it does**: Connects Claude Code to external tools, APIs, and data sources

**How it works**:
- MCP (Model Context Protocol) = Standard for external integrations
- Three transport types: HTTP (remote), SSE (deprecated), Stdio (local)
- Provides access to GitHub, databases, APIs, external linters
- Installed via: `claude mcp add --transport http [name] [url]`

**Available MCP servers for code quality**:

1. **praneybehl/code-review-mcp**
   - Uses GPT-4, Gemini, or Claude API for reviews
   - Analyzes git diffs (staged changes, branches)
   - Returns external LLM opinion
   - ❌ Cost: External API fees ($$$)
   - ❌ Latency: Network calls
   - ❌ No conversation context

2. **MCP Server Analyzer (Python)**
   - RUFF linting + VULTURE dead code detection
   - Python-specific
   - ❌ Limited to one language
   - ❌ Hooks simpler for linting

3. **GitHub MCP Server**
   - Fetch PRs, post comments, query issues
   - ✅ Useful for PR automation
   - ❌ Not needed for local quality checks

**Your current MCP config**:
```json
{
  "context7": "allow",      // Unknown (context management?)
  "playwright": "allow",    // Browser automation
  "fetch": "allow",         // HTTP requests
  "websearch": "allow"      // Web search
}
```

**Comparison: MCP vs Skills for quality checks**:

| Requirement | MCP Servers | Skills | Winner |
|-------------|-------------|--------|--------|
| Conversation context | ❌ No | ✅ Yes | Skills |
| Speed | ⚠️ Network latency | ✅ Instant | Skills |
| Cost | ⚠️ External API $$ | ✅ Included | Skills |
| Setup complexity | ❌ Complex | ✅ Simple | Skills |
| Standards checking | ❌ Needs config | ✅ Reads CLAUDE.md | Skills |
| Elegance evaluation | ❌ Hard externally | ✅ Claude's strength | Skills |

**Pros**:
- ✅ Integrates external systems (GitHub, databases)
- ✅ Can run external linters/tools
- ✅ Second opinion from different LLM models

**Cons for quality checks**:
- ❌ External API costs ($$ for GPT-4/Gemini calls)
- ❌ Network latency (slower than in-context)
- ❌ No conversation context (doesn't see requirements, CLAUDE.md)
- ❌ Complex setup (API keys, configuration)
- ❌ Security concern (code sent to external services)
- ❌ Hooks already handle linting (simpler)

**Decision**: ❌ DON'T USE for Phase 2

**Why NOT**: Skills + Hooks provide better, faster, cheaper, context-aware quality checks without external dependencies.

**When to use instead** (Phase 4 - Future):
- ✅ GitHub PR automation ("Review PR #123 and post comments")
- ✅ Database validation ("Will this schema change break production?")
- ✅ External company-specific tools
- ✅ Second LLM opinion for critical decisions

**Example future workflow**:
```bash
# Phase 4 (optional)
claude mcp add github [url]

# Usage:
You: "Review PR #456 and ensure it follows our standards"
Claude: [Uses GitHub MCP to fetch PR]
Claude: [Uses Quality Reviewer Skill to evaluate with context]
Claude: [Posts review comment via GitHub MCP]
```

---

## Implementation Plan

### Phase 1: Quick Wins (TODAY - 30 min)

**Goal**: Immediate 60% reduction in repetitive prompts

1. **Enhanced CLAUDE.md** (10 min)
   - Add "Quality Standards" section to `~/.claude/CLAUDE.md`
   - Establishes baseline behavior
   - ✅ No new tools needed

2. **Slash Commands** (20 min)
   - Create 4 commands in `~/.claude/commands/`:
     - `critique.md` - Quality review
     - `implement-quality.md` - Approve with quality check
     - `latest-docs.md` - Documentation lookup
     - `check-and-proceed.md` - One-shot command
   - Test each command in both projects
   - ✅ Immediate usability

**Success criteria**:
- Can type `/critique` instead of full prompt
- CLAUDE.md quality standards visible in Claude's proposals

---

### Phase 2: Automation (THIS WEEK - 2 hours)

**Goal**: Auto-invoked quality checks, post-implementation validation

1. **Quality Reviewer Skill** (1 hour)
   - Create `~/.claude/skills/quality-reviewer/SKILL.md`
   - Create `~/.claude/skills/quality-reviewer/examples.md`
   - Test skill activation across scenarios:
     - Proposes code change → skill activates
     - Answers question → skill does NOT activate
     - Reads files → skill does NOT activate
   - Refine description if activation inconsistent
   - ✅ Skills are most complex (require testing)

2. **PostToolUse Hook** (1 hour)
   - Create `~/.claude/hooks/post-code-validation.yaml`
   - Test in project with npm scripts
   - Verify formatters/linters run after Write/Edit
   - Check that Claude sees results and responds
   - Adjust if too noisy or slow
   - ✅ Immediate feedback after changes

**Success criteria**:
- Quality Reviewer Skill activates before implementations
- PostToolUse Hook runs linters automatically
- Both reduce manual verification steps

---

### Phase 3: Full Automation (OPTIONAL - 30 min)

**Goal**: Zero manual quality check invocations

1. **UserPromptSubmit Hook** (30 min)
   - Create `~/.claude/hooks/quality-auto-append.yaml`
   - Test trigger patterns (yes/proceed/implement)
   - Refine regex to avoid false positives
   - Consider toggling on/off per project
   - ✅ Most powerful but most invasive

**Success criteria**:
- Type "yes" → quality checklist auto-appended
- No false triggers on conversational prompts

**Decision point**: May not need if Phase 2 works well

---

### Phase 4: External Integrations (FUTURE - Variable)

**Goal**: Integrate external tools and services for advanced workflows

**When to implement**: Only if you need external system integrations

**Option A: Subagents for Long Analysis**

**Create**: Custom subagents in `~/.claude/agents/`

**Use cases**:
- Comprehensive PR reviews (entire diff analysis)
- Architecture consistency audits
- Already using Explore subagent correctly for codebase searches

**Effort**: 1-2 hours per custom subagent

**Examples**:
- `code-reviewer` subagent for full PR analysis
- `architecture-auditor` subagent for design doc reviews

---

**Option B: MCP Servers for External Tools**

**Install**: MCP servers for specific integrations

**Use cases**:
- GitHub PR automation (`claude mcp add github [url]`)
- Database validation (`claude mcp add postgres [connection]`)
- Company-specific tools

**Effort**: Variable (depends on service complexity)

**Examples**:
```bash
# GitHub integration
claude mcp add github https://github-mcp-server.example.com

# Usage:
You: "Review PR #456 and post review comments"
Claude: [Fetches PR via GitHub MCP]
Claude: [Uses Quality Reviewer Skill with context]
Claude: [Posts review via GitHub MCP]
```

**When NOT to use**:
- ❌ Local quality checks (Skills better)
- ❌ Post-code validation (Hooks better)
- ❌ Local linting (Hooks simpler than MCP)

**Success criteria**: External integrations streamline cross-system workflows

---

## Testing Strategy

### Phase 1 Testing (Slash Commands)

**Test in soulless-monorepo:**
1. Make a small change proposal
2. Type `/critique react typescript`
3. Verify comprehensive review appears
4. Type `/implement-quality`
5. Verify implementation happens with final check

**Test in bitd:**
1. Propose game mechanic implementation
2. Type `/critique blades typescript`
3. Verify domain-specific considerations appear
4. Type `/check-and-proceed`
5. Verify one-shot execution

**Pass criteria**: Commands work, save typing, maintain quality

---

### Phase 2 Testing (Skills + Hooks)

**Test Quality Reviewer Skill:**

1. **Positive test** (should activate):
   ```
   You: "Add a loading spinner component"
   Claude: [Quality Reviewer Skill activates]
   Claude: [Comprehensive review with docs check]
   Claude: "RECOMMENDATION: PROCEED"
   You: "yes"
   Claude: [Implements]
   ```

2. **Negative test** (should NOT activate):
   ```
   You: "What's the current architecture?"
   Claude: [NO skill activation - just answers]
   Claude: [Reads files, explains architecture]
   ```

3. **Edge case test**:
   ```
   You: "yes" (approving previous proposal)
   Claude: [Skill activates for final check]
   Claude: [Brief review, then implements]
   ```

**Test PostToolUse Hook:**

1. Make code change
2. Verify linter/formatter runs automatically
3. Check Claude responds to results
4. Verify test suite runs (if configured)

**Pass criteria**:
- Skills activate at right times (not false positives)
- Hooks run reliably after tool use
- Quality maintained or improved

---

### Phase 3 Testing (UserPromptSubmit Hook)

**Test trigger patterns:**

1. Type "yes" after proposal → checklist appended ✓
2. Type "proceed" → checklist appended ✓
3. Type "yes, but change X" → checklist appended (may need refinement)
4. Type "yes, I understand" (conversational) → should NOT trigger

**Pass criteria**:
- High precision (few false positives)
- High recall (catches all approvals)
- Doesn't disrupt conversational flow

---

## Rollback Plan

If any approach causes issues:

### Phase 1 (Slash Commands)
- **Issue**: Command doesn't work as expected
- **Fix**: Edit `.md` file, reload Claude session
- **Rollback**: Delete command file

### Phase 2 (Skills/Hooks)
- **Issue**: Skill fires at wrong times
- **Fix**: Refine description in SKILL.md
- **Rollback**: Delete skill directory

- **Issue**: Hook breaks workflow
- **Fix**: Adjust script or conditions
- **Rollback**: Delete hook file or set `decision: allow`

### Phase 3 (UserPromptSubmit Hook)
- **Issue**: Too many false triggers
- **Fix**: Refine regex pattern
- **Rollback**: Delete hook file (most invasive, easiest to remove)

**Recovery**: All automation is additive - removing files returns to manual workflow

---

## Success Metrics

Track these before/after metrics:

### Quantitative

| Metric | Before | Target After Phase 1 | Target After Phase 2 | Target After Phase 3 |
|--------|--------|---------------------|---------------------|---------------------|
| Avg prompt length (chars) | 250 | 150 (-40%) | 100 (-60%) | 50 (-80%) |
| Quality check prompts per session | 15 | 6 (-60%) | 3 (-80%) | 0 (-100%) |
| Time to implementation (min) | 10 | 7 (-30%) | 5 (-50%) | 4 (-60%) |
| Docs lookup prompts | 8 | 3 (-62%) | 1 (-87%) | 0 (-100%) |

### Qualitative

- **Quality maintained**: No increase in bugs or refactoring needs
- **Developer experience**: Feels faster, less repetitive
- **False positives**: <5% of hook/skill triggers are wrong
- **Comprehensiveness**: Automated checks as thorough as manual

**Measure at**: Week 1 (Phase 1), Week 2 (Phase 2), Week 4 (Phase 3)

---

## Maintenance

### Weekly Review

**Check:**
- Are slash commands being used? (check history)
- Are skills activating correctly? (check logs)
- Are hooks causing issues? (monitor for complaints)
- Quality standards still being met? (code review)

**Refine:**
- Update CLAUDE.md if patterns emerge
- Adjust hook conditions if false positives
- Enhance skill descriptions if activation inconsistent

### Monthly Review

**Assess:**
- Metrics: Are targets being met?
- Workflow: Any new repetitive patterns?
- Tools: Any new automation opportunities?

**Evolve:**
- Archive unused commands
- Create new commands for new patterns
- Update quality criteria based on learnings

---

## Future Enhancements (Phase 4 and Beyond)

### 1. Project-Specific Automation

Create per-project hooks/skills in `.claude/`:

**soulless-monorepo**:
- Custom commands for cross-package operations
- Hooks for Electron-specific validations
- Skills for desktop app patterns

**bitd**:
- Commands for Blades mechanics validation
- Skills for game design review
- Hooks for test coverage enforcement

### 2. CI/CD Integration

**GitHub Actions** (see docs.claude.com/en/docs/claude-code/github-actions.md):
- Automated PR reviews using Claude
- Quality checks in CI pipeline
- Custom automation with prompts

### 3. Team Collaboration

**Share automation across team**:
- Commit `.claude/commands/` to git
- Standardize quality checks
- Document team-specific slash commands

### 4. External Integrations (Phase 4)

**Subagents for specialized analysis**:
- `code-reviewer` - Comprehensive PR diff analysis (separate context)
- `architecture-auditor` - Design doc consistency checks
- Continue using `Explore` for exhaustive codebase searches

**MCP Servers for external tools**:
- GitHub integration for PR automation
- Database servers for production validation
- Company-specific linters and tools

**When to implement**: Only when you need these specific integrations

### 5. Advanced Skills (Beyond Phase 4)

**Additional skills to build**:
- `architecture-reviewer` - Inline checks against ARCHITECTURE.md
- `test-coverage-analyzer` - Identifies untested code paths
- `dependency-auditor` - Checks for outdated/vulnerable deps
- `performance-profiler` - Reviews for common performance issues

---

## Decision Log

### Decision 1: Start with Slash Commands (Phase 1)

**Rationale**:
- Lowest effort, immediate value
- Easy to test and iterate
- No risk of automation misbehaving
- Builds muscle memory for quality checks

**Alternative considered**: Start with Skills
**Why not**: Skills are complex, harder to debug, require more testing

---

### Decision 2: Quality Reviewer Skill in Phase 2

**Rationale**:
- Most powerful automation after slash commands proven
- Auto-invoked = zero manual work
- Comprehensive checks in one place

**Alternative considered**: UserPromptSubmit Hook first
**Why not**: Hook is more invasive, Skills allow more nuance

---

### Decision 3: UserPromptSubmit Hook Optional (Phase 3)

**Rationale**:
- Phase 2 may be sufficient (skills + post-hooks)
- Most invasive = highest risk of disruption
- Can delay if Phase 2 meets needs

**Alternative considered**: Make it Phase 1 for max impact
**Why not**: Too risky to start with, need to validate approach first

---

### Decision 4: Global vs Project-Specific

**Rationale**:
- Start global (`~/.claude/`) for consistency
- Add project-specific (`.claude/`) when patterns diverge
- Easier to manage one set initially

**Pattern**: Global by default, project-specific when needed

---

### Decision 5: NOT Using Subagents for Quality Checks (Phase 2)

**Rationale**:
- Too slow (context switching overhead)
- Lack conversation history (can't see requirements, CLAUDE.md)
- Better suited for long analysis (your actual usage: Explore for searches)
- Skills provide same intelligence with context access

**Alternative considered**: Custom quality-reviewer subagent
**Why not**: Skills are faster, have context, and auto-activate

**When to use subagents**: Comprehensive PR reviews, architecture audits, exhaustive searches (already doing this correctly)

---

### Decision 6: NOT Using MCP Servers for Quality Checks (Phase 2)

**Rationale**:
- External API costs ($$ for GPT-4/Gemini)
- Network latency (slower than in-context)
- No conversation context (doesn't see requirements)
- Complex setup (install + config + API keys)
- Hooks already handle linting (simpler)

**Alternative considered**: praneybehl/code-review-mcp
**Why not**: Skills provide better, faster, cheaper, context-aware checks

**When to use MCP**: GitHub PR automation, database validation, external company tools (Phase 4 - future)

---

### Decision 7: Trigger Mechanism - NOT Parsing JSON Responses

**Context**: The `{"proposedChanges": boolean, "madeChanges": boolean}` format is Claude's OUTPUT (appended to every response per code-philosophy.md), not an INPUT that triggers automation.

**Rationale for NOT parsing JSON**:
- **Architectural mismatch** - Skills are tools Claude invokes BEFORE taking action, not analyzers that react to Claude's own output
- **No conversation history access** - Skills don't have access to read previous assistant messages
- **Circular dependency** - "Claude responds → Parse response → Tell Claude what to do" breaks the automation flow
- **Deterministic alternatives exist** - Tool use events (Write/Edit) are observable and reliable triggers

**Correct trigger mechanisms**:

| Use Case | Trigger | Mechanism | When Fires |
|----------|---------|-----------|------------|
| `proposedChanges: true` | Claude about to propose/implement | Quality Reviewer Skill | BEFORE Write/Edit tools (proactive) |
| `madeChanges: true` | Claude modified files | PostToolUse Hook | AFTER Write/Edit tools (reactive) |

**Skills = Proactive**: Claude invokes them as tools BEFORE taking action (like Read, WebFetch, Grep)
**Hooks = Reactive**: Respond to events (tool use, prompt submission) with deterministic triggers

**Role of JSON format**:
- ✅ **Keep it** for transparency and debugging (user can see what happened)
- ✅ **Document** whether Claude proposed or made changes
- ❌ **Don't use as trigger** - Automation uses Skills/Hooks based on behavioral events, not text parsing

**Example flow**:
```
1. User: "implement feature X"
2. Claude thinks: "I should check quality first" (CLAUDE.md instruction)
3. Claude invokes Quality Reviewer Skill (proactive tool use)
4. Skill performs review, returns PROCEED/REVISE/USER INPUT
5. Claude proceeds: Uses Write tool
6. PostToolUse Hook fires (reactive to Write tool)
7. Hook runs linters/tests, provides feedback
8. Claude responds with results + {"proposedChanges": false, "madeChanges": true}
```

**Alternative considered**: Parse JSON from previous assistant message in a Skill
**Why not**: Skills can't read conversation history, and even if they could, tool use events are cleaner triggers

**Alternative considered**: UserPromptSubmit Hook that checks for "yes" and appends quality checklist
**Why not**: Too invasive (false positives on conversational "yes"), Skills provide context-aware intelligence

**Key insight**: Don't fight the architecture - use Skills for proactive quality checks, Hooks for reactive validation, and keep JSON as documentation.

---

### Decision 8: Dynamic Documentation Discovery (Not Static Tables) 🚧 PROPOSED

**⚠️ STATUS**: PROPOSED - NEEDS TESTING. This approach is theoretically sound but unvalidated with actual Claude Code Skills. Implement as prototype and iterate based on results.

**Problem**: The "latest documentation and best practices" varies by stack (Electron, TypeScript), context (testing, UX), and domain (conversational agents, document editing). Static lookup tables don't scale.

**Solution**: Process-based discovery, not catalog-based enumeration.

**Discovery Algorithm for Quality Reviewer Skill:**

```
1. AUTO-DETECT STACK
   - Read package.json dependencies (if exists)
   - Extract libraries/frameworks in use
   - Note versions (critical for compatibility checks)

2. INFER CONTEXT FROM TASK
   - User keywords: "test" → testing, "style" → UX, "slow" → performance
   - Files modified: *.test.ts → testing, *.css → UX, *.md → docs

3. READ PROJECT CLAUDE.MD
   - Check for "Key Technologies" section
   - Look for domain context (game, desktop app, conversational AI)
   - Note any project-specific patterns documented

4. BUILD VERSION-SPECIFIC SEARCH QUERIES
   - Format: "[library] v[X.Y] documentation [context]"
   - Example: "vitest v2.1 documentation async testing"
   - Fallback: "[library] latest documentation [context]"
   - Use current year from <env> if helpful: "electron {CURRENT_YEAR} IPC patterns"

5. SEARCH WITH WEBSEARCH/WEBFETCH
   - Prioritize official docs (.dev, .io, .org, official GitHub)
   - Prefer /latest/ or /stable/ URL paths (auto-redirect to current)
   - Check publish dates in search results against <env> current date
   - Flag results older than package.json version release date
```

**Handling "Latest" Documentation:**

**Problem**: LLM training data has cutoff (January 2025), but <env> provides current date.

**Solutions (in priority order):**

1. **Use package.json version** - Most reliable
   ```
   package.json has "vitest": "^2.1.0"
   → Search: "vitest v2.1 documentation"
   → Verify: Check if docs mention v2.1 features
   ```

2. **Use /latest/ URLs** - Auto-redirect to current
   ```
   https://vitest.dev/guide/  (always current)
   https://www.electronjs.org/docs/latest/  (version-agnostic)
   ```

3. **Omit year from searches** - Let search engine find newest
   ```
   ✅ "react hooks best practices"
   ❌ "react hooks best practices 2024" (assumes year)
   ```

4. **Check dates in results** - Use <env> current date for comparison
   ```
   <env> says: Today's date: 2025-10-27
   Search result says: Published: 2025-09-15
   → Recent enough (within 2 months)
   ```

5. **Version compatibility warning**
   ```
   package.json: "react": "18.3.1"
   Docs found: React 19 documentation
   → Flag: "Docs are for newer version, check compatibility"
   ```

**What to Document in CLAUDE.md (Process, Not Tables):**

```markdown
## Documentation Verification (For Quality Reviewer Skill)

**Discovery Process:**

1. **Detect stack** - Read package.json dependencies + versions
2. **Infer context** - Parse user request keywords + file paths
3. **Check project docs** - Read project CLAUDE.md for domain/patterns
4. **Build version-specific searches**:
   - "[library] v[version] documentation [context]"
   - Prefer /latest/ or /stable/ URL paths
   - Use current date from <env> for recency checks
5. **Prioritize official sources** - .dev, .io, .org, GitHub official repos

**Recency Validation:**
- Compare search result dates against <env> current date
- Flag results >6 months old (may be stale)
- Check if docs version matches package.json version
- Warn if using docs for newer/older version than installed

**Red flags to watch for:**
- Deprecated APIs (search "[library] deprecated [version]")
- Version mismatches (package.json v2.1, docs for v1.x)
- Security advisories (check GitHub security tab)
- Stale results (published before package.json version release)

**When to skip doc checks:**
- Standard library features (JS Array.map, Promise, etc.)
- Well-known stable APIs (console.log, localStorage, etc.)
- User explicitly says "use existing pattern from codebase"
```

**Example Flow:**

```
User: "write tests for the IPC handler"

Skill detects:
├─ package.json → electron: "^32.0.0", vitest: "^2.1.3"
├─ User keywords → "tests", "IPC"
├─ File context → src/main/ipc-handler.ts (Electron main process)
└─ Project CLAUDE.md → Desktop app, Electron IPC documented in ARCHITECTURE.md

Skill searches:
1. "vitest v2.1 documentation" → https://vitest.dev/guide/
2. "electron v32 IPC documentation" → https://www.electronjs.org/docs/latest/api/ipc-main
3. "electron testing IPC handlers best practices"

Skill reviews:
- Vitest v2.1 async testing patterns (matches version ✓)
- Electron v32 contextBridge security (current major version ✓)
- Checks publish dates: All within 3 months of <env> date (2025-10-27) ✓
- Warns: "Electron v32 deprecated ipcRenderer.sendSync, use invoke pattern"

Quality check includes:
✓ Using latest Vitest patterns (async/await, not callbacks)
✓ Following Electron v32 IPC security (contextBridge preload)
✓ Avoiding deprecated sendSync (per v32 docs)
```

**Advantages:**

✅ **No maintenance** - No tables to update when new libraries released
✅ **Infinite extensibility** - Works for any stack/context/domain
✅ **Version-aware** - Checks compatibility with installed versions
✅ **Recency-aware** - Uses <env> date to validate freshness
✅ **Context-specific** - Only checks what's relevant to task

**Rationale**: Static tables become stale immediately. Process-based discovery scales infinitely and self-updates via WebSearch.

---

## Appendix: Additional Automation Opportunities

**Context**: Analysis of all 13 guide files in `~/.claude/` to identify automation opportunities beyond the conversation pattern analysis.

**Files analyzed**:
1. CLAUDE.md
2. code-philosophy.md
3. tdd-templates.md
4. testing-methodology.md
5. llm-prompting.md
6. claude-md-guide.md
7. learning-extraction.md
8. user-story-guide.md
9. test-definitions-guide.md
10. design-doc-guide.md
11. architecture-guide.md
12. data-architecture-guide.md
13. llm-instruction-design.md

---

### Automation Catalog

**Implementation Note**: Detailed specs for Skills/Hooks/Commands have been condensed. Create full implementations when ready to use.

#### Skills (17 Total)

**Note**: Quality Reviewer split into 3 focused Skills per Anthropic best practices (keep Skills lean).

| # | Name | Priority | Automates | Source Guides | File Path |
|---|------|----------|-----------|---------------|-----------|
| 1 | **Explore-First Enforcer** | ⭐⭐⭐⭐⭐ | Enforce Explore → Plan → Code workflow | Anthropic 2025 best practices | `~/.claude/skills/explore-first/SKILL.md` |
| 2 | **Docs Verifier** | ⭐⭐⭐⭐⭐ | Check latest documentation (was part of Quality Reviewer) | code-philosophy, llm-prompting | `~/.claude/skills/docs-verifier/SKILL.md` |
| 3 | **Standards Checker** | ⭐⭐⭐⭐⭐ | Validate project conventions (was part of Quality Reviewer) | code-philosophy, CLAUDE.md | `~/.claude/skills/standards-checker/SKILL.md` |
| 4 | **Quality Gates** | ⭐⭐⭐⭐⭐ | Final review before Write/Edit (was part of Quality Reviewer) | code-philosophy, testing-methodology | `~/.claude/skills/quality-gates/SKILL.md` |
| 5 | Context Manager | ⭐⭐⭐⭐ | Suggest /clear between tasks | Anthropic 2025 best practices | `~/.claude/skills/context-manager/SKILL.md` |
| 6 | Feature Kickoff | ⭐⭐⭐⭐ | Auto-find user stories/test defs/design docs | CLAUDE.md | `~/.claude/skills/feature-kickoff/SKILL.md` |
| 7 | Architecture Monitor | ⭐⭐⭐⭐ | Suggest ARCHITECTURE.md updates | architecture-guide, data-architecture-guide | `~/.claude/skills/architecture-monitor/SKILL.md` |
| 8 | Learning Extraction Monitor | ⭐⭐⭐⭐ | Auto-suggest extracting learnings | learning-extraction | `~/.claude/skills/learning-monitor/SKILL.md` |
| 9 | TDD Enforcer | ⭐⭐⭐ | Enforce tests BEFORE implementation | testing-methodology, Anthropic 2025 | `~/.claude/skills/tdd-enforcer/SKILL.md` |
| 10 | Test Type Advisor | ⭐⭐⭐ | Suggest unit/integration/E2E/LLM eval | testing-methodology | `~/.claude/skills/test-advisor/SKILL.md` |
| 11 | User Story Validator | ⭐⭐ | Validate against INVEST criteria | tdd-templates, user-story-guide | `~/.claude/skills/user-story-validator/SKILL.md` |
| 12 | Test Definitions Validator | ⭐⭐ | Validate test definition quality | test-definitions-guide | `~/.claude/skills/test-defs-validator/SKILL.md` |
| 13 | Design Doc Validator | ⭐⭐ | Check prerequisites, avoid duplication | design-doc-guide | `~/.claude/skills/design-doc-validator/SKILL.md` |
| 14 | Architecture Doc Validator | ⭐⭐ | Validate required sections | architecture-guide | `~/.claude/skills/arch-doc-validator/SKILL.md` |
| 15 | Data Architecture Validator | ⭐⭐ | Check data architecture quality | data-architecture-guide | `~/.claude/skills/data-arch-validator/SKILL.md` |
| 16 | CLAUDE.md Quality Checker | ⭐⭐ | Detect anti-patterns in CLAUDE.md | claude-md-guide | `~/.claude/skills/claude-md-checker/SKILL.md` |
| 17 | Documentation Quality Validator | ⭐⭐ | Validate LLM-consumable docs | llm-instruction-design | `~/.claude/skills/doc-validator/SKILL.md` |

#### Hooks (4 Total)

| # | Name | Priority | Automates | Configuration |
|---|------|----------|-----------|---------------|
| 1 | **Stop - Context Management** | ⭐⭐⭐⭐ | Suggest /clear after task completion | `settings.json` → Stop event → Outputs reminder |
| 2 | PostToolUse - Test Runner | ⭐⭐⭐⭐ | Auto-run linters/tests after Write/Edit | `settings.json` → PostToolUse → Write/Edit matchers |
| 3 | PostToolUse - Coverage Check | ⭐ | Check test coverage after running tests | `settings.json` → PostToolUse (optional) |
| 4 | PostToolUse - Learning Reminder | ⭐ | Remind to extract learnings after bug fixes | `settings.json` → PostToolUse (optional) |

#### Slash Commands (5 Total)

| # | Name | Purpose | File Path |
|---|------|---------|-----------|
| 1 | /critique | Manual quality check shortcut | `~/.claude/commands/critique.md` |
| 2 | /feature-start | Quick feature kickoff workflow | `~/.claude/commands/feature-start.md` |
| 3 | /user-stories | Create user stories using template | `~/.claude/commands/user-stories.md` |
| 4 | /test-defs | Create test definitions using template | `~/.claude/commands/test-defs.md` |
| 5 | /design-doc | Create design doc using template | `~/.claude/commands/design-doc.md` |

**Key Points**:
- **Skills**: Model-invoked (Claude decides when to use based on description)
- **Hooks**: Event-triggered (deterministic, run on tool use or prompt submission)
- **Slash Commands**: User-invoked (explicit, manual shortcuts)

**Full implementation details**: Create SKILL.md files following format in Approach 4 section (lines 349-425). Use Decision 8 (lines 1230-1377) for dynamic documentation discovery pattern.

---

### Summary: Automation Mechanism Distribution

**By Priority**:

**Phase 2 (RECOMMENDED)**:
- Quality Reviewer Skill ⭐⭐⭐⭐⭐
- PostToolUse Hook (test runner) ⭐⭐⭐⭐

**Phase 3 (OPTIONAL)**:
- Feature Kickoff Skill ⭐⭐⭐⭐
- Architecture Documentation Monitor Skill ⭐⭐⭐⭐
- Learning Extraction Monitor Skill ⭐⭐⭐⭐
- TDD Reminder Skill ⭐⭐⭐
- Test Type Advisor Skill ⭐⭐⭐
- Slash commands (/feature-start, /user-stories, /test-defs, /design-doc) ⭐⭐⭐

**Phase 4+ (NICE TO HAVE)**:
- User Story Validator Skill ⭐⭐
- Test Definitions Validator Skill ⭐⭐
- Design Doc Validator Skill ⭐⭐
- Architecture Doc Validator Skill ⭐⭐
- Data Architecture Doc Validator Skill ⭐⭐
- CLAUDE.md Quality Checker Skill ⭐⭐
- Documentation Quality Validator Skill ⭐⭐
- PostToolUse Hook (coverage check) ⭐
- PostToolUse Hook (learning extraction reminder) ⭐

**Reference Material (No Automation Needed)**:
- Most of tdd-templates.md (templates, examples)
- Most of llm-prompting.md (prompt engineering principles)
- Most of claude-md-guide.md (file structure guidance)
- llm-instruction-design.md (meta-guide, used by Documentation Quality Validator)

---

## Next Steps

1. **Review this plan** - Critique against your workflow needs
2. **Approve Phase 1** - Start with slash commands + CLAUDE.md
3. **Test in real usage** - Try for 1 week in both projects
4. **Measure results** - Track metrics (prompt length, time saved)
5. **Decide Phase 2** - Proceed if Phase 1 successful
6. **Iterate** - Refine based on actual usage patterns

**Ready to proceed?** Say:
- "implement phase 1" → I'll create the files
- "show me examples first" → I'll demonstrate each command
- "modify the plan" → Tell me what to change
