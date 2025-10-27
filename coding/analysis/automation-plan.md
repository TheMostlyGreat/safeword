# Claude Code Automation Plan: Quality Control Workflow

**Goal**: Eliminate repetitive "double check and critique" prompts while maintaining quality standards

**Based on**: Conversation pattern analysis across soulless-monorepo (1,319 messages) and bitd (8,732 messages)

**Key Pattern Identified**: 7% of soulless-monorepo and 4% of bitd prompts are quality control rituals that can be automated

**Updated**: 2025-10-26 - Added analysis of Subagents, Skills, Hooks, and MCP Servers

---

## Executive Summary

After comprehensive analysis of all automation mechanisms (Hooks, Skills, Subagents, MCP Servers), the recommended approach is:

**Phase 1** (✅ COMPLETED): Settings.json improvements → 78% fewer approval prompts
**Phase 2** (⭐ RECOMMENDED): Skills + PostToolUse Hooks → Eliminate all 347 quality check prompts
**Phase 3** (OPTIONAL): UserPromptSubmit Hook → If Phase 2 insufficient
**Phase 4** (FUTURE): MCP Servers → Only for external integrations (GitHub PR automation, database validation)

**Why NOT Subagents or MCP Servers for Phase 2**:
- ❌ Subagents: Too slow (context switching), lack conversation history
- ❌ MCP Servers: External dependencies, cost, complexity, no conversation context
- ✅ Skills: Fast, context-aware, automatic activation, perfect fit

### Quick Reference: Top Automation Opportunities

| Mechanism | Name | Priority | Impact | Effort | ROI | Source Guide |
|-----------|------|----------|--------|--------|-----|--------------|
| **Skill** | Quality Reviewer | ⭐⭐⭐⭐⭐ | Eliminates 347+ prompts (4% of messages) | 1-2 hrs | Very High | code-philosophy.md, testing-methodology.md |
| **Hook** | PostToolUse - Test Runner | ⭐⭐⭐⭐ | Auto-run tests after every edit | 30 min | High | testing-methodology.md |
| **Skill** | Feature Kickoff | ⭐⭐⭐⭐ | Auto-find user stories/tests/design docs | 1 hr | High | CLAUDE.md |
| **Skill** | Architecture Monitor | ⭐⭐⭐⭐ | Suggest arch doc updates | 1 hr | High | architecture-guide.md, data-architecture-guide.md |
| **Skill** | Learning Extraction Monitor | ⭐⭐⭐⭐ | Auto-suggest learnings extraction | 1 hr | High | learning-extraction.md |
| **Skill** | TDD Reminder | ⭐⭐⭐ | Remind to write tests BEFORE implementation | 45 min | Medium | testing-methodology.md |
| **Skill** | Test Type Advisor | ⭐⭐⭐ | Suggest unit/integration/E2E/LLM eval | 45 min | Medium | testing-methodology.md |
| **Slash Cmd** | /critique | ⭐⭐⭐ | Manual quality check shortcut | 15 min | Medium | Phase 1 plan |
| **Slash Cmd** | /feature-start | ⭐⭐⭐ | Quick feature kickoff workflow | 15 min | Medium | CLAUDE.md |
| **Slash Cmd** | /user-stories, /test-defs, /design-doc | ⭐⭐⭐ | Quick doc creation shortcuts | 30 min | Medium | CLAUDE.md |

**Total identified**: 13 Skills, 3 Hooks, 5 Slash Commands (21 automation opportunities)

**Implementation recommendation**: Start with Quality Reviewer Skill + PostToolUse Hook (Phase 2), then add Feature Kickoff + Architecture Monitor (Phase 3).

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
| **Skills** | ⭐⭐⭐⭐⭐ | Low | Auto quality checks | ✅ PERFECT |
| **PostToolUse Hook** | ⭐⭐⭐⭐ | Medium | Post-code validation | ✅ EXCELLENT |
| **UserPromptSubmit Hook** | ⭐⭐⭐⭐⭐ | Medium | Prompt enrichment | ⚠️ TOO DUMB |
| **Enhanced CLAUDE.md** | ⭐⭐⭐ | Low | Baseline behavior | ✅ GOOD |
| **Slash Commands** | ⭐⭐⭐⭐ | Low | Quick shortcuts | ✅ GOOD |
| **Subagents** | ⭐⭐⭐⭐ | High | Long analysis | ❌ OVERKILL |
| **MCP Servers** | ⭐⭐⭐⭐ | High | External integrations | ❌ WRONG TOOL |

**Recommended combo**: Skills (auto checks) + PostToolUse Hook (validation) + Slash Commands (shortcuts)

### Approach 1: UserPromptSubmit Hook (MOST POWERFUL)

**Power Level**: ⭐⭐⭐⭐⭐
**Effort**: Medium (30 min)
**Impact**: Eliminates 80% of repetitive prompts

**What it does**: Automatically enriches EVERY prompt with quality criteria

**File**: `~/.claude/hooks/quality-auto-append.yaml`

```yaml
name: auto-quality-check
on:
  event: user-prompt-submit
  conditions:
    - type: regex
      pattern: '(?i)^(yes|yes please|ok|proceed|do it|make.*change|implement)$'

script: |
  #!/bin/bash
  # Original prompt is in $PROMPT

  QUALITY_CHECKLIST="

  Before implementing, double check and critique your work:
  - Is it correct? Will it actually work?
  - Is it elegant? Simplest solution without bloat?
  - Does it adhere to the plan/template/guide?
  - Does it follow the latest best practices and documentation?
  - Ask non-obvious questions you can't research yourself (don't be lazy)"

  echo "$PROMPT$QUALITY_CHECKLIST"
```

