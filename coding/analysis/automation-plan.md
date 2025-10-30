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
| **Hook** | SessionStart - Load Context | ⭐⭐⭐⭐ | Load quality standards at session start | 20 min | High | Official docs |
| **Hook** | Stop - Context Management | ⭐⭐⭐⭐ | Prevent "dumber after compaction" issue | 10 min | High | Anthropic 2025 best practices |
| **Hook** | PostToolUse - Test Runner | ⭐⭐⭐⭐ | Auto-run tests after every edit | 30 min | High | testing-methodology.md |
| **Hook** | PreToolUse - Format Code | ⭐⭐⭐ | Auto-format before Write/Edit | 1-2 hrs | Medium | Official docs v2.0.10+ |
| **Skill** | Context Manager | ⭐⭐⭐⭐ | Suggest /clear between tasks | 20 min | High | Anthropic 2025 best practices |
| **Skill** | Feature Kickoff | ⭐⭐⭐⭐ | Auto-find user stories/tests/design docs | 1 hr | High | CLAUDE.md |
| **Hook** | SessionEnd - Log Stats | ⭐⭐ | Log session statistics | 15 min | Low | Official docs |
| **Skill** | TDD Enforcer | ⭐⭐⭐ | Enforce tests BEFORE implementation | 30 min | Medium | testing-methodology.md, Anthropic 2025 |
| **Slash Cmd** | /critique | ⭐⭐⭐ | Manual quality check shortcut | 15 min | Medium | Phase 1 plan |

**Total identified**: 17 Skills, 7 Hooks, 5 Slash Commands (29 automation opportunities)

**Hook types available**:
- **Tool-related**: PreToolUse, PostToolUse
- **User interaction**: UserPromptSubmit, Notification, Stop
- **Session**: SessionStart, SessionEnd
- **Subagent**: SubagentStop
- **Maintenance**: PreCompact

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

### Approach 1a: SessionStart Hook (LOAD CONTEXT AT STARTUP) ⭐⭐⭐⭐

**Power Level**: ⭐⭐⭐⭐
**Effort**: Low (20 min)
**Impact**: Loads development context and environment at session start

**What it does**: Runs when Claude Code starts a new session or resumes an existing session

**Use Cases**:
- Load quality standards from CLAUDE.md into context
- Install dependencies automatically
- Set up environment variables
- Display project-specific reminders

**Configuration**: Add to `~/.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "echo '🎯 Loading project quality standards...' && cat ~/.claude/CLAUDE.md | head -50"
      }]
    }]
  }
}
```

**Special Features**:

**1. Add Context to Session**

Output from SessionStart hook is automatically added to Claude's context:

```bash
#!/bin/bash
echo "Project: My App"
echo "Quality Standards:"
echo "- Always check latest docs"
echo "- Run tests before committing"
echo "- Avoid bloat"
```

This text appears in Claude's initial context window.

**2. Persist Environment Variables**

Use `CLAUDE_ENV_FILE` to persist env vars for subsequent bash commands:

```bash
#!/bin/bash
# Write to env file for later bash commands
echo "export PROJECT_ROOT=/Users/alex/project" >> "$CLAUDE_ENV_FILE"
echo "export DEBUG=1" >> "$CLAUDE_ENV_FILE"
```

**3. Structured Output for Additional Context**

Return JSON to add formatted context:

```json
{
  "hookSpecificOutput": {
    "additionalContext": "Quality Standards:\n- Check docs\n- Run tests\n- Avoid bloat"
  }
}
```

**Available Environment Variables**:
- `CLAUDE_ENV_FILE` - File path where you can persist environment variables (SessionStart only)
- `CLAUDE_PROJECT_DIR` - Absolute path to project root
- `CLAUDE_CODE_REMOTE` - "true" if remote, empty if local

**Example: Load Project Context**

Create `~/.claude/hooks/session-start.sh`:

```bash
#!/bin/bash

echo "🚀 Session started for: $CLAUDE_PROJECT_DIR"
echo ""

# Check if project has CLAUDE.md
if [ -f "$CLAUDE_PROJECT_DIR/.claude/CLAUDE.md" ]; then
  echo "📋 Project Guidelines (first 30 lines):"
  head -30 "$CLAUDE_PROJECT_DIR/.claude/CLAUDE.md"
  echo ""
fi

# Set project env vars
echo "export PROJECT_ROOT=$CLAUDE_PROJECT_DIR" >> "$CLAUDE_ENV_FILE"

# Check for uncommitted changes
cd "$CLAUDE_PROJECT_DIR"
if ! git diff --quiet 2>/dev/null; then
  echo "⚠️ Warning: Uncommitted changes detected"
fi
```

