# Phase 2 Analysis: Subagents vs Skills vs Hooks for Quality Automation

**Context**: Automate the "double check and critique" workflow based on conversation pattern analysis

**User's pattern**: 347+ quality check prompts in bitd project (4% of all messages)

---

## Three Automation Mechanisms Available

### 1. Subagents (via Task Tool)

**How they work**:
- Invoked via `Task` tool with `subagent_type` parameter
- Run in **separate context window** from main conversation
- Can be automatic (Claude decides) or explicit (user requests)
- Configured as `.claude/agents/*.md` or `~/.claude/agents/*.md`

**Example from your history** (bitd project):
```json
{
  "name": "Task",
  "input": {
    "description": "Search for remaining NPC mechanics",
    "prompt": "Search through the Blades in the Dark game data files...",
    "subagent_type": "Explore"
  }
}
```

**Built-in subagent types** (from system instructions):
- `general-purpose` - Multi-step tasks, complex questions
- `Explore` - Fast codebase exploration (glob/grep/read patterns)
- `statusline-setup` - Configure status line (specialized)
- `output-style-setup` - Create output styles (specialized)

**Custom subagents possible**: Yes (via `/agents` command or manual creation)

**Strengths**:
- ✅ Separate context = doesn't pollute main conversation
- ✅ Can be very detailed (own token budget)
- ✅ Returns final report to main conversation
- ✅ Good for complex analysis tasks

**Weaknesses**:
- ❌ Context switch overhead (spins up new agent)
- ❌ Can't access main conversation history
- ❌ Slower than in-context operations
- ❌ Overkill for simple quality checks

**Best for**:
- Long analysis tasks (searching codebase, deep investigations)
- Tasks requiring focused context (data model reviews, architecture analysis)
- When you DON'T need conversation history

**For quality automation**:
- ⚠️ **Moderate fit** - Could work for comprehensive reviews, but heavyweight for simple critiques
- Use case: "Review entire PR before merging" ✓
- Use case: "Quick check before implementing" ✗ (too slow)

---

### 2. Skills

**How they work**:
- Configured as `.claude/skills/SKILL.md` or `~/.claude/skills/SKILL.md`
- **Model-invoked** - Claude autonomously decides when to use
- Run in **same context** as main conversation
- YAML frontmatter with `name`, `description`, `allowed-tools`

**Example configuration**:
```yaml
---
name: quality-reviewer
description: |
  Automatically review code changes for correctness, elegance, and standards adherence.

  Use PROACTIVELY when:
  - About to Write or Edit code files
  - Proposing architectural changes
  - User says "yes"/"proceed"/"implement"

  Must evaluate: correctness, elegance, standards, testability
allowed-tools:
  - Read
  - Grep
  - Glob
  - WebFetch
---

# Quality Review Protocol
[Detailed instructions...]
```

**Strengths**:
- ✅ Automatic activation (no manual invocation)
- ✅ Same context = has conversation history
- ✅ Fast (no context switching)
- ✅ Reusable across projects
- ✅ Can be VERY specific about when to trigger

