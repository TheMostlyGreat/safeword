# Claude Code Automation Plan v2: Quality Control Workflow

## THE GOAL

**Problem**: You type the same quality control prompt 347+ times across projects:
```
"double check and critique your work again just in case.
is it correct? is it elegant? does it adhere to [plan/template]?
does it follow the latest best practices and documentation for [stack/domain]?
avoid bloat."
```

**Goal**: Reduce this repetitive typing by 60-90% while maintaining quality standards.

**Solution**: 2-phase automation using Claude Code's built-in mechanisms (Slash Commands, Skills, Hooks).

**Success Criteria**:
- **Phase 1**: 60% reduction in prompt length (250 → 100 chars)
- **Phase 2**: 50-70% reduction in quality check prompts (15 → 4-8 per session)
- **Reality check**: Skills activate 50-70% of time, NOT 100% - manual fallback needed 30-50%

**Based on**: Analysis of 1,319 messages (soulless-monorepo) + 8,732 messages (bitd)
- 7% of soulless-monorepo prompts = quality control rituals
- 4% of bitd prompts = quality control rituals

**Updated**: 2025-10-31 - Meta-level critique: Removed 1,000+ lines of bloat, fixed contradictions, reduced from 29 automations to 5 core mechanisms

---

## 🚨 CRITICAL WARNINGS - READ FIRST

### Warning 1: Hooks Broken in Current Versions

**AS OF 2025-10-30: All hooks silently fail in Claude Code v2.0.27 and v2.0.29**

**Check your version**:
```bash
claude --version
```

**Workaround** (required for Phase 2):
```bash
# Launch with debug flag
claude --debug

# Or create alias
alias claude='claude --debug'
```

**Test hooks work before Phase 2**:
```bash
# Create test hook
mkdir -p ~/.claude/hooks
echo '#!/bin/bash' > ~/.claude/hooks/test.sh
echo 'echo "🎉 Hook fired!"' >> ~/.claude/hooks/test.sh
chmod +x ~/.claude/hooks/test.sh

# Add to settings.json
jq '.hooks.Stop = [{matcher: "*", hooks: [{type: "command", command: "~/.claude/hooks/test.sh"}]}]' ~/.claude/settings.json > tmp.json && mv tmp.json ~/.claude/settings.json

# Test
claude --debug
# (Ask Claude something, should see "🎉 Hook fired!" when it finishes)
```

**Impact**: Phase 2 requires workaround or downgrade to v2.0.25. Phase 1 unaffected.