**Result**:
- User types: `yes`
- Claude receives: `yes\n\nBefore implementing, double check and critique...`

**Pros**:
- Zero typing - automatic every time
- Consistent quality standards
- Works across all projects

**Cons**:
- May trigger on unintended short prompts (needs pattern refinement)
- Can feel verbose if Claude already did quality check

**Decision**: Implement in Phase 3 after testing other approaches

---

### Approach 2: PostToolUse Hook (AUTO-VALIDATION)

**Power Level**: ⭐⭐⭐⭐
**Effort**: Medium (45 min - requires testing)
**Impact**: Catches issues immediately after changes

**What it does**: Automatically runs quality checks AFTER Claude makes changes

**File**: `~/.claude/hooks/post-code-validation.yaml`

```yaml
name: auto-code-critique
on:
  event: post-tool-use
  tools:
    - Write
    - Edit

script: |
  #!/bin/bash
  # $TOOL_NAME contains the tool used
  # $FILE_PATH contains the file that was modified (if applicable)

  echo "🔍 Running automated quality checks..."

  # 1. Run formatters if package.json has format script
  if [ -f "package.json" ] && grep -q '"format"' package.json; then
    echo "✓ Running formatter..."
    npm run format 2>&1 | tail -5
  fi

  # 2. Run linters if available
  if [ -f "package.json" ] && grep -q '"lint"' package.json; then
    echo "✓ Running linter..."
    npm run lint 2>&1 | tail -5
  fi

  # 3. Run type checker if available
  if [ -f "tsconfig.json" ]; then
    echo "✓ Running type check..."
    npx tsc --noEmit 2>&1 | tail -10
  fi

  # 4. Provide feedback to Claude
  cat <<EOF

  ✅ AUTOMATED QUALITY CHECK COMPLETE

  Review the output above. If any issues found:
  1. Fix them now before proceeding
  2. Run tests to verify
  3. Apply quality criteria: correct, elegant, adheres to standards, avoids bloat

  If no issues, respond with status and proceed to next task.
  EOF

decision: block-with-feedback
```

**Result**: Every Write/Edit triggers validation + forces Claude to review results

**Pros**:
- Catches issues immediately
- Deterministic - always runs
- Integrates with existing tooling (npm scripts)

**Cons**:
- Requires npm scripts to be configured
- May slow down iteration if tools are slow
- Can produce noise if many warnings

**Decision**: Implement in Phase 2 after slash commands working

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

### Approach 4: Agent Skills (AUTO-INVOKED QUALITY REVIEW)

**Power Level**: ⭐⭐⭐⭐⭐
**Effort**: High (1 hour - includes testing)
**Impact**: Eliminates need for manual quality check invocation

**What it does**: Claude automatically invokes quality checks when relevant (no manual trigger)

**File**: `~/.claude/skills/quality-reviewer/SKILL.md`

```yaml
---
name: quality-reviewer
description: |
  Automatically review code changes for correctness, elegance, and adherence to standards.

  **CRITICAL: Invoke this skill BEFORE implementing any code changes you propose.**

  Use when:
  - About to Write or Edit code files (implementation proposals)
  - Proposing architectural changes or new components
  - User says "yes"/"proceed"/"implement" after your proposal

  Do NOT use for:
  - Simple file reads or searches
  - Documentation-only updates
  - Answering user questions (no code changes)
  - Already in middle of implementation (too late)

  Invoke BEFORE implementation, not during or after.

allowed-tools:
  - Read
  - Grep
  - Glob
  - WebFetch
  - WebSearch
---

# Quality Review Protocol

When invoked, perform this comprehensive review:

## Step 1: Latest Documentation Verification

For EVERY external library/framework/tool used:

1. Identify all dependencies
2. Check package.json versions (if applicable)
3. Look up latest documentation using WebFetch/WebSearch
4. Verify API compatibility
5. Check for deprecated patterns
6. Note any new features that might be better

**Output format:**
```
📚 LATEST DOCS VERIFIED:
- [library] v[version]: [key findings, breaking changes, recommendations]
```

## Step 2: Standards Adherence Check

1. Read project CLAUDE.md (or AGENTS.md) for conventions
2. Read relevant existing code for patterns
3. Verify proposed changes match established patterns
4. Check file/folder organization follows structure
5. Confirm naming conventions match

**Output format:**
```
📋 STANDARDS REVIEW:
- Conventions followed: [list]
- Deviations (if any): [list with justification]
```

## Step 3: Quality Criteria Evaluation

Evaluate proposed changes against criteria:

### Correctness
- Will it actually work?
- Edge cases handled? (null, undefined, empty arrays, boundary values)
- Error handling complete?
- Type safety maintained?

### Elegance
- Is this the simplest solution?
- Any over-engineering or bloat?
- Can it be simplified further?
- Readable and maintainable?

### Testability
- Can we write tests for this?
- What's the testing strategy? (unit/integration/e2e)
- Are edge cases testable?

**Output format:**
```
✅ QUALITY EVALUATION:

Correctness: [PASS/CONCERN] - [reasoning]
Elegance: [PASS/CONCERN] - [reasoning]
Testability: [PASS/CONCERN] - [strategy]
```

## Step 4: Final Recommendation

Provide structured output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 QUALITY REVIEW COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PASSES:
- [aspects that meet all standards]

⚠️ CONCERNS:
- [potential issues, trade-offs, or limitations]

📚 DOCS VERIFIED:
- [library]: v[version] - [findings]

🎯 RECOMMENDATION: [Choose one]
├─ ✅ PROCEED: All quality criteria met, ready to implement
├─ 🔄 REVISE: Concerns found, here's what to change first...
└─ ❓ USER INPUT: Multiple valid approaches, need user decision on...

[If PROCEED]: Awaiting approval ("yes"/"implement"/"proceed")
[If REVISE]: Awaiting approval after reviewing suggested changes
[If USER INPUT]: [Specific question that can't be researched]
```

## Step 5: Escalation Rules

**Ask user if and only if:**
- Multiple valid approaches exist with unclear trade-offs
- Domain-specific knowledge required (business rules, game mechanics, UX preferences)
- Breaking changes needed (migration required, user impact)
- Can't find answer in docs/codebase after thorough search

**DO NOT ask about:**
- Things documented in official library docs
- Implementation details you can figure out
- Preferences already documented in CLAUDE.md
- Standard engineering practices

## Step 6: Quality Gates

Before recommending PROCEED, verify:

- [ ] All libraries documented with latest versions checked
- [ ] No deprecated patterns used
- [ ] Follows project conventions
- [ ] Edge cases identified and handled
- [ ] Error handling complete
- [ ] No obvious bloat or over-engineering
- [ ] Testing strategy clear
- [ ] Non-obvious questions asked (if any)

If ALL boxes checked → PROCEED
If ANY box unchecked → REVISE or USER INPUT
```

**Supporting file**: `~/.claude/skills/quality-reviewer/examples.md`

```markdown
# Quality Review Examples

## Example 1: Simple Component (PASS)

**Proposed change**: Add loading spinner component

**Review output:**
```
📚 LATEST DOCS VERIFIED:
- react v18.3.1: No breaking changes, hooks patterns stable

📋 STANDARDS REVIEW:
- Matches existing component patterns in src/components/
- Uses project's CSS module convention
- Follows naming: PascalCase component, camelCase file

✅ QUALITY EVALUATION:
Correctness: PASS - Simple boolean prop, renders conditionally
Elegance: PASS - 15 lines, no bloat, reusable
Testability: PASS - Easy unit test (render with/without prop)

🎯 RECOMMENDATION: ✅ PROCEED
All quality criteria met. Ready to implement.
Awaiting approval.
```

## Example 2: Complex Feature (REVISE)

**Proposed change**: Add real-time collaboration with WebSockets

**Review output:**
```
📚 LATEST DOCS VERIFIED:
- socket.io v4.7.2: New connection handling API (changed since v3)
- zustand v4.5.0: No built-in devtools for debugging socket state

⚠️ CONCERNS:
1. No error handling for connection failures
2. Message queue could grow unbounded (memory leak)
3. No reconnection strategy
4. Testing strategy unclear (how to mock WebSocket?)

🎯 RECOMMENDATION: 🔄 REVISE
Address concerns before implementing:
1. Add exponential backoff reconnection
2. Implement message queue size limit (100 messages)
3. Add WebSocket mock for testing
Then re-run quality check.
```

## Example 3: Architecture Decision (USER INPUT)

**Proposed change**: Migrate state management from Context to Zustand

**Review output:**
```
📚 LATEST DOCS VERIFIED:
- zustand v4.5.0: Supports React 18, simpler than Redux
- react v18.3.1: Context performance improved with useMemo

⚠️ CONCERNS:
- Two valid approaches with different trade-offs:

  **Option A: Zustand**
  + Simpler API, less boilerplate
  + Better performance (no Context re-renders)
  - New dependency (4KB)
  - Team needs to learn new pattern

  **Option B: Keep Context + optimize**
  + No new dependencies
  + Team already familiar
  - More boilerplate
  - Requires careful useMemo usage

🎯 RECOMMENDATION: ❓ USER INPUT

Question: Which matters more for this project:
1. Simplicity + performance (choose Zustand)
2. Zero new dependencies + team familiarity (optimize Context)

I can't determine this from code/docs - requires your project priorities.
```
```

**Pros**:
- Completely automatic - no manual invocation
- Works across all projects
- Most "intelligent" approach (Claude decides when to use)
- Comprehensive quality checks

**Cons**:
- Complex to set up and test
- May fire at wrong times (needs tuning)
- Harder to debug if misbehaving
- Requires clear triggering conditions

**Decision**: Implement in Phase 2 after slash commands proven

---

### Approach 5: Enhanced CLAUDE.md (BASELINE BEHAVIOR)

**Power Level**: ⭐⭐⭐
**Effort**: Low (10 min)
**Impact**: Establishes baseline expectations

**What it does**: Embeds quality standards directly in Claude's instructions (every session)

**File**: `~/.claude/CLAUDE.md` (add new section)

```markdown
## Quality Standards (CRITICAL - Always Apply)

**Before proposing ANY code changes, you MUST:**

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

---

## Testing Standards