Register in settings.json:

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/session-start.sh"
      }]
    }]
  }
}
```

**Pros**:
- Loads context automatically (no manual reminders)
- Sets up environment consistently
- Displays project-specific warnings
- Runs only once per session (not repeatedly)

**Cons**:
- Adds to initial context window (uses tokens)
- Can't be canceled once session starts
- Errors may prevent session from starting

**Decision**: Phase 2 RECOMMENDED - Load quality standards and environment setup

---

### Approach 1c: SessionEnd Hook (CLEANUP AND LOGGING)

**Power Level**: ⭐⭐⭐
**Effort**: Low (15 min)
**Impact**: Cleanup tasks, session statistics logging

**What it does**: Runs when Claude Code session ends

**Use Cases**:
- Log session statistics (commands run, files modified, errors)
- Save session state for resume
- Clean up temporary files
- Export metrics for analysis

**⚠️ Important**: SessionEnd hooks **cannot block session termination**. They run in background for cleanup only.

**Configuration**: Add to `~/.claude/settings.json`

```json
{
  "hooks": {
    "SessionEnd": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "echo \"Session ended: $(date)\" >> ~/.claude/session-log.txt && echo \"Project: $CLAUDE_PROJECT_DIR\" >> ~/.claude/session-log.txt"
      }]
    }]
  }
}
```

**Example: Session Statistics**

Create `~/.claude/hooks/session-end.sh`:

```bash
#!/bin/bash

LOG_FILE=~/.claude/quality-sessions.log

{
  echo "=================="
  echo "Session ended: $(date)"
  echo "Project: $CLAUDE_PROJECT_DIR"
  echo "Duration: [tracked elsewhere]"

  # Count files in project
  file_count=$(find "$CLAUDE_PROJECT_DIR" -type f | wc -l)
  echo "Files in project: $file_count"

  # Check if tests were run
  if [ -f "$CLAUDE_PROJECT_DIR/.test-results" ]; then
    echo "Tests run: Yes"
  else
    echo "Tests run: No"
  fi

  echo ""
} >> "$LOG_FILE"
```

Register in settings.json:

```json
{
  "hooks": {
    "SessionEnd": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/session-end.sh"
      }]
    }]
  }
}
```

**Special Feature: System Messages**

SessionEnd hooks support `systemMessage` in output to display final messages:

```json
{
  "hookSpecificOutput": {
    "systemMessage": "✅ Session statistics saved to ~/.claude/quality-sessions.log"
  }
}
```

**Pros**:
- Automatic logging (no manual tracking)
- Preserves session history
- Can trigger external tools (backups, notifications)

**Cons**:
- Can't block session end (always runs in background)
- No user interaction possible
- May not complete if system shuts down abruptly

**Decision**: Phase 3 OPTIONAL - Useful for tracking metrics over time

---

### Approach 1b: PreToolUse Hook (PROACTIVE MODIFICATION) ⭐ NEW v2.0.10+

**Power Level**: ⭐⭐⭐⭐⭐
**Effort**: High (1-2 hours - complex JSON handling, testing required)
**Impact**: Modifies tool inputs BEFORE execution (cleaner than PostToolUse validation)

**What's New**: Starting in Claude Code v2.0.10+, PreToolUse hooks can **modify tool inputs** before execution using the `updatedInput` field.

**From official docs**:
> "hooks can modify tool inputs before execution using `updatedInput`"

**Use Cases**:
- Auto-format code BEFORE Write/Edit executes (cleaner than PostToolUse fixing)
- Inject environment variables or credentials
- Add required headers/imports automatically
- Sanitize or validate file paths

---

**⚠️ CRITICAL: How PreToolUse Hooks Work**

**Input**: Hooks receive JSON via **stdin** (not environment variables)
**Output**: Hooks must output JSON to **stdout** with specific structure

**Input JSON structure**:
```json
{
  "session_id": "abc123",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "content": "unformatted code"
  }
}
```

**Output JSON structure** (to modify inputs):
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "updatedInput": {
      "content": "formatted code"
    }
  }
}
```

**Key points**:
- Only include fields you want to **change** in `updatedInput`
- Unchanged fields are preserved automatically
- Must set `"permissionDecision": "allow"` to proceed
- Use `"permissionDecision": "deny"` to block tool execution

---

**Configuration**: Add to `~/.claude/settings.json`

**Example 1: Simple text modification**

Create hook script `~/.claude/hooks/format-code.sh`:

```bash
#!/bin/bash

# Read JSON from stdin
input=$(cat)

# Extract fields
tool_name=$(echo "$input" | jq -r '.tool_name')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')
content=$(echo "$input" | jq -r '.tool_input.content // empty')

# Only format if it's a Write tool with .ts/.js file
if [[ "$tool_name" == "Write" ]] && [[ "$file_path" =~ \.(ts|js)$ ]]; then
  # Format with prettier (fallback to original on error)
  formatted=$(echo "$content" | prettier --stdin-filepath "$file_path" 2>/dev/null || echo "$content")

  # Output modified JSON
  jq -n \
    --arg content "$formatted" \
    '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        updatedInput: {
          content: $content
        }
      }
    }'
else
  # No modification, just approve
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow"
    }
  }'
fi
```

**Make executable**:
```bash
chmod +x ~/.claude/hooks/format-code.sh
```