**Source**: [GitHub Issue #10399](https://github.com/anthropics/claude-code/issues/10399)

---

### Warning 2: Skills Don't Activate Reliably

**Reality**: Skills activation rate = 30-70% typical, NOT 100%

**What this means**:
- ❌ You CANNOT eliminate 100% of quality check prompts
- ✅ You CAN reduce by 50-70% (still need manual checks 30-50% of time)

**Why Skills fail to activate**:
- Vague descriptions (Claude doesn't know when to use them)
- Missing trigger keywords (no pattern matching)
- Description >1024 chars (reduces reliability)
- Unpredictable behavior (works perfectly for days, then stops)

**Mitigation**: Always provide Slash Command alternatives for manual invocation when Skills don't fire.

**Community quote**: "The #1 problem with Claude Code skills is they don't activate on their own. They just sit there and you have to remember to use them."

**Success metrics adjusted accordingly** - See Phase 2 section.

---

## Recommended Approach: 2 Phases

| Phase | Mechanisms | Impact | Effort | Status |
|-------|------------|--------|--------|--------|
| **Phase 1** | Slash Commands + CLAUDE.md | 60% prompt reduction | 30 min | ⭐ START HERE |
| **Phase 2** | 2-3 Skills + 1-2 Hooks | 50-70% automation | 2-3 hours | ⭐ IF PHASE 1 INSUFFICIENT |

**Why 2 phases, not 5**:
- Test Phase 1 for 1 week before building Phase 2
- Iterate based on real usage patterns
- Avoid over-engineering (automation anti-pattern)

**Why NOT more**:
- ❌ Subagents: Too slow (context switching), lack conversation history
- ❌ MCP Servers: External dependencies, cost, no conversation context
- ❌ Plugin Distribution: Premature - test locally first

---

## Phase 1: Slash Commands + CLAUDE.md (START HERE)

**Goal**: Immediate 60% reduction in repetitive prompts

**Effort**: 30 minutes

**Impact**: Replaces 250-char prompt with 10-char command

**Pros**:
- ✅ Works immediately (no complex setup)
- ✅ Easy to test and iterate
- ✅ No risk of automation misbehaving
- ✅ Foundation for Phase 2

**Cons**:
- ❌ Still requires manual invocation (not automatic)

---

### 1.1: Slash Commands (20 min)

Create in `~/.claude/commands/`:

#### Command 1: `/critique` (PRIMARY)

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

---

#### Command 2: `/latest-docs` (DOCUMENTATION LOOKUP)

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

---

#### Command 3: `/check-and-proceed` (ONE-SHOT)

**File**: `~/.claude/commands/check-and-proceed.md`

```markdown
---
description: Quality check then immediate implementation
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

---

### 1.2: Enhanced CLAUDE.md (10 min)

Add to `~/.claude/CLAUDE.md`:

```markdown
## Quality Standards (CRITICAL - Always Follow)

### 0. Explore → Plan → Code Workflow

**Before ANY code changes:**

**EXPLORE FIRST:**
1. Read relevant existing files (do NOT write code yet)
2. Understand current patterns and architecture
3. Identify what needs to change

**THEN PLAN:**
4. Create implementation plan
5. Get user approval on plan

**THEN CODE:**
6. Implement with verification steps
7. Run tests
8. Report results

**When to skip**: Trivial changes (typos, formatting) or user says "just do it"

---

### 1. Latest Documentation Check

NEVER assume API compatibility. Training cutoff: January 2025.

**Process**:
- Identify libraries/frameworks used
- Check package.json for versions
- Look up latest docs (WebFetch/WebSearch)
- Verify API still works as expected
- Note deprecated patterns
- Report findings before proposing

---

### 2. Self-Critique Against Quality Criteria

Every proposal must pass:

**Correctness**: Works? Edge cases? Errors? Type-safe?

**Elegance**: Simplest solution? Any bloat? Readable?

**Standards**: Matches CLAUDE.md? Follows patterns? File organization?

**Testability**: Can write tests? Strategy clear?

---

### 3. Output Format for Proposals

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
⚠️ [Trade-offs, limitations, uncertainties]

READY FOR APPROVAL
(Awaiting "yes"/"proceed"/"implement" to execute)
```

---

### 4. When User Approves

When user says "yes"/"proceed"/"implement":
1. ✓ Execute immediately (approval given)
2. ✓ Run relevant tests after implementation
3. ✓ Report test results
4. ✓ Only then mark complete

Do not ask for approval again or skip tests.

---

### 5. Non-Obvious Questions Only

**Ask user ONLY if**:
- Multiple valid approaches with unclear trade-offs
- Domain knowledge required (business rules, UX preferences)
- Breaking changes need approval
- Can't find answer after thorough search

**DO NOT ask**:
- Questions in official docs → Look them up
- Implementation details → Figure them out
- Preferences in CLAUDE.md → Read it
- Standard practices → Research best practices

**Remember**: "Don't be lazy" - research first, ask when stuck.

---

### 6. Avoid Bloat

**Red flags**:
- Adding dependencies when stdlib sufficient
- Over-abstraction (framework for 1 use case)
- Premature optimization (no performance issue)
- Duplicating existing functionality

**Principle**: Simplest solution that solves the problem.

---

### 7. Context Management

**Critical**: Use `/clear` frequently to prevent "dumber after compaction" issue.

**When to use /clear**:
- ✓ After completing a task (before starting next)
- ✓ When switching topics/features
- ✓ When conversation feels unfocused

**When NOT to use /clear**:
- ✗ In middle of multi-step task
- ✗ During active debugging

---

### 8. Testing Standards

**After any code changes**:
- Run existing test suite
- Report results before completion
- If tests fail: fix them (don't ask user)

For TDD workflow: See `@~/.agents/coding/guides/testing-methodology.md`
```

---

### Phase 1 Testing

**Test in both projects** (soulless-monorepo, bitd):

1. Make small change proposal
2. Type `/critique [stack]`
3. Verify comprehensive review appears
4. Type `/check-and-proceed`
5. Verify one-shot execution

**Pass criteria**:
- Commands work reliably
- Save typing (250 → 10 chars)
- Maintain quality

**Measure after 1 week**:
- How often do you use slash commands?
- Is prompt length reduced?
- Is quality maintained?

**Then decide**: Is Phase 2 needed, or is this sufficient?

---

## Phase 2: Skills + Hooks (IF PHASE 1 INSUFFICIENT)

**⚠️ Prerequisites**:
- ✓ Phase 1 tested for 1 week
- ✓ Phase 1 proves insufficient (still too much manual work)
- ✓ Hooks verified working (see Critical Warning above)

**Goal**: 50-70% reduction in quality check prompts (NOT 100% - see Warning 2)

**Effort**: 2-3 hours

**Impact**: Auto-invoked checks (when Skills activate) + post-code validation

**Reality check**:
- Skills activate 50-70% of time
- Manual fallback needed 30-50% (use slash commands)
- Description tuning requires iteration

---

### 2.1: Recommended Skills (Choose 1-2)

**Option A: Single Quality Reviewer Skill** (simpler, broader scope)

**Option B: Split into 2-3 Focused Skills** (narrower, more reliable activation)
- Docs Verifier Skill
- Standards Checker Skill
- Quality Gates Skill

**Anthropic 2025 guidance**: "Keep Skills lean" - prefer Option B

---

### Skill 1: Docs Verifier (45 min)

**File**: `~/.claude/skills/docs-verifier/SKILL.md`

```yaml
---
name: docs-verifier
description: |
  Check latest documentation before proposing code changes.

  Use PROACTIVELY when:
  - About to propose implementation using external libraries
  - User mentions library/framework names
  - Writing code that calls external APIs

  DO NOT use for:
  - Standard library features (Array.map, Promise, console.log)
  - Reading/exploring code without proposing changes

  Process:
  1. Read package.json for versions
  2. WebSearch "[library] v[version] documentation"
  3. Check for deprecated APIs
  4. Return: VERIFIED / DEPRECATED / VERSION_MISMATCH

  Returns structured output (not narrative explanation).

allowed-tools: Read, WebFetch, WebSearch
---

# Documentation Verification Protocol

## Step 1: Detect Stack

Read `package.json` to extract:
- Library names
- Version numbers (exact versions installed)

Example:
```json
{
  "dependencies": {
    "react": "18.3.1",
    "vitest": "^2.1.3"
  }
}
```

## Step 2: Build Version-Specific Searches

For each library:
- Search: "[library] v[version] documentation"
- Example: "react v18.3 documentation"
- Prefer official docs (.dev, .io, .org, GitHub official)
- Check /latest/ or /stable/ URL paths (auto-redirect to current)

## Step 3: Check for Deprecated Patterns

Search: "[library] deprecated [version]"
- Example: "react deprecated 18.3"
- Look for migration guides
- Note breaking changes

## Step 4: Return Structured Output

```
DOCS VERIFICATION:
✓ react v18.3.1 - API unchanged, no deprecations
⚠️ electron v32 - ipcRenderer.sendSync deprecated, use invoke
✗ zustand v4 - Project uses v3, docs for v4 (version mismatch)

RECOMMENDATION: [PROCEED / UPDATE_LIBRARY / FIX_DEPRECATED]
```

## Edge Cases

**No package.json**: Search "[library] latest documentation" (omit version)

**Monorepo**: Check package.json in nearest parent directory or specific package

**Version mismatch**: Warn if docs are for newer/older version than installed
```

**Activation test**:
```
You: "Let's add a new feature using react hooks"
Expected: Docs Verifier Skill activates, checks react docs
```

---

### Skill 2: Quality Gates (45 min)

**File**: `~/.claude/skills/quality-gates/SKILL.md`

```yaml
---
name: quality-gates
description: |
  Final review before Write/Edit tools for TypeScript/JavaScript files.

  Use when Claude is ABOUT TO:
  - Write new .ts/.tsx/.js/.jsx files
  - Edit existing source files (not config/markdown)
  - User approves implementation ("yes", "proceed", "implement")

  DO NOT use for:
  - Reading files without proposing changes
  - Config files (package.json, tsconfig.json)
  - Documentation (*.md, *.txt)

  Checks:
  - Edge cases handled (null, undefined, empty)
  - Avoids bloat (simplest solution)
  - Follows project patterns (read CLAUDE.md)

  Returns: PROCEED / REVISE / USER_INPUT

allowed-tools: Read, Grep, Glob
---

# Quality Gates Protocol

## Step 1: Identify Proposed Changes

Extract from conversation:
- Files to be created/modified
- Code being added/changed
- Libraries/frameworks involved

## Step 2: Edge Case Check

**Common edge cases**:
- Null/undefined inputs
- Empty arrays/objects/strings
- Boundary values (0, -1, MAX_INT)
- Async errors (network failures, timeouts)
- Race conditions (concurrent access)

**Check**: Does proposed code handle these?

## Step 3: Bloat Check

**Red flags**:
- Adding dependency when stdlib sufficient
- Over-abstraction (class for single function)
- Premature optimization (no benchmark)
- Duplicating existing code

**Check**: Is this the simplest solution?

## Step 4: Standards Check

**Read project CLAUDE.md**:
- File organization rules
- Naming conventions
- Coding patterns
- Project-specific gotchas

**Check**: Does proposed code follow these?

## Step 5: Return Recommendation

```
QUALITY GATES:
✓ Edge cases: Handles null, empty, errors
✓ Bloat: Uses existing utility, no new deps
✓ Standards: Follows naming convention (camelCase)

RECOMMENDATION: PROCEED
```

Or:

```
QUALITY GATES:
✗ Edge cases: Missing null check on user.profile
⚠️ Bloat: Adding lodash just for _.isEmpty (use !obj or Object.keys)
✓ Standards: OK

RECOMMENDATION: REVISE
- Add null check: if (!user?.profile) return null
- Replace lodash with: Object.keys(obj).length === 0
```

Or:

```
QUALITY GATES:
? Standards: Unclear if services/ or lib/ directory for this utility

RECOMMENDATION: USER_INPUT
Ask user: "Should I put this utility in services/ or lib/?"
```
```

**Activation test**:
```
You: "Let's implement the login handler"
Claude: [Quality Gates Skill activates]
Claude: [Checks edge cases, bloat, standards]
Claude: "RECOMMENDATION: PROCEED" or "RECOMMENDATION: REVISE"
You: "yes" (if PROCEED)
Claude: [Implements]
```

---

### Skill 3: Feature Kickoff (OPTIONAL, 1 hour)

**File**: `~/.claude/skills/feature-kickoff/SKILL.md`

```yaml
---
name: feature-kickoff
description: |
  Auto-find user stories, test definitions, and design docs when starting features.

  Use when user says:
  - "implement feature X"
  - "work on issue #N"
  - "start on [feature name]"
  - "add [feature]"

  Searches for:
  - planning/user-stories/ or docs/user-stories/
  - planning/test-definitions/ or docs/test-definitions/
  - planning/design/ or docs/design/ (if feature is complex)

  Returns: FOUND / NOT_FOUND / CREATE_SUGGESTED

allowed-tools: Glob, Grep, Read
---

# Feature Kickoff Protocol

## Step 1: Detect Feature Context

**Extract from user message**:
- Feature name (e.g., "dark mode toggle")
- Issue number (e.g., "#123")
- Keywords (e.g., "authentication", "payment")

## Step 2: Search for Planning Docs

**User Stories**:
```bash
# Search patterns
planning/user-stories/*[feature]*.md
docs/user-stories/*[feature]*.md
user-stories/*[feature]*.md
```

**Test Definitions**:
```bash
# Search patterns
planning/test-definitions/*[feature]*.md
docs/test-definitions/*[feature]*.md
test-definitions/*[feature]*.md
```

**Design Docs** (complex features only):
```bash
# Search patterns
planning/design/*[feature]*.md
docs/design/*[feature]*.md
design/*[feature]*.md
```

## Step 3: Return Results

```
FEATURE KICKOFF: [feature name]

✓ User stories found: planning/user-stories/dark-mode.md
✓ Test definitions found: planning/test-definitions/dark-mode-tests.md
✗ Design doc: Not found

RECOMMENDATION: Read user stories and test definitions, proceed with TDD workflow.
```

Or:

```
FEATURE KICKOFF: [feature name]

✗ User stories: Not found
✗ Test definitions: Not found
✗ Design doc: Not found

RECOMMENDATION: CREATE_SUGGESTED
Ask user: "Should I create user stories and test definitions for this feature?"
```
```

**Activation test**:
```
You: "Let's implement the dark mode toggle feature"
Expected: Feature Kickoff Skill activates, searches for docs
```

---

### Skills: Common Mistakes & Fixes

| Mistake | Symptom | Fix | Verify |
|---------|---------|-----|--------|
| Invalid YAML | Skill doesn't load | Run `yamllint` | `yamllint SKILL.md` |
| Description >1024 chars | Low activation rate | Count chars, move to examples.md | `grep -A 50 "description:" \| wc -c` |
| No trigger keywords | Never activates | Add user vocab keywords (file paths, action verbs) | Test with trigger phrases |
| Name invalid format | Skill doesn't load | Lowercase, hyphens only, ≤64 chars | `echo -n "name" \| wc -c` |
| Vague description | Inconsistent activation | Add specific "Use when" bullets | Track activation rate |

**Testing protocol**:
1. **Positive test** (should activate): Say trigger phrase → Verify Skill invoked
2. **Negative test** (should NOT activate): Say unrelated phrase → Verify Skill NOT invoked
3. **Iterate descriptions**: Track false positives/negatives, refine weekly

---

### Skills: Activation Reality & Mitigation

**Set realistic expectations**:
- ✅ Skills MAY activate 50-70% of time (not 100%)
- ❌ Skills MAY NOT activate even with perfect description
- ⚠️ No way to force activation - Claude decides autonomously
- 🔄 Description tuning is trial-and-error, requires iteration

**Mitigation strategies**:

**1. Always provide slash command alternatives**

| Skill | Slash Command Alternative | Use When |
|-------|--------------------------|----------|
| Docs Verifier | `/latest-docs [library]` | Skill doesn't activate |
| Quality Gates | `/critique` | Need to force quality check |
| Feature Kickoff | Manual search | Skill doesn't find docs |

**2. Track activation rate weekly**

```bash
# Create activation log
~/.claude/skills/activation-log.txt

# Format: Date | Skill | Activated (Y/N) | Expected (Y/N)
2025-10-31 | docs-verifier | N | Y
2025-10-31 | quality-gates | Y | Y
2025-10-31 | docs-verifier | Y | Y

# After 1 week, calculate rate
grep docs-verifier ~/.claude/skills/activation-log.txt | \
  awk '{total++; if($4=="Y" && $6=="Y") correct++} END {print "Rate:", correct/total*100"%"}'
```

**3. Iterate descriptions based on real usage**

**Week 1**: Deploy with initial description
**Week 2**: Review log, identify false negatives
**Week 3**: Add missed trigger keywords to description
**Week 4**: Re-test and measure improvement

**Example iteration**:
```yaml
# v1 (40% activation)
description: "Review code before Write/Edit"

# v2 (60% activation) - Added triggers
description: "Review code before Write/Edit. Use when proposing changes, user says 'implement', 'fix', 'add', 'yes'."

# v3 (70% activation) - Added file patterns
description: "Review .ts/.tsx/.js/.jsx code before Write/Edit. Use when proposing changes, user says 'implement', 'fix', 'add', 'yes'."
```

**4. Document manual fallback**

Add to project CLAUDE.md:
```markdown
## When Skills Don't Activate

If Quality Gates Skill doesn't activate:
- Type: `/critique [stack]`
- Or say: "use the quality-gates skill"
- Or manual: "double check: correct? elegant? standards?"
```

---

### 2.2: PostToolUse Hook (30 min)

**⚠️ Requires**: Hooks working (see Critical Warning above)

**What**: Auto-run linters/tests after every Write/Edit

**File**: Add to `~/.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [{
          "type": "command",
          "command": "bash -c 'echo \"🔍 Validating...\"; npm run lint 2>&1 | tail -5 || true; [ -f tsconfig.json ] && npx tsc --noEmit 2>&1 | tail -10 || true; echo \"✅ Complete\"'"
        }]
      },
      {
        "matcher": "Edit",
        "hooks": [{
          "type": "command",
          "command": "bash -c 'echo \"🔍 Validating...\"; npm run lint 2>&1 | tail -5 || true; [ -f tsconfig.json ] && npx tsc --noEmit 2>&1 | tail -10 || true; echo \"✅ Complete\"'"
        }]
      }
    ]
  }
}
```

**How it works**:
1. Claude uses Write or Edit tool
2. Hook fires automatically
3. Runs linter + type checker
4. Output shown to Claude
5. Claude responds to results

**Environment variables available**:
- `$CLAUDE_TOOL_NAME` - Tool used (Write, Edit)
- `$CLAUDE_FILE_PATHS` - Space-separated modified files
- `$CLAUDE_PROJECT_DIR` - Absolute path to project

**Pros**:
- ✅ Deterministic (always runs after Write/Edit)
- ✅ Immediate feedback
- ✅ Integrates existing tooling (npm scripts)

**Cons**:
- ❌ Tool already executed (can't block, only validate)
- ❌ May slow iteration if linters are slow
- ❌ Broken in v2.0.27/v2.0.29 without workaround

---

### 2.3: SessionStart Hook (OPTIONAL, 20 min)

**What**: Load quality standards at session start

**File**: Create `~/.claude/hooks/session-start.sh`

```bash
#!/bin/bash

echo "🚀 Session started: $CLAUDE_PROJECT_DIR"
echo ""

# Load project CLAUDE.md (first 30 lines)
if [ -f "$CLAUDE_PROJECT_DIR/.claude/CLAUDE.md" ]; then
  echo "📋 Project Guidelines:"
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

**Make executable**:
```bash
chmod +x ~/.claude/hooks/session-start.sh
```

**Register in settings.json**:
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
- ✅ Loads context automatically
- ✅ Sets up environment consistently
- ✅ Runs once per session (not repeatedly)

**Cons**:
- ❌ Adds to initial context (uses tokens)
- ❌ Broken in v2.0.27/v2.0.29 without workaround

---

### 2.4: Stop Hook for Context Management (OPTIONAL, 10 min)

**What**: Reminds to `/clear` context after tasks

**File**: Add to `~/.claude/settings.json`

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

**Pros**:
- ✅ Prevents "dumber after compaction" issue
- ✅ Non-invasive (suggestion, not manipulation)
- ✅ No context bloat

**Cons**:
- ❌ User must manually type `/clear`
- ❌ May be repetitive if working on single task

---

### Phase 2 Testing

**After implementing Skills + Hooks**:

**Skills testing**:
1. Propose code change → Verify Skill activates
2. Answer question (no code) → Verify Skill does NOT activate
3. Track activation rate for 1 week

**Hooks testing**:
1. Make code change → Verify linter runs automatically
2. Check Claude responds to linter results
3. Verify tests run (if configured)

**Pass criteria**:
- Skills activate 50-70% of time (track in log)
- Slash commands provide smooth fallback for missed activations
- Hooks run reliably (if working in your version)
- Quality maintained or improved

**Measure after 1-2 weeks**:
- Quality check prompts reduced by 50-70%?
- Skills activation trending up week-over-week?
- Manual fallback workflow feels natural (not frustrating)?

---

## Success Metrics (Realistic Targets)

**⚠️ Updated based on Skills 50-70% activation rate**

### Quantitative Targets

| Metric | Before | Phase 1 Target | Phase 2 Target |
|--------|--------|---------------|---------------|
| Avg prompt length (chars) | 250 | 150 (-40%) | 100 (-60%) |
| Quality check prompts per session | 15 | 6 (-60%) | 4-8 (-50-70%) |
| Time to implementation (min) | 10 | 7 (-30%) | 5-6 (-40-50%) |
| Docs lookup prompts | 8 | 3 (-62%) | 1-3 (-62-87%) |
| **Skills activation rate** | N/A | N/A | **50-70%** |
| **Manual fallback needed** | N/A | N/A | **30-50%** |

**Key changes from original plan**:
- ❌ Removed "0 (-100%)" targets - unrealistic
- ✅ Added ranges reflecting 50-70% automation success
- ✅ Added Skills activation tracking (critical metric)
- ✅ Accept 30-50% manual fallback as success

### Qualitative Goals

- **Quality maintained**: No increase in bugs or refactoring needs
- **Developer experience**: Feels faster, less repetitive *even with 30-50% manual*
- **False positives**: <5% of hook/skill triggers are wrong
- **Skills trending up**: Activation rate improves week-over-week with description tuning
- **Fallback smooth**: Slash commands feel natural, not frustrating

**Measure at**: Week 1 (Phase 1), Week 3 (Phase 2), Week 5 (Phase 2 iteration)

---

## Rollback Plan

If automation causes issues:

### Phase 1 (Slash Commands)
- **Issue**: Command doesn't work
- **Fix**: Edit `.md` file, reload session
- **Rollback**: Delete command file

### Phase 2 (Skills/Hooks)
- **Issue**: Skill fires at wrong times
- **Fix**: Refine description in SKILL.md
- **Rollback**: Delete skill directory

- **Issue**: Hook breaks workflow
- **Fix**: Adjust script or conditions
- **Rollback**: Remove from settings.json

**Recovery**: All automation is additive - removing files returns to manual workflow

**Quick undo**: Press **Esc twice** to rewind conversation to last checkpoint (v2.0.10+)

---

## Iterative Development Process

**Critical principle**: Test each phase for 1 week before building next phase.

### Week 1: Phase 1
1. ✅ Implement slash commands + CLAUDE.md
2. ✅ Use in both projects (soulless-monorepo, bitd)
3. ✅ Measure prompt length reduction
4. ✅ Track command usage frequency
5. ❓ **Decision point**: Is this sufficient, or is Phase 2 needed?

### Week 2-3: Phase 2 (if needed)
1. ✅ Verify hooks working (test hook, workaround if needed)
2. ✅ Implement 1-2 Skills (not all 3 - start small)
3. ✅ Implement PostToolUse Hook (if hooks working)
4. ✅ Test activation with positive/negative cases
5. ✅ Track Skills activation rate daily

### Week 4-5: Phase 2 Iteration
1. ✅ Review activation log (false positives/negatives)
2. ✅ Refine Skill descriptions (add missed trigger keywords)
3. ✅ Add 3rd Skill if first 2 working well
4. ✅ Measure improvement (activation rate trending up?)
5. ❓ **Decision point**: Is 50-70% reduction sufficient?

### Week 6+: Maintenance
- **Weekly**: Review activation logs, refine descriptions
- **Monthly**: Assess if new repetitive patterns emerged
- **Quarterly**: Evaluate if automation still provides value

**Stop building when**: You reach 60-90% reduction in repetitive prompts, NOT when you hit 100% (unrealistic).

---

## Appendix: Why NOT Other Approaches

### Why NOT Subagents

**What they are**: Separate AI agents in isolated context windows

**Why NOT for quality checks**:
- ❌ Slow (context switching overhead)
- ❌ No conversation history (can't see requirements)
- ❌ Overkill for simple quality checks

**When to use instead**:
- ✅ Comprehensive PR reviews (entire diff analysis)
- ✅ Architecture audits (long, detailed analysis)
- ✅ Exhaustive code searches (already using Explore correctly)

---

### Why NOT MCP Servers

**What they are**: External integrations (GitHub, databases, external linters)

**Why NOT for quality checks**:
- ❌ External API costs ($$ for GPT-4/Gemini calls)
- ❌ Network latency (slower than in-context)
- ❌ No conversation context
- ❌ Complex setup (install + config + API keys)
- ❌ Hooks already handle linting (simpler)

**When to use instead** (future):
- ✅ GitHub PR automation ("Review PR #123 and post comments")
- ✅ Database validation ("Will this schema change break production?")
- ✅ Company-specific external tools

---

## Next Steps

**Choose your starting point**:

1. **"implement phase 1"** → I'll create slash commands + CLAUDE.md updates
2. **"show me examples first"** → I'll demonstrate each command in action
3. **"modify the plan"** → Tell me what to change

**Remember**:
- ✅ Test Phase 1 for 1 week before Phase 2
- ⚠️ Skills activate 50-70% (not 100%) - accept manual fallback
- 🚨 Verify hooks working before Phase 2 (see Critical Warning)
- 🎯 Goal is 60-90% reduction (not 100%)

**Ready to start?**