**After any code changes:**
- Run existing test suite (if available)
- Report results before completion
- If tests fail: fix them (don't ask user to run tests)

**Test pyramid**: 70% unit, 20% integration, 10% e2e

**For test writing**: See `@~/.claude/testing-methodology.md` for comprehensive TDD workflow.

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

## Appendix: Pattern Analysis Data

### soulless-monorepo (1,319 user messages)

**Top patterns**:
- "double check and critique" variants: 95 messages (7%)
- "yes" / approval: 4 unique variants, frequent
- "does it adhere to latest docs": 95 messages (7%)
- "avoid bloat": appears in most critiques
- "don't be lazy": 3 explicit mentions

**Focus**: Meta-work, documentation, process definition

---

### bitd (8,732 user messages)

**Top patterns**:
- "double check and critique" variants: 347 messages (4%)
- "yes please": 5 variations
- Domain-specific: "blades", "game", "mechanics" frequent
- Template adherence: "follow the guide/template"
- Iteration depth: "again just in case" very common

**Focus**: Implementation, domain fidelity, TDD workflow

---

### Combined Insights (10,051 total messages)

**Universal patterns**:
1. Quality triad: correct + elegant + adherent
2. Latest docs obsession: training data staleness awareness
3. Anti-bloat vigilance: complexity aversion
4. Terse approvals: "yes" after comprehensive review
5. Self-sufficiency directive: "don't be lazy"
6. Multiple verification passes: "again just in case"

**Workflow signature**:
```
PROPOSE → CRITIQUE → REVISE → APPROVE → VERIFY → EXECUTE → NEXT
```

**Key insight**: You've industrialized quality control through ritualistic prompts. Automation should maintain the ritual while eliminating the typing.

---

## Guide-Specific Automation Opportunities

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

### Skills Identified from Guides

#### 1. Quality Reviewer Skill (PRIORITY 1 - Phase 2)

**Source**: code-philosophy.md Self-Review Checklist, testing-methodology.md, llm-prompting.md

**What it automates**: The "double check and critique" ritual (347+ prompts in bitd)

**Checks**:
- ✓ Is it correct? Will it actually work?
- ✓ Is it elegant? Does it avoid bloat?
- ✓ Does it follow best practices?
- ✓ Are you using the right docs/versions? (WebFetch latest documentation)
- ✓ Have you tested the user-facing functionality?
- ✓ Test quality (AAA pattern, test naming, independence, async patterns)
- ✓ Anti-patterns (testing at wrong level, implementation details)
- ✓ Cost optimization for AI features (prompt caching properly used)

**When to activate**: Before Write/Edit tools, when user says "yes"/"proceed"/"implement"

**Mechanism**: Skill (model-invoked, auto-activation)

**Implementation example** (`~/.claude/skills/quality-reviewer/SKILL.md`):

```yaml
---
name: quality-reviewer
description: |
  Automatically review code changes for correctness, elegance, and standards adherence.

  Use PROACTIVELY when:
  - About to Write or Edit code files
  - User says "yes"/"proceed"/"implement" after proposal
  - Proposing architectural changes

  Must evaluate using checklist:
  - Correctness: Will it actually work? Edge cases handled?
  - Elegance: Avoids bloat? Simple, focused solution?
  - Best practices: Follows domain conventions? Latest docs verified?
  - Testability: Can be tested? Tests written first (TDD)?
  - Anti-patterns: Testing at wrong level? Implementation details exposed?

  Return structured critique:
  - PROCEED: All checks pass, ready to implement
  - REVISE: Issues found, provide specific fixes
  - USER INPUT: Need clarification, ask specific question

allowed-tools:
  - Read
  - Grep
  - Glob
  - WebFetch
  - WebSearch
---

# Quality Review Protocol

## When to Activate

**ALWAYS activate before:**
1. Using Write or Edit tools
2. User approval signals ("yes", "proceed", "implement", "do it")
3. Proposing architectural changes

**NEVER activate for:**
- Conversational responses (no code changes)
- Reading/searching files
- Already-approved minor edits (typo fixes)

## Review Checklist

### 1. Correctness Check

**Ask:**
- Will this code actually work?
- Are edge cases handled?
- Are error conditions caught?

**Actions:**
- Read relevant existing code
- Check for type safety
- Verify logic against requirements

### 2. Elegance Check

**Ask:**
- Is this the simplest solution?
- Does it avoid unnecessary complexity?
- Is it self-documenting?

**Red flags:**
- >50 lines for simple feature
- Nested callbacks/promises (use async/await)
- Duplicated logic (extract to function)

### 3. Best Practices Check

**Ask:**
- Does this follow domain conventions?
- Are we using the latest library patterns?
- Is documentation current?

**Actions:**
- WebFetch latest docs if library version unclear
- Check for deprecated patterns
- Verify against CLAUDE.md standards

### 4. Testability Check

**Ask:**
- Can this be tested?
- Were tests written first (TDD)?
- Right test type (unit/integration/E2E)?

**Red flags:**
- No tests for new logic
- Implementation before tests (TDD violation)
- Testing at wrong level (E2E for business logic)

### 5. Anti-Pattern Check

**Ask:**
- Testing implementation details?
- Exposing internals?
- Premature optimization?

**Common anti-patterns:**
- Testing private methods
- Testing CSS classes instead of behavior
- Complex mocking (sign of poor design)

## Output Format

**PROCEED:**
```
Quality review complete ✓

Correctness: ✓ Edge cases handled
Elegance: ✓ Simple, focused solution
Best practices: ✓ Follows latest React patterns
Testability: ✓ Tests written first (TDD)
Anti-patterns: ✓ None detected

Ready to implement.
```

**REVISE:**
```
Quality review - issues found:

Correctness: ⚠️ Missing error handling for network failure
Elegance: ⚠️ 85 lines - consider extracting validation logic
Best practices: ✓ Follows conventions
Testability: ❌ Tests not written yet (TDD violation)

Suggested revisions:
1. Add try/catch around fetch call
2. Extract validation to separate function
3. Write failing tests before implementation

Should I apply these fixes?
```

**USER INPUT:**
```
Quality review - need clarification:

Correctness: ✓ Logic looks correct
Elegance: ? Should this be a hook or component?
Best practices: ? Which state management pattern to use?

Questions:
1. Do you prefer custom hook or component for this reusable logic?
2. Use Zustand (current pattern) or Context API?

Please clarify so I can proceed with review.
```
```

---

#### 2. Feature Kickoff Skill

**Source**: CLAUDE.md Feature Development Workflow

**What it automates**: Searching for user stories, test definitions, design docs when starting a feature

**Checks**:
- Search `planning/user-stories/` or `docs/user-stories/`
- Search `planning/test-definitions/` or `docs/test-definitions/`
- Search `planning/design/` or `docs/design/` (if complex feature: >3 components, new data model, architectural decisions)
- Offer to create if not found

**When to activate**: User mentions feature/issue number, says "implement [feature]", "work on issue #N"

**Mechanism**: Skill (model-invoked)

**Implementation example** (`~/.claude/skills/feature-kickoff/SKILL.md`):

```yaml
---
name: feature-kickoff
description: |
  Automatically search for user stories, test definitions, and design docs when starting a feature.

  Use PROACTIVELY when:
  - User mentions feature or issue number ("implement #45", "work on issue #123")
  - User says "implement [feature name]"
  - User says "start working on [feature]"

  Search for prerequisite documents in order:
  1. User stories (planning/user-stories/ or docs/user-stories/)
  2. Test definitions (planning/test-definitions/ or docs/test-definitions/)
  3. Design doc (planning/design/ or docs/design/) if complex feature

  Complex feature criteria:
  - >3 components
  - New data model
  - Architectural decisions

  If not found: Offer to create using templates

allowed-tools:
  - Glob
  - Grep
  - Read
---

# Feature Kickoff Protocol

## When to Activate

**Pattern matching triggers:**
- "implement #N" / "work on issue #N" / "fix #N"
- "implement [feature name]"
- "start [feature]" / "work on [feature]"
- "let's build [feature]"

**Example phrases:**
- ✅ "implement the three-pane layout"
- ✅ "work on issue #45"
- ✅ "start building user authentication"
- ❌ "tell me about authentication" (informational, not implementation)

## Workflow

### Step 1: Search for User Stories

**Search paths** (in order):
1. `planning/user-stories/*[feature-name]*.md`
2. `docs/user-stories/*[feature-name]*.md`
3. `planning/user-stories/*#[issue-number]*.md`
4. `docs/user-stories/*#[issue-number]*.md`

**If found:**
- Read the file
- Confirm: "Found user stories at [path]. Reading them now."

**If not found:**
- Ask: "I didn't find user stories. Do they exist elsewhere?"
- Offer: "Would you like me to create user stories using the template?"

### Step 2: Search for Test Definitions

**Search paths** (in order):
1. `planning/test-definitions/*[feature-name]*.md`
2. `docs/test-definitions/*[feature-name]*.md`
3. `planning/test-definitions/*#[issue-number]*.md`
4. `docs/test-definitions/*#[issue-number]*.md`

**If found:**
- Read the file
- Confirm: "Found test definitions at [path]. Reading them now."

**If not found:**
- Ask: "I didn't find test definitions. Do they exist elsewhere?"
- Offer: "Would you like me to create test definitions using the template?"

### Step 3: Check if Design Doc Needed

**Ask:** Is this a complex feature?

**Complex feature criteria:**
- >3 components involved
- New data model (entities, relationships, schema)
- Architectural decisions (tech choices, patterns)

**If YES (complex):**
- Search for design doc in `planning/design/` or `docs/design/`
- If not found: Offer to create design doc

**If NO (simple):**
- Skip design doc
- Proceed to implementation

### Step 4: Summary

**Output format:**
```
Feature kickoff complete:

User stories: ✓ Found at planning/user-stories/45-three-pane-layout.md
Test definitions: ✓ Found at planning/test-definitions/45-three-pane-layout-tests.md
Design doc: ✓ Found at planning/design/three-pane-layout-design.md

Ready to proceed with TDD implementation.
```

**If missing prerequisites:**
```
Feature kickoff - missing prerequisites:

User stories: ❌ Not found
Test definitions: ❌ Not found
Design doc: N/A (simple feature, not needed)

I can create these using templates. Should I:
1. Create user stories first
2. Create test definitions
3. Proceed without docs (not recommended)
```
```

---

#### 3. Architecture Documentation Monitor Skill

**Source**: CLAUDE.md, architecture-guide.md, data-architecture-guide.md

**What it automates**: Suggesting when to update ARCHITECTURE.md, DATA_ARCHITECTURE.md, or use Design Doc

**Decision trees**:

**Architecture Doc when**:
- Making technology choices (state management, database, frameworks)
- Designing data models or schemas
- Establishing project-wide patterns/conventions
- Discovering architectural insights during implementation
- Recording "why" behind major decisions

**Data Architecture Doc when**:
- Project initialization
- Adding new data store (database, cache, file system)
- Changing data model (schema, entities, relationships)
- Data flow integration (API, ETL, sync)

**Design Doc when**:
- Implementing a specific feature
- Documenting component interactions for one feature
- Feature-specific technical decisions

**Tie-breaking rule**: If decision affects 2+ features or multiple developers → Architecture doc. If feature-specific only → Design doc.

**When to activate**: After discussing architectural decisions, detecting tech choice discussions, data model changes

**Mechanism**: Skill (model-invoked)

**Implementation example** (`~/.claude/skills/architecture-monitor/SKILL.md`):

```yaml
---
name: architecture-monitor
description: |
  Automatically suggest when to update ARCHITECTURE.md, DATA_ARCHITECTURE.md, or use Design Doc.

  Use PROACTIVELY when detecting:
  - Technology choice discussions (state management, database, frameworks)
  - Data model design (schema, entities, relationships)
  - Project-wide patterns/conventions
  - Architectural insights discovered during implementation
  - "Why" behind major decisions

  Decision tree (answer IN ORDER, stop at first YES):
  1. Project initialization? → Suggest creating ARCHITECTURE.md
  2. Adding new data store? → Suggest updating DATA_ARCHITECTURE.md
  3. Changing data model? → Suggest updating DATA_ARCHITECTURE.md or ARCHITECTURE.md
  4. Data flow integration? → Suggest updating DATA_ARCHITECTURE.md
  5. Making technology choice? → Suggest updating ARCHITECTURE.md
  6. Establishing project-wide pattern? → Suggest updating ARCHITECTURE.md
  7. Implementing specific feature? → Suggest Design Doc

  Tie-breaking rule: If affects 2+ features or multiple developers → Architecture doc.
                      If feature-specific only → Design doc.

allowed-tools:
  - Read
  - Glob
  - Grep
---

# Architecture Documentation Monitor Protocol

## Detection Triggers

**Technology choice discussions:**
- Keywords: "should we use", "which library", "Zustand vs Redux", "PostgreSQL vs MongoDB"
- Example: "Should we use Zustand or Redux for state management?"
- Action: Suggest ARCHITECTURE.md update

**Data model discussions:**
- Keywords: "schema", "entities", "relationships", "database design", "tables", "collections"
- Example: "We need to add user profiles with addresses and preferences"
- Action: Suggest DATA_ARCHITECTURE.md update

**Pattern discussions:**
- Keywords: "convention", "pattern", "standard approach", "how should we", "coding style"
- Example: "How should we handle error boundaries in React components?"
- Action: Suggest ARCHITECTURE.md update

**Architectural insights:**
- Keywords: "discovered", "realized", "found out", "turns out", "learned"
- Example: "Turns out localStorage has 5MB limit, we need IndexedDB"
- Action: Suggest ARCHITECTURE.md update (document the discovery)

## Decision Tree

**Answer IN ORDER (stop at first YES):**

1. **Project initialization?**
   - YES → Suggest: "This is a new project. Should I create ARCHITECTURE.md to document our initial decisions?"
   - NO → Continue to #2

2. **Adding new data store?** (database, cache, file system)
   - YES → Suggest: "We're adding [data store]. Should I update DATA_ARCHITECTURE.md to document this?"
   - NO → Continue to #3

3. **Changing data model?** (schema, entities, relationships)
   - YES → Suggest: "Data model is changing. Should I update DATA_ARCHITECTURE.md (or ARCHITECTURE.md if no separate file)?"
   - NO → Continue to #4

4. **Data flow integration?** (API, ETL, sync)
   - YES → Suggest: "This involves data flow integration. Should I update DATA_ARCHITECTURE.md?"
   - NO → Continue to #5

5. **Making technology choice?** (state management, database, frameworks)
   - YES → Suggest: "We're choosing [technology]. Should I update ARCHITECTURE.md to document this decision with rationale?"
   - NO → Continue to #6

6. **Establishing project-wide pattern?** (conventions, standards)
   - YES → Suggest: "This pattern will apply project-wide. Should I document it in ARCHITECTURE.md?"
   - NO → Continue to #7

7. **Implementing specific feature?**
   - YES → Suggest: "This is feature-specific. Should I create a Design Doc at planning/design/[feature-name]-design.md?"
   - NO → Don't suggest documentation

**Tie-breaking rule:**
- If decision affects 2+ features or multiple developers → ARCHITECTURE.md
- If feature-specific only → Design Doc

**Edge cases:**
- Feature adds 3+ entities → DATA_ARCHITECTURE.md (impacts data model)
- Bug fix changes schema → DATA_ARCHITECTURE.md (schema changes always documented)
- Feature uses existing data model → Design Doc only (references architecture)

## Output Format

**Suggestion example:**
```
Architecture documentation needed:

Context: Discussing Zustand vs Redux for state management
Decision: Affects all future components (project-wide)
Recommendation: Update ARCHITECTURE.md

Should I document this decision with:
- What: Using Zustand for state management
- Why: Simple API, 1KB size, TypeScript-first, sufficient for single-user desktop app
- Trade-off: No time-travel debugging (not needed for this use case)
- Alternative considered: Redux (rejected due to boilerplate overhead)

Would you like me to add this to ARCHITECTURE.md?
```

**Timing:**
- Suggest DURING discussion (proactive, before decision is forgotten)
- Suggest AFTER implementation (when insight is discovered)
- Don't suggest multiple times for same decision

**Frequency:**
- First mention → Suggest documentation
- User declines → Don't suggest again for this decision
- User accepts → Add to ARCHITECTURE.md immediately
```

---

#### 4. Learning Extraction Monitor Skill

**Source**: CLAUDE.md, learning-extraction.md

**What it automates**: Suggesting extracting learnings when recognition triggers detected

**Recognition triggers**:
1. Debugging >30 minutes - Non-obvious bug requiring investigation
2. Trial and error - Tried 3+ approaches before finding the right one
3. Undocumented gotcha - Not in official library/framework docs
4. Integration struggle - Two tools that don't work together smoothly
5. Testing trap - Tests pass but UX is broken (or vice versa)
6. Architectural insight - Discovered during implementation, not planned upfront

**Suggestion timing**:
- **High confidence** - Suggest IMMEDIATELY DURING debugging
- **Medium confidence** - Ask AFTER completing task
- **Low confidence** - Don't suggest (simple fix <15 min, well-documented, one-off)

**When to activate**: During/after debugging sessions, after trial and error, after architectural discoveries

**Mechanism**: Skill (model-invoked)

---

#### 5. TDD Reminder Skill

**Source**: testing-methodology.md

**What it automates**: Reminding to write tests BEFORE implementation (RED → GREEN → REFACTOR)

**Checks**:
- Remind to write failing tests first (RED phase)
- Confirm tests fail for the right reason before implementation
- No mock implementations during RED phase
- Run single tests for performance (`npm test -- path/to/file.test.ts`)

**When to activate**: User says "implement [feature]", before Write/Edit tools

**Mechanism**: Skill (model-invoked)

---

#### 6. Test Type Advisor Skill

**Source**: testing-methodology.md

**What it automates**: Suggesting which test type to write (unit/integration/E2E/LLM eval)

**Decision tree**:
1. AI content quality? → LLM Eval
2. Requires real browser? → E2E test
3. Multiple components? → Integration test
4. Pure function? → Unit test

**Optimization rule**: Test with the fastest test type that can catch the bug

**Tie-breaking rule**: If multiple test types apply, choose the faster one

**When to activate**: User says "write tests for [feature]", during test creation

**Mechanism**: Skill (model-invoked)

---

#### 7. User Story Validator Skill

**Source**: tdd-templates.md, user-story-guide.md

**What it automates**: Validating user stories against INVEST criteria and quality checks

**INVEST validation**:
- [ ] **Independent** - Can be completed without depending on other stories
- [ ] **Negotiable** - Details emerge through conversation, not a fixed contract
- [ ] **Valuable** - Delivers clear value to user or business
- [ ] **Estimable** - Team can estimate effort (not too vague, not too detailed)
- [ ] **Small** - Completable in one sprint/iteration (typically 1-5 days)
- [ ] **Testable** - Clear acceptance criteria define when it's done

**Quality checks**:
- AC are specific, user-facing, testable (not vague/technical)
- Size guidelines (not too big: >5 AC, multiple personas; not too small: trivial change)

**When to activate**: After creating user stories, before saving

**Mechanism**: Skill (model-invoked)

---

#### 8. Test Definitions Validator Skill

**Source**: test-definitions-guide.md

**What it automates**: Validating test definitions for quality

**Checks**:
- Test names are descriptive/specific (not vague/technical)
- Steps are clear, actionable (not vague/incomplete)
- Expected outcomes are specific, testable assertions (not vague)

**When to activate**: After creating test definitions, before saving

**Mechanism**: Skill (model-invoked)

---

#### 9. Design Doc Validator Skill

**Source**: design-doc-guide.md

**What it automates**: Validating design docs for quality and prerequisite verification

**Prerequisite checks**:
- User stories exist (if not, create them first)
- Test definitions exist (if not, create them first)

**Quality checks**:
- Not duplicating user stories (reference them instead)
- Not duplicating test definitions (reference them instead)
- Not including project-wide architecture decisions (those go in ARCHITECTURE.md)
- Not including implementation details that should be in code comments
- Not including generic advice without project-specific context

**When to activate**: When creating design docs

**Mechanism**: Skill (model-invoked)

---

#### 10. Architecture Doc Validator Skill

**Source**: architecture-guide.md

**What it automates**: Validating architecture docs for quality

**Required sections**:
- Header (version, last updated, status)
- Table of contents
- Overview
- Data architecture principles (What, Why, Trade-off)
- Data model/schema
- Component design
- Data flow patterns
- Key decisions (What, Why, Trade-off, Alternatives Considered)
- Best practices
- Migration strategy

**Anti-patterns**:
- Too many separate files (ADR-001, ADR-002...) → Use one comprehensive document
- No decision rationale → Every decision needs "WHY" with specifics
- Missing version/status → Readers need current vs proposed
- Implementation details instead of principles → Keep high-level
- Repeating architecture content in design docs → Reference, don't duplicate
- Skipping user flow in design docs → Always show step-by-step interaction
- Missing test mapping in design docs → Link to test definitions

**When to activate**: When creating/updating ARCHITECTURE.md

**Mechanism**: Skill (model-invoked)

---

#### 11. Data Architecture Doc Validator Skill

**Source**: data-architecture-guide.md

**What it automates**: Validating data architecture docs for quality

**Common mistakes**:
- No source of truth defined → Conflicting data in multiple stores
- Missing validation rules → Invalid data written to persistence
- No migration strategy → Breaking changes brick user data
- Outdated documentation → Schema and docs don't match (worse than no docs)
- Implementation details in architecture doc → Save for design docs
- Ignoring performance targets → Slow queries degrade UX

**Best practices checklist**:
- [ ] Principles follow What/Why/Document/Example format (4 principles minimum)
- [ ] All entities defined with descriptions (3+ entities for conceptual model)
- [ ] Each entity has attributes, types, relationships (logical model complete)
- [ ] Storage tech documented with WHY + trade-offs (physical model includes rationale)
- [ ] Each data flow includes error handling (not just happy path)
- [ ] Validation checkpoints specified with line numbers (where validation happens)
- [ ] Performance targets use concrete numbers (<Nms, not "fast")
- [ ] Migration strategy covers both additive and breaking changes
- [ ] Version and status match codebase (verify with git/deployment)

**When to activate**: When creating/updating DATA_ARCHITECTURE.md

**Mechanism**: Skill (model-invoked)

---

#### 12. CLAUDE.md Quality Checker Skill

**Source**: claude-md-guide.md

**What it automates**: Detecting anti-patterns when editing CLAUDE.md/AGENTS.md files

**Anti-patterns**:
- Redundancy between root and subdirectory files
- Implementation details in root file (file paths, line numbers, file trees)
- Testing sections in non-test files
- User-facing documentation (setup, commands, features)
- Generic advice (not project-specific)
- Meta-commentary (last updated, commit history)
- Outdated information

**Target line counts**:
- Root: 100-200 lines (architecture + philosophy)
- Subdirectories: 60-100 lines (focused conventions)
- Total project: <500 lines across all files
- With imports: Main file 50 lines, modules 100-150 lines each

**File size alert**: Approaching 50KB (optimal performance threshold)

**When to activate**: When editing CLAUDE.md, AGENTS.md, or subdirectory guides

**Mechanism**: Skill (model-invoked)

---

#### 13. Documentation Quality Validator Skill

**Source**: llm-instruction-design.md

**What it automates**: Validating any LLM-consumable documentation against quality checklist

**Quality checklist**:
- [ ] Decision trees follow MECE principle (mutually exclusive, collectively exhaustive)
- [ ] Technical terms explicitly defined
- [ ] No contradictions between sections
- [ ] Every rule has 2-3 concrete examples (good vs bad)
- [ ] Edge cases explicitly covered
- [ ] Vague terms replaced with actionable principles
- [ ] Tie-breaking rules provided
- [ ] Complex decisions (3+ branches) have lookup tables
- [ ] Dead-end paths have re-evaluation steps with examples

**When to activate**: When creating/updating CLAUDE.md, user stories, test definitions, design docs, architecture docs, any guide

**Mechanism**: Skill (model-invoked)

---

### Hooks Identified from Guides

#### 1. PostToolUse Hook - Test Runner (PRIORITY 1 - Phase 2)

**Source**: testing-methodology.md (already in Phase 2 plan)

**What it automates**: Running tests after code changes

**Commands**:
- `npm run lint` (if available)
- `npm run format --check` (read-only format check)
- `pnpm tsc --noEmit` (type checking)
- Show results, Claude fixes issues

**When to activate**: After Write or Edit tool use

**Mechanism**: PostToolUse Hook

---

#### 2. PostToolUse Hook - Coverage Check

**Source**: testing-methodology.md

**What it automates**: Checking test coverage after running tests

**Checks**:
- Unit tests: 80%+ coverage of pure functions
- Integration tests: All critical paths covered
- E2E tests: All critical multi-page user flows have at least one E2E test
- LLM evals: All AI features have evaluation scenarios

**When to activate**: After running tests

**Mechanism**: PostToolUse Hook (optional, Phase 3+)

---

#### 3. PostToolUse Hook - Learning Extraction Reminder

**Source**: learning-extraction.md

**What it automates**: Reminding to extract learnings after bug fixes

**When to activate**: After fixing bugs (Write/Edit tools after debugging session)

**Mechanism**: PostToolUse Hook (optional, could be part of Learning Extraction Monitor Skill instead)

---

### Slash Commands Identified from Guides

#### 1. /feature-start <issue-number>

**Source**: CLAUDE.md Feature Development Workflow

**What it does**: Quick shortcut to trigger Feature Kickoff workflow

**Actions**:
1. Search for user stories
2. Search for test definitions
3. Search for design doc (if complex)
4. Offer to create missing docs

**Mechanism**: Slash Command

---

#### 2. /user-stories

**Source**: CLAUDE.md Creating Documentation

**What it does**: Quick shortcut to create user stories using template

**Actions**: Read user-stories-template.md, fill it out, save to project

**Mechanism**: Slash Command

---

#### 3. /test-defs

**Source**: CLAUDE.md Creating Documentation

**What it does**: Quick shortcut to create test definitions using template

**Actions**: Read test-definitions-feature.md, fill it out, save to project

**Mechanism**: Slash Command

---

#### 4. /design-doc

**Source**: CLAUDE.md Creating Documentation

**What it does**: Quick shortcut to create design doc using template

**Actions**: Read design-doc-template.md, fill it out, save to project

**Mechanism**: Slash Command

---

#### 5. /critique (already in Phase 1 plan)

**Source**: Phase 1 plan

**What it does**: Manual quality check shortcut

**Actions**: Run self-review checklist

**Mechanism**: Slash Command

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