**Register in settings.json**:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/format-code.sh"
      }]
    }]
  }
}
```

---

**Example 2: Inline jq transformation**

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "jq '{hookSpecificOutput: {hookEventName: \"PreToolUse\", permissionDecision: \"allow\", updatedInput: {command: (\"export DEBUG=1; \" + .tool_input.command)}}}'"
      }]
    }]
  }
}
```

This prepends `export DEBUG=1;` to all Bash commands.

---

**Available Environment Variables**:
- `CLAUDE_PROJECT_DIR` - Absolute path to project root
- `CLAUDE_CODE_REMOTE` - "true" if remote, empty if local
- `CLAUDE_FILE_PATHS` - Space-separated files (PostToolUse only, not PreToolUse)

**Important**: Tool input JSON comes via **stdin**, not via environment variables.

---

**How it works**:
1. Claude decides to use Write/Edit/Bash tool
2. Hook receives JSON via stdin
3. Hook script processes JSON, modifies `updatedInput` fields
4. Hook outputs modified JSON to stdout
5. Tool executes with modified input
6. No post-validation needed (input pre-corrected)

**Pros**:
- Proactive correction (not reactive validation)
- Cleaner than PostToolUse → Read → Edit cycle
- No second round-trip (input corrected before execution)
- Transparent to Claude (sees final result)

**Cons**:
- Complex JSON manipulation required
- Must output valid JSON structure exactly
- Debugging harder (input/output via pipes)
- Formatting errors can break tool execution

**Decision**: Phase 2 OPTIONAL - Use if proactive input modification needed, otherwise PostToolUse is simpler and more debuggable

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

### Skills: Activation Reliability (CRITICAL FOR SUCCESS)

**Problem**: Skills with vague descriptions don't activate reliably. Claude uses the description to decide when to invoke your Skill.

**⚠️ Common Anti-Patterns That Prevent Activation**:

#### ❌ Anti-Pattern 1: Too Vague

```yaml
---
name: document-helper
description: |
  Helps with documents and files. Use when working with documents.
---
```

**Why it fails**:
- "Helps with" is not actionable
- "documents" is too broad (code? markdown? PDFs?)
- No specific trigger terms

#### ✅ GOOD: Specific and Actionable

```yaml
---
name: pdf-processor
description: |
  Extract text and tables from PDF files, fill forms, merge documents.

  Use PROACTIVELY when:
  - User mentions "PDF", "extract", "form", or "merge"
  - File path ends with .pdf
  - Task involves document manipulation

  Returns: Extracted text, table data, or confirmation of merge/fill

allowed-tools: Read, Bash
---
```

**Why it works**:
- Specific actions (extract, fill, merge)
- Clear trigger terms (PDF, extract, form, merge)
- File pattern (.pdf)
- States what it returns

---

#### ❌ Anti-Pattern 2: Too Broad Scope

```yaml
---
name: code-reviewer
description: |
  Reviews all code for any issues. Use whenever writing code.
---
```

**Why it fails**:
- "all code" → fires on every Write/Edit (false positives)
- "any issues" → unclear what to check
- No prioritization

#### ✅ GOOD: Narrow, Focused Scope

```yaml
---
name: quality-gates
description: |
  Final review before Write/Edit tools for TypeScript/JavaScript files.

  Use when Claude is ABOUT TO:
  - Write new .ts/.tsx/.js/.jsx files
  - Edit existing source files (not config/markdown)

  Checks:
  - Latest docs verified (WebFetch package.json versions)
  - Edge cases handled (null, undefined, empty)
  - Avoids bloat (simplest solution)

  Returns: PROCEED / REVISE / USER INPUT

allowed-tools: Read, Grep, WebFetch, WebSearch
---
```

**Why it works**:
- Specific timing ("ABOUT TO Write/Edit")
- File type restrictions (.ts/.tsx/.js/.jsx)
- Concrete checks (docs, edge cases, bloat)
- Structured output (PROCEED/REVISE/USER INPUT)

---

#### ❌ Anti-Pattern 3: No Trigger Keywords

```yaml
---
name: architecture-helper
description: |
  Assists with design and structure decisions.
---
```

**Why it fails**:
- No keywords for Claude to match
- Passive voice ("assists")
- No examples of when to use

#### ✅ GOOD: Explicit Trigger Keywords

```yaml
---
name: architecture-monitor
description: |
  Suggest ARCHITECTURE.md updates when making architectural decisions.

  Use when user discusses:
  - Technology choices (state management, database, frameworks)
  - Data model design (entities, relationships, schema)
  - Project-wide patterns (error handling, API structure)
  - "Why" decisions (trade-offs, alternatives considered)

  Prompt: "Should I document this decision in ARCHITECTURE.md?"

allowed-tools: Read, Grep
---
```

**Why it works**:
- Specific keywords (technology, database, frameworks, data model, schema)
- Clear action ("Suggest updates", "Prompt")
- Examples of trigger phrases

---

#### ❌ Anti-Pattern 4: Description Too Long

```yaml
---
name: quality-reviewer
description: |
  [650 lines of detailed checking logic, edge cases, examples,
  comprehensive documentation about every possible scenario,
  full decision trees, extensive examples...]
---
```