**Weaknesses**:
- ❌ Competes for main context window tokens
- ❌ Activation not guaranteed (Claude decides)
- ❌ Harder to debug (why didn't it fire?)
- ❌ May fire at wrong times if description ambiguous

**Best for**:
- Frequent, automatic quality checks
- When conversation context is needed
- Workflow steps that should "just happen"

**For quality automation**:
- ✅ **EXCELLENT fit** - Exactly what skills are designed for
- Use case: "Check quality before every implementation" ✓✓✓
- Use case: "Review code after every edit" ✓✓✓

---

### 3. Hooks

**How they work**:
- Configured as `.claude/hooks/*.yaml`
- **Event-driven** - triggered by tool use or prompt submission
- Run **behind the scenes** (user doesn't see them)
- Can modify prompts, block operations, or provide feedback

**Three hook types**:

#### 3a. UserPromptSubmit Hook
```yaml
name: auto-quality-check
on:
  event: user-prompt-submit
  conditions:
    - type: regex
      pattern: '(?i)^(yes|proceed|implement)$'
script: |
  #!/bin/bash
  echo "$PROMPT

  Before implementing, run quality checks:
  - Correct? Elegant? Standards-compliant?"
```

**Strengths**:
- ✅ Deterministic (ALWAYS runs)
- ✅ Invisible to user (seamless)
- ✅ Can modify prompts before Claude sees them
- ✅ Fast (just text manipulation)

**Weaknesses**:
- ❌ Dumb (no intelligence, just pattern matching)
- ❌ Can be too aggressive (false positives)
- ❌ Harder to make context-aware

#### 3b. PostToolUse Hook
```yaml
name: auto-code-validation
on:
  event: post-tool-use
  tools:
    - Write
    - Edit
script: |
  #!/bin/bash
  # Run linters, formatters, tests
  npm run lint 2>&1 || true
  npm run test 2>&1 || true

  echo "Automated quality checks complete. Review output above."
decision: block-with-feedback
```

**Strengths**:
- ✅ Runs AFTER code changes (perfect timing)
- ✅ Can run external tools (linters, tests)
- ✅ Forces Claude to see results
- ✅ Deterministic validation

**Weaknesses**:
- ❌ Requires external tools (npm scripts)
- ❌ Synchronous (blocks until complete)
- ❌ Can be slow if tools are slow

**Best for**:
- Automated validation after code changes
- Running external quality tools
- Enforcing quality gates

**For quality automation**:
- ✅ **EXCELLENT fit** - Deterministic post-implementation checks
- Use case: "Run tests after every code change" ✓✓✓
- Use case: "Lint after every edit" ✓✓✓

---

## Comparison Matrix

| Feature | Subagents | Skills | Hooks |
|---------|-----------|--------|-------|
| **Invocation** | Explicit or auto | Auto (model-invoked) | Event-driven |
| **Context** | Separate window | Same as main | N/A (pre/post) |
| **Intelligence** | Full AI | Full AI | Scripted |
| **Speed** | Slow (context switch) | Fast | Very fast |
| **Determinism** | Low (Claude decides) | Medium (Claude decides) | High (always runs) |
| **Access to history** | No | Yes | No (prompts only) |
| **External tools** | Via allowed-tools | Via allowed-tools | Direct (bash) |
| **Best for** | Complex analysis | Auto quality checks | Validation gates |

---

## Recommendation for "Double Check and Critique" Automation

### Phase 2A: Skills (RECOMMENDED)

**Create**: `~/.claude/skills/quality-reviewer/SKILL.md`

**Why**:
1. ✅ **Automatic** - Fires when Claude proposes code changes (matches your workflow)
2. ✅ **Conversation context** - Sees your requirements, templates, guides
3. ✅ **Fast** - No context switching overhead
4. ✅ **Flexible** - Can check docs, read files, search codebase
5. ✅ **Reusable** - Works across all projects

**When it activates**:
- User says "yes" / "proceed" / "implement" after Claude's proposal
- Claude is about to write/edit code
- Proposing architectural changes

**What it does**:
1. Look up latest documentation for libraries used
2. Evaluate against quality criteria (correct, elegant, standards-compliant)
3. Check for bloat, edge cases, error handling
4. Provide structured critique with recommendation (PROCEED / REVISE / USER INPUT)
5. Wait for approval if issues found

**Result**: 347 quality check prompts → 0 (skill handles automatically)

---

### Phase 2B: PostToolUse Hook (COMPLEMENTARY)

**Create**: `~/.claude/hooks/post-code-validation.yaml`

**Why**:
1. ✅ **Deterministic** - ALWAYS runs after code changes
2. ✅ **External validation** - Runs linters, formatters, tests
3. ✅ **Catch issues immediately** - Before moving to next task
4. ✅ **No human intervention** - Automatic quality gates

**When it activates**:
- After every Write or Edit tool use

**What it does**:
1. Run `npm run lint` (if available)
2. Run `npm run format --check` (if available)
3. Run `npm run test` (if applicable)
4. Run `tsc --noEmit` (type checking)
5. Show results to Claude, who fixes issues before continuing

**Result**: Catches issues Claude might miss (syntax errors, test failures, type errors)

---

### Why NOT Subagents for Phase 2?

**Subagents are OVERKILL for quality checks**:
- ❌ Too slow (context switching overhead)
- ❌ Don't need separate context (quality checks benefit from conversation history)
- ❌ Better suited for long analysis tasks (your history shows: searching game data, exhaustive file searches)
- ❌ Can't replace the "double check ritual" as seamlessly as skills

**When to use subagents instead**:
- ✅ "Review the entire architecture document for inconsistencies" (long, focused analysis)
- ✅ "Search the entire codebase for deprecated patterns" (Explore subagent)
- ✅ "Analyze the data model for missing mechanics" (deep investigation)

**Your actual subagent usage** (from bitd history):
- "Search for remaining NPC mechanics" - Explore subagent ✓ (correct use)
- "Search exhaustively for character mechanics" - Explore subagent ✓ (correct use)
- "Deep search for missing mechanics" - Explore subagent ✓ (correct use)

**All 3 uses**: Long, exhaustive searches. NOT quality checks.

---

### Why NOT UserPromptSubmit Hook for Phase 2?

**UserPromptSubmit hooks are TOO DUMB**:
- ❌ Pattern matching only (no intelligence)
- ❌ Can't evaluate context (is this the right time to critique?)
- ❌ False positives ("yes, I understand" triggers quality checklist)
- ❌ False negatives (miss cases where quality check needed)

**Better for**: Simple prompt modifications
- ✅ Auto-append project context
- ✅ Add timestamps
- ✅ Block prompts with credentials

**Not suitable for**: Intelligent quality decisions

---

## Revised Phase 2 Implementation Plan

### Step 1: Create Quality Reviewer Skill (1 hour)

**File**: `~/.claude/skills/quality-reviewer/SKILL.md`

**Key sections**:
1. **Description** - When to invoke (CRITICAL for auto-activation)
2. **Latest docs verification** - WebFetch/WebSearch for library docs
3. **Quality criteria** - Correct, elegant, standards, testable
4. **Structured output** - PROCEED / REVISE / USER INPUT
5. **Escalation rules** - When to ask user vs figure it out

**Testing**:
- Propose code change → Skill should activate
- Say "yes" → Skill should run final check
- Ask question → Skill should NOT activate

---

### Step 2: Create PostToolUse Hook (30 min)

**File**: `~/.claude/hooks/post-code-validation.yaml`

**What it runs**:
- `npm run lint` (if package.json has "lint" script)
- `npm run format -- --check` (read-only format check)
- `pnpm tsc --noEmit` (type checking)
- Show results, Claude fixes issues

**Testing**:
- Write code with lint error → Hook catches it
- Write code with type error → Hook catches it
- Write valid code → Hook passes, Claude continues

---

### Step 3: Monitor and Refine (1 week)

**Track**:
- How often does skill activate?
- Are there false positives (activates when shouldn't)?
- Are there false negatives (misses when should activate)?
- Does post-hook slow down workflow?

**Refine**:
- Adjust skill description if activation inconsistent
- Add/remove hook validations based on project needs
- Consider project-specific skills for domain-heavy projects (bitd)

---

## Subagents: When to Create Custom Ones

**Create custom subagents for**:

1. **Code Reviewer** (for PR reviews)
   - Use: "Review all changes in this PR"
   - Separate context = focuses only on the diff
   - Returns comprehensive report

2. **Architecture Analyst** (for design reviews)
   - Use: "Analyze this design doc against architecture.md"
   - Separate context = focuses on consistency
   - Returns list of violations

3. **Test Generator** (for test creation)
   - Use: "Generate tests for this feature"
   - Separate context = focuses on test coverage
   - Returns test scaffolding

**Don't create subagents for**:
- ❌ Quality checks before implementation (use Skills)
- ❌ Post-implementation validation (use Hooks)
- ❌ Quick lookups (use main conversation)

---

## Summary

**For your "double check and critique" automation**:

| Approach | Use It? | Why |
|----------|---------|-----|
| Skills | ✅ YES | Perfect for auto quality checks with context |
| PostToolUse Hook | ✅ YES | Perfect for deterministic validation |
| UserPromptSubmit Hook | ⚠️ MAYBE | Phase 3 if Phases 1-2 insufficient |
| Subagents | ❌ NO | Overkill for quick quality checks |

**Best combo**: Skills (intelligent quality checks) + PostToolUse Hook (deterministic validation)

**Expected result**:
- Before: 347 "double check and critique" prompts
- After: 0 (skill + hook handle automatically)
- Quality maintained: Yes (automated checks more consistent than manual)
- Speed improved: Yes (no waiting for user to type critique prompt)

---

## Next Steps

1. **Review this analysis** - Does it match your workflow?
2. **Approve approach** - Skills + Hooks or suggest modifications?
3. **Create configurations** - I'll generate the actual SKILL.md and hook YAML files
4. **Test in real usage** - Run in both soulless-monorepo and bitd projects
5. **Monitor for 1 week** - Track activation patterns and refine
6. **Consider subagents** - Only if you need long-form analysis features (PR reviews, architecture audits)