**Why it fails**:
- >1024 chars reduces activation reliability (documented limit)
- Claude can't parse quickly during activation decision
- Should use progressive disclosure (supporting files)

#### ✅ GOOD: Concise Core, Progressive Disclosure

```yaml
---
name: quality-reviewer
description: |
  Review code before Write/Edit for correctness, elegance, standards.

  Use when:
  - About to propose code changes
  - User approves implementation ("yes", "proceed")

  Checks latest docs, edge cases, bloat avoidance, project conventions.

  Returns: PROCEED / REVISE / USER INPUT

  (See examples.md for full review protocol)

allowed-tools: Read, Grep, WebFetch, WebSearch
---
```

**Why it works**:
- Core description <1024 chars
- Supporting details in examples.md (loaded only when Skill runs)
- Clear, scannable structure

---

### Skill Naming Constraints (CRITICAL)

**`name` field requirements**:
- **Max 64 characters**
- **Lowercase letters, numbers, and hyphens only**
- No uppercase, no underscores, no spaces
- Must be unique across all Skills

**Examples**:

✅ **VALID**:
```yaml
name: quality-reviewer       # ✅ Lowercase, hyphens
name: docs-verifier-v2       # ✅ Numbers allowed
name: test-advisor           # ✅ Max 64 chars
```

❌ **INVALID**:
```yaml
name: QualityReviewer                    # ❌ Uppercase not allowed
name: quality_reviewer                   # ❌ Underscores not allowed
name: quality reviewer                   # ❌ Spaces not allowed
name: my-very-long-skill-name-that-exceeds-sixty-four-character-maximum  # ❌ >64 chars
```

**What happens if invalid**: Skill won't load, Claude can't use it, no error message shown

**Verify before creating**:
```bash
# Check name length
echo -n "quality-reviewer" | wc -c   # Should be ≤64

# Check format (should only show letters, numbers, hyphens)
echo "quality-reviewer" | grep -E '^[a-z0-9-]+$' && echo "Valid" || echo "Invalid"
```

---

### Best Practices for Skill Descriptions

**✅ DO**:
- Use specific technical terms ("TypeScript", "React hooks", "Electron IPC")
- List exact trigger keywords Claude should look for
- State what the Skill returns (structured output)
- Include file patterns if relevant (.ts, .test.js, package.json)
- Use active voice ("Check", "Verify", "Suggest")
- Keep <1024 chars for core description
- Use allowed-tools to restrict capabilities
- **Verify name field follows constraints** (see above)

**❌ DON'T**:
- Use vague terms ("helps", "assists", "works with")
- Say "Use when needed" (Claude can't determine "needed")
- Omit trigger keywords
- Write >1024 char descriptions (reduces reliability)
- Use passive voice ("can be used for")
- Leave scope unbounded ("all code", "any files")
- **Use invalid characters in name field** (uppercase, underscores, spaces)

---

### Testing Skill Activation

**After creating a Skill, test it:**

1. **Positive test** (should activate):
   ```
   You: [Say phrase with trigger keywords]
   Claude: [Should invoke Skill as tool]
   ```

2. **Negative test** (should NOT activate):
   ```
   You: [Say unrelated phrase]
   Claude: [Should NOT invoke Skill]
   ```

3. **Edge case test**:
   ```
   You: [Ambiguous phrase - could trigger or not]
   Claude: [Document behavior for refinement]
   ```

**Refinement loop**:
- False positive (activated when shouldn't) → Narrow scope, add exclusions
- False negative (didn't activate when should) → Add trigger keywords, broaden slightly
- Iterate description based on real usage patterns

---

### Skills Activation Reality Check (CRITICAL)

**⚠️ SET REALISTIC EXPECTATIONS: Skills Don't Auto-Activate Reliably**

**Plan assumption**: Skills will auto-activate reliably when trigger conditions are met, eliminating need for manual prompts.

**Actual behavior reported by users**:

> "The #1 problem with Claude Code skills is that they don't activate on their own. Claude Code skills just sit there and you have to remember to use them."

**Reality**:
- ⚠️ **Skills may not activate** even with well-written descriptions
- ⚠️ **Activation rate varies** significantly (users report 30-70% success rate)
- ⚠️ **No way to force activation** - Claude decides autonomously
- ⚠️ **Description tuning is trial-and-error** - no guaranteed formula
- ⚠️ **Unpredictable** - May activate perfectly for days, then stop

**Impact on automation plan**:

**Original expectation**: Phase 2-3 will "eliminate all 347 quality check prompts" (100% automation)

**Realistic expectation**: Skills will reduce prompts by 50-70% (175-245 still manual)

---

### Mitigation Strategies

**1. Always Provide Slash Command Alternatives**

For every Skill, create equivalent slash command:

| Skill | Slash Command Alternative | Use When |
|-------|--------------------------|----------|
| Quality Reviewer Skill | `/critique` | Skill doesn't activate |
| Docs Verifier Skill | `/latest-docs [library]` | Need to force docs check |
| Feature Kickoff Skill | `/feature-start` | Starting new feature |

**2. Track Activation Rate**

Monitor how often Skills activate vs. expected:

```bash
# Create activation log
~/.claude/skills/activation-log.txt

# Format: Date | Skill Name | Activated (Y/N) | Expected (Y/N)
2025-10-30 | quality-reviewer | N | Y
2025-10-30 | docs-verifier | Y | Y
2025-10-30 | quality-reviewer | Y | Y
```

Calculate success rate:
```bash
# After 1 week, check activation rate
grep quality-reviewer ~/.claude/skills/activation-log.txt | \
  awk '{total++; if($4=="Y" && $6=="Y") correct++} END {print "Rate:", correct/total*100"%"}'
```

**3. Iterate Descriptions Based on Real Usage**

**Week 1**: Deploy Skill with initial description
**Week 2**: Review activation log, identify false negatives
**Week 3**: Add missed trigger keywords to description
**Week 4**: Re-test and measure improvement

**Example iteration**:
```yaml
# v1 (Week 1) - 40% activation rate
description: "Review code for quality before Write/Edit"

# v2 (Week 3) - Added trigger keywords - 60% activation rate
description: "Review code before Write/Edit. Use when proposing changes, user says 'implement', 'fix', 'add', 'create', or 'yes'."

# v3 (Week 5) - Added file patterns - 70% activation rate
description: "Review TypeScript/JavaScript code (.ts, .tsx, .js, .jsx) before Write/Edit. Use when proposing changes, user says 'implement', 'fix', 'add', 'create', or 'yes'."
```

**4. Set Realistic Automation Goals**

**❌ Unrealistic**: "Eliminate 100% of quality check prompts"
**✅ Realistic**: "Reduce quality check prompts by 50-70%"

**Success metrics adjustment**:

| Metric | Original Target | Realistic Target |
|--------|----------------|------------------|
| Quality check prompts eliminated | 347 (100%) | 175-245 (50-70%) |
| Prompt length reduction | 80% | 40-60% |
| Manual invocation still needed | 0 | 30-50% |

**5. Document Manual Fallback Procedures**

**When Skill doesn't activate, user should**:
1. Use slash command alternative (`/critique`)
2. OR explicitly mention Skill name: "use the quality-reviewer skill"
3. OR use manual prompt: "double check and critique this"

**Add to project CLAUDE.md**:
```markdown
## When Skills Don't Activate

If Quality Reviewer Skill doesn't activate:
- Type: `/critique [stack]`
- Or say: "use the quality-reviewer skill"
- Or manual: "double check: correct? elegant? standards? latest docs?"
```

---

### Adjusted Success Criteria

**Phase 2 success** (Skills + Hooks):

**Original**:
- ✓ Quality Reviewer Skill activates before implementations (100%)
- ✓ Zero manual quality check invocations

**Realistic**:
- ✓ Quality Reviewer Skill activates 50-70% of the time
- ✓ Slash commands provide 1-step fallback for missed activations
- ✓ Overall prompt reduction: 50-70% (not 100%)
- ✓ Manual quality checks still needed 30-50% of time

**Phase 3 success adjusted accordingly**.

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
allowed-tools: Read, Grep, Glob
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

### Phase 5: Plugin Distribution (FUTURE)

**Goal**: Bundle and distribute your automation for reuse and sharing

**When to implement**: After Phase 2-4 validated and working well

**What**: Package Skills, Hooks, Commands into distributable plugins

**From October 2025 release**:
- Plugin system released with 227+ community plugins
- `/plugin install [name]` - Install from marketplace
- `/plugin marketplace add [url]` - Add custom marketplace
- Plugins bundle Skills, Hooks, Commands, MCP servers together

**Use cases**:

1. **Personal reuse** - Install same automation on multiple machines
2. **Team sharing** - Distribute quality standards to team members
3. **Community contribution** - Share with broader developer community
4. **Version control** - Track automation evolution with versioning

**Example plugin structure**:

```
~/.claude/plugins/quality-automation/
├── plugin.yaml                    # Metadata and version info
├── skills/
│   ├── docs-verifier/
│   │   └── SKILL.md
│   ├── standards-checker/
│   │   └── SKILL.md
│   └── quality-gates/
│       └── SKILL.md
├── hooks/
│   └── stop-context-manager/
│       └── hook.json
└── commands/
    ├── critique.md
    └── feature-start.md
```

**plugin.yaml example**:

```yaml
name: quality-automation
version: 1.0.0
description: |
  Automated quality control workflow for Claude Code.
  Eliminates repetitive "double check and critique" prompts.

author: Your Name
repository: https://github.com/yourusername/claude-quality-automation

skills:
  - skills/docs-verifier/
  - skills/standards-checker/
  - skills/quality-gates/

hooks:
  - hooks/stop-context-manager/

commands:
  - commands/critique.md
  - commands/feature-start.md

dependencies:
  - prettier
  - eslint
```

**Installation flow**:

```bash
# User installs your plugin
/plugin install quality-automation

# Or from custom marketplace
/plugin marketplace add https://your-marketplace.com/plugins.json
/plugin install quality-automation

# Updates
/plugin update quality-automation

# Uninstall
/plugin uninstall quality-automation
```

**Benefits**:

✅ **One-command setup** - No manual file creation
✅ **Version control** - Update automation centrally
✅ **Dependency management** - Specify required tools
✅ **Documentation** - README shown during install
✅ **Discoverability** - Users can browse marketplace

**Distribution options**:

1. **Private** - Share via git repo (team use)
2. **Public marketplace** - Submit to community marketplace
3. **Custom marketplace** - Host your own plugin registry

**Publishing steps**:

1. Test plugin locally (install from local path)
2. Create GitHub repository with plugin structure
3. Submit to marketplace (if public)
4. Document usage in README
5. Version with semver (1.0.0, 1.1.0, 2.0.0)

**When NOT to use plugins**:

- Still iterating on automation (keep as local files)
- Highly personal/specific to your workflow
- Experimental features not ready for distribution

**Success criteria**: Team members or community users successfully install and use your automation plugin

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

### Quick Recovery: Checkpoints (NEW - v2.0.10+)

**Feature**: Press **Esc twice** to rewind conversation to last checkpoint.

**From changelog** (October 2025):
> "Checkpoints: Rewind conversations without losing context. Press Esc twice to return to checkpoint."

**Use when**:
- ✅ Skill activated incorrectly → Esc Esc to undo
- ✅ Hook broke workflow → Esc Esc to revert
- ✅ Want to retry with different approach → Esc Esc and try again
- ✅ Automation caused unexpected behavior → Esc Esc back to before

**Benefits**:
- **Faster than**: Deleting files, restarting session, or manual undo
- **Safer experimentation**: Can rewind mistakes instantly
- **Context preserved**: Unlike /clear, checkpoint keeps full conversation history
- **No commit needed**: Test automation changes without permanent effects

**Example flow**:
```
You: "implement feature X"
Claude: [Quality Reviewer Skill activates incorrectly]
You: [Press Esc Esc]
→ Returns to "implement feature X" prompt
→ Conversation state restored
→ Can refine Skill description or try different approach
```

**Limitation**: Can only rewind to last checkpoint (not arbitrary points in history)

---

## 🚨 CRITICAL: Hook System Bug in Current Versions

**⚠️ AS OF OCTOBER 30, 2025: Hooks are broken in Claude Code v2.0.27 and v2.0.29**

**Source**: [GitHub Issue #10399](https://github.com/anthropics/claude-code/issues/10399) (OPEN, actively reported)

### What's Broken

Multiple hook types stopped executing completely:
- ❌ **Stop hooks** - Don't fire when Claude finishes responding
- ❌ **SessionEnd hooks** - Don't fire when session ends
- ❌ **SessionStart hooks** - Don't fire when session starts
- ❌ **PostToolUse hooks** - Don't fire after tool execution

**Symptom**: Hooks silently fail to execute. No error messages. No output.

**Pattern**: "Hooks worked perfectly until a few days ago" - multiple users across macOS and Windows

### Working Version

✅ **v2.0.25** - Hooks work correctly (confirmed by multiple users downgrading)

### Check Your Version

```bash
claude --version
```

If you see v2.0.27 or v2.0.29, your hooks will not work without workaround.

### Workaround: Use `--debug` Flag

**Temporary fix discovered by community**:

```bash
claude --debug
```

**Why it works**: Hook initialization appears to be incorrectly gated behind debug-mode-only code paths in v2.0.27+

**Create alias for convenience**:

```bash
# Add to ~/.zshrc or ~/.bashrc
alias claude='claude --debug'
```

**Verify hooks work**:

```bash
# Create simple test hook
mkdir -p ~/.claude/hooks
cat > ~/.claude/hooks/test.sh << 'EOF'
#!/bin/bash
echo "🎉 Hook fired successfully!"
EOF
chmod +x ~/.claude/hooks/test.sh

# Add to settings.json
jq '.hooks.Stop = [{matcher: "*", hooks: [{type: "command", command: "~/.claude/hooks/test.sh"}]}]' ~/.claude/settings.json > tmp.json && mv tmp.json ~/.claude/settings.json

# Launch with debug and test
claude --debug
# (Ask Claude something, when it finishes you should see "🎉 Hook fired successfully!")
```

### Downgrade Option (If Workaround Fails)

**Not officially supported, but reported to work**:

```bash
# Backup current version
cp $(which claude) ~/claude-backup

# Install specific version (method depends on installation)
# Homebrew:
brew uninstall claude-code
brew install claude-code@2.0.25  # If available

# Or check Claude Code documentation for version pinning
```

### Impact on This Automation Plan

**Phase 1** (Slash Commands + CLAUDE.md): ✅ **NOT AFFECTED** - No hooks used

**Phase 2** (Skills + Hooks): 🚨 **CRITICALLY AFFECTED**
- PostToolUse Hook automation **will not work** without workaround
- Stop Hook context management **will not work** without workaround
- SessionStart Hook **will not work** without workaround

**Phase 3** (Advanced Hooks): 🚨 **CRITICALLY AFFECTED**
- All hook-based automation requires `--debug` flag or downgrade

### Recommended Action Plan

**Option A: Wait for fix** (if not urgent)
- Implement Phase 1 only (Slash Commands)
- Monitor GitHub issue #10399 for resolution
- Proceed to Phase 2 when bug is fixed

**Option B: Use workaround** (proceed with automation)
- Launch Claude Code with `--debug` flag always
- Create alias: `alias claude='claude --debug'`
- Proceed with Phase 2 implementation
- Test hooks immediately to verify they work

**Option C: Downgrade** (if workaround doesn't work)
- Downgrade to v2.0.25
- Proceed with full automation plan
- Pin version to prevent auto-updates

### Testing Checklist Before Phase 2

**BEFORE implementing any hooks, verify they work**:

1. Check version: `claude --version`
2. If v2.0.27/v2.0.29:
   - Launch with `--debug` flag
   - Create test hook (see example above)
   - Verify hook fires with "🎉" message
3. If hook still doesn't fire:
   - Consider downgrading to v2.0.25
   - Or wait for official fix

**DO NOT PROCEED TO PHASE 2 WITHOUT CONFIRMING HOOKS WORK**

---

## Common Implementation Mistakes

**Context**: Based on community issues and official documentation, these are the most common failure modes when implementing Skills and Hooks.

### Skills Mistakes

**1. YAML Validation Errors**

```yaml
# ❌ WRONG - Invalid YAML
---
name: quality-reviewer
description: |
  Reviews code for quality
  (missing closing quote somewhere in description)
allowed-tools: Read
---  # Missing second --- separator
```

**Fix**: Use online YAML validator (yamllint.com) before testing

**Verify**:
```bash
yamllint ~/.claude/skills/*/SKILL.md
```

---

**2. Description Too Long (>1024 chars)**

**Problem**: Skill activates unreliably or not at all

**Fix**:
- Count chars in description field only (not entire file)
- Move detailed instructions to separate .md files
- Use progressive disclosure pattern (see "Skills Anti-Patterns" section above)

**Check length**:
```bash
# Extract description field and count chars
grep -A 50 "description: |" ~/.claude/skills/quality-reviewer/SKILL.md | wc -c
```

---

**3. Missing Trigger Keywords**

**Problem**: Skill never activates because Claude doesn't know when to use it

**Fix**: Add explicit keywords from user's vocabulary:
- "test" → testing skills
- "implement", "fix", "add" → quality check skills
- "PDF", "document" → document processing skills
- File extensions (.ts, .test.js) → file-type-specific skills

**Before**:
```yaml
description: |
  Helps with architecture decisions.
```

**After**:
```yaml
description: |
  Suggest ARCHITECTURE.md updates when discussing:
  - Technology choices (keywords: database, state management, framework)
  - Data model design (keywords: entity, relationship, schema)
  - Patterns (keywords: error handling, API structure)
```

---

**4. No Test of Activation**

**Problem**: Skill created but never verified if it actually works

**Fix**: Test immediately after creating:
```
# Create Skill
~/.claude/skills/test-advisor/SKILL.md

# Test activation
You: "should I write unit tests or integration tests for this?"
Expected: Test Advisor Skill activates
Actual: [Document what happens]

# Refine description based on test results
```

---

### Hooks Mistakes

**1. Hook Script Not Executable**

```bash
# Problem: Hook file created but no execute permission
$ ls -la ~/.claude/hooks/quality-check.sh
-rw-r--r-- ~/.claude/hooks/quality-check.sh

# Symptom: Hook never fires, no error message

# Fix: Make executable
chmod +x ~/.claude/hooks/quality-check.sh

# Verify
ls -la ~/.claude/hooks/quality-check.sh
-rwxr-xr-x ~/.claude/hooks/quality-check.sh
```

---

**2. Wrong Matcher (Tool Name vs File Pattern)**

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "*.ts",  // ❌ WRONG - matcher is TOOL NAME, not file pattern
      "hooks": [...]
    }]
  }
}
```

**Fix**: Matcher is tool name (Write, Edit, Read, Bash, etc.), filter files inside command
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write",  // ✅ CORRECT - Tool name
      "hooks": [{
        "type": "command",
        "command": "bash -c 'if [[ \"${CLAUDE_FILE_PATHS}\" =~ \\.ts$ ]]; then npm run lint; fi'"
      }]
    }]
  }
}
```

---

**3. Exit Code Ignored (Tests Falsely Pass)**

```bash
# ❌ Problem: Claude reports "tests passed" but command failed
command: "npm test"

# Why: Hook doesn't check exit code, npm test fails silently

# ✅ Fix: Check exit code explicitly
command: "bash -c 'npm test 2>&1 | tee /tmp/test-output.txt; exit ${PIPESTATUS[0]}'"
```

**Key**: Use `${PIPESTATUS[0]}` to preserve npm test's exit code after piping to tee

---

**4. Output Lost / Not Visible**

```bash
# Problem: Hook runs but Claude doesn't see results
command: "npm run lint > /dev/null 2>&1"

# Fix: Ensure output goes to stdout/stderr (Claude captures both)
command: "npm run lint 2>&1"

# Or: Use tee to log AND display
command: "npm run lint 2>&1 | tee /tmp/lint-output.txt"
```

---

**5. Environment Variables Not Set**

```bash
# Problem: $CLAUDE_FILE_PATHS empty when expected
command: "echo File: $CLAUDE_FILE_PATHS"
# Output: "File: " (empty)

# Debug: Check which variables are available
command: "env | grep CLAUDE"

# Available variables (PostToolUse):
# CLAUDE_TOOL_NAME = "Write" or "Edit"
# CLAUDE_FILE_PATHS = space-separated list of files

# Available variables (PreToolUse):
# CLAUDE_TOOL_INPUT = JSON input to tool
# CLAUDE_TOOL_NAME = tool being called
```

---

### Testing Checklist

**Before deploying automation:**

**Skills**:
- [ ] YAML validates (yamllint)
- [ ] Description <1024 chars
- [ ] Includes specific trigger keywords
- [ ] Tested positive case (should activate)
- [ ] Tested negative case (should NOT activate)
- [ ] Returns structured output documented

**Hooks**:
- [ ] Script executable (`chmod +x`)
- [ ] Matcher is tool name (Write, Edit, etc.)
- [ ] Exit code checked (`${PIPESTATUS[0]}`)
- [ ] Output visible (stdout/stderr, not /dev/null)
- [ ] Environment variables tested (`echo $CLAUDE_*`)
- [ ] Hook fires on expected events (test manually)

**Debugging Commands**:
```bash
# List all Skills
ls -la ~/.claude/skills/

# Validate YAML
yamllint ~/.claude/skills/*/SKILL.md

# Check hook permissions
ls -la ~/.claude/hooks/

# Test hook script manually
bash -c 'export CLAUDE_FILE_PATHS="test.ts"; ~/.claude/hooks/quality-check.sh'

# View hook configuration
jq '.hooks' ~/.claude/settings.json

# Check Skill description length
grep -A 100 "description: |" ~/.claude/skills/quality-reviewer/SKILL.md | head -50 | wc -c
```

---

## Success Metrics

**⚠️ UPDATED**: Targets revised based on realistic Skills activation rates (50-70%, not 100%)

Track these before/after metrics:

### Quantitative (Revised Targets)

| Metric | Before | Target After Phase 1 | Target After Phase 2 | Target After Phase 3 |
|--------|--------|---------------------|---------------------|---------------------|
| Avg prompt length (chars) | 250 | 150 (-40%) | 125 (-50%) | 100 (-60%) |
| Quality check prompts per session | 15 | 6 (-60%) | 5-8 (-50-65%) | 4-6 (-60-70%) |
| Time to implementation (min) | 10 | 7 (-30%) | 6 (-40%) | 5 (-50%) |
| Docs lookup prompts | 8 | 3 (-62%) | 2-3 (-62-75%) | 1-2 (-75-87%) |
| **Skills activation rate** | N/A | N/A | **50-70%** | **60-75%** |
| **Manual fallback usage** | N/A | N/A | **30-50%** | **25-40%** |

**Key changes from original plan**:
- ❌ Removed "0 (-100%)" targets - unrealistic with current Skills reliability
- ✅ Added ranges reflecting 50-70% automation success rate
- ✅ Added Skills activation rate tracking (critical metric)
- ✅ Added manual fallback usage tracking

**Why targets are conservative**:
- Skills don't activate 100% of time (30-70% typical)
- Hooks may fail in v2.0.27/v2.0.29 without workaround
- Description tuning takes iterative refinement
- User must remember slash commands when Skills don't fire

### Quantitative Goals by Phase

**Phase 1** (Slash Commands):
- 60% reduction in prompt length (250 → 100 chars)
- Baseline behavior established via CLAUDE.md
- No automation (all manual, but shorter commands)

**Phase 2** (Skills + Hooks):
- 50-65% reduction in quality check prompts (15 → 5-8 per session)
- Skills activate 50-70% of time (track weekly)
- Slash commands provide fallback for 30-50% of cases
- Hooks automate linting/testing (if working in your version)

**Phase 3** (Advanced Automation):
- 60-70% reduction in quality check prompts (15 → 4-6 per session)
- Skills activation improves to 60-75% after description tuning
- Manual fallback needed 25-40% of time
- UserPromptSubmit Hook (optional) catches some missed activations

**Target NOT 100% automation** - Accept that 25-40% will remain manual

### Qualitative

- **Quality maintained**: No increase in bugs or refactoring needs
- **Developer experience**: Feels faster, less repetitive *even with 30-50% manual*
- **False positives**: <5% of hook/skill triggers are wrong
- **Comprehensiveness**: Automated checks as thorough as manual
- **Skill activation trending up**: Activation rate improves week-over-week
- **Fallback workflow smooth**: Slash commands feel natural, not frustrating

**Measure at**: Week 1 (Phase 1), Week 2 (Phase 2), Week 4 (Phase 2 iteration), Week 6 (Phase 3)

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
