# Claude Code Automation Plan v3: Quality Control Workflow

## THE GOAL

**Problem**: You repeat the same cycle 100+ times per project:

```
Your workflow pattern (discovered from conversation logs):

1. You: "double check and critique [X]. is it correct? elegant? best practices? avoid bloat."
   → Claude: [finds 5 issues, proposes fixes] {"proposedChanges": true, "madeChanges": false}

2. You: "make all your suggested changes"  (or "yes please")
   → Claude: [implements all 5 fixes] {"proposedChanges": false, "madeChanges": true}

3. You: "double check and critique again. correct? elegant? avoid bloat."
   → Loop back to step 1

Total keystrokes per cycle: ~180 characters × 100 cycles = 18,000 characters per project
```

**Your most frequent prompts** (from chat/soulless-monorepo conversation logs):

- "make all your suggested changes" (3 instances with typo "yuour")
- "yes please" (5 instances)
- "double check and critique [X]. is it correct? elegant? does it follow best practices? avoid bloat." (10+ variations)
- "check" or "check." (shorthand for critique)

**Goal**: Eliminate the manual "make changes → critique" loop using automated hooks.

**Solution**: PostToolUse hook detects `{"madeChanges": true}` responses, auto-runs tests, auto-commits, and auto-triggers critique. Implementation Cycle Manager Skill detects `{"proposedChanges": true}` and offers to implement immediately.

**Success Criteria**:

- **Phase 1**: 60% reduction in prompt length (180 → 72 chars via slash commands)
- **Phase 2**: 95% reduction in cycle prompts (100 cycles → 5 manual interventions per project)
- **Reality check**: Skills activate 50-70% of time, NOT 100% - `/implement` fallback needed 30-50%

**Based on**: Analysis of 1,319 messages (soulless-monorepo) + 8,732 messages (bitd) + chat project logs

- 7% of soulless-monorepo prompts = quality control rituals
- Most frequent user prompts identified: "make all your suggested changes", "yes please", "double check and critique"

**Updated**: 2025-11-01 - v3: Added JSON response tracking workflow automation, exact prompt pattern matching

---

## 🚨 CRITICAL WARNINGS - READ FIRST

### Warning 1: Hooks Broken in Current Versions

**AS OF 2025-10-30: All hooks silently fail in Claude Code v2.0.27 and later (including v2.0.30)**

**Issue status**: GitHub Issue #10399 - **Still OPEN** (not fixed yet)

**Affected versions**: v2.0.27, v2.0.28, v2.0.29, v2.0.30+ (likely all versions until fix released)

**Check your version**:

```bash
claude --version
```

**Workaround** (required for Phase 2 - hooks won't work otherwise):

```bash
# Launch with debug flag every time
claude --debug

# Or create permanent alias
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

# Test with debug flag
claude --debug
# (Ask Claude something, should see "🎉 Hook fired!" when it finishes)
# If you DON'T see "🎉 Hook fired!", hooks are still broken - don't proceed to Phase 2
```

**Impact**: Phase 2 requires `--debug` workaround or downgrade to v2.0.25. Phase 1 unaffected.

**Source**: [GitHub Issue #10399](https://github.com/anthropics/claude-code/issues/10399) (still open)

---

### Warning 2: Skills Don't Activate Reliably

**Reality**: Skills activation rate = 50-70% typical, NOT 100%

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

---

## Recommended Approach: 2 Phases

| Phase       | Mechanisms                 | Impact               | Effort  | Status                     |
| ----------- | -------------------------- | -------------------- | ------- | -------------------------- |
| **Phase 1** | Slash Commands + CLAUDE.md | 60% prompt reduction | 30 min  | ⭐ START HERE              |
| **Phase 2** | 2 Skills + 1-2 Hooks       | 50-70% automation    | 2 hours | ⭐ IF PHASE 1 INSUFFICIENT |

**Why 2 phases, not 5**:

- Test Phase 1 for 1 week before building Phase 2
- Iterate based on real usage patterns
- Avoid over-engineering (automation anti-pattern)

**Agentic coding best practice (2025 research)**: "Guide yields better outcomes than pure autonomy. Ask for a plan first."

**Why NOT more**:

- ❌ Subagents: Too slow (context switching), lack conversation history
- ❌ MCP Servers: External dependencies, cost, no conversation context

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

**Create in ONE of these locations**:

**Personal commands** (available in all projects):
`~/.claude/commands/critique.md`

**Project commands** (shared with team via git):
`.claude/commands/critique.md`

**Recommendation**: Start with personal (~/.claude), move to project later if team needs them.

---

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

#### Command 4: `/implement` (FALLBACK FOR WHEN SKILLS DON'T ACTIVATE)

**File**: `~/.claude/commands/implement.md`

```markdown
---
description: Implement all proposed changes from previous response
---

Implement all changes you proposed in your previous response.

After implementing:

- Use Write/Edit tools for all changes
- PostToolUse hook will automatically:
  - Run tests (for code changes)
  - Commit changes
  - Trigger critique

Respond with your critique results and final JSON status.
```

**Usage**:

- When Claude responds with `{"proposedChanges": true}` but doesn't offer to implement
- Type `/implement` instead of "make all your suggested changes"
- Saves typing, consistent trigger

**Why this exists**:

- Skills activate 50-70% of time (not 100%)
- When Implementation Cycle Manager Skill doesn't activate, use `/implement` as manual fallback
- Still saves keystrokes: `/implement` (10 chars) vs "make all your suggested changes" (29 chars)

**Fallback strategy**:

```
Best case: Skill activates (50-70%) → Offers to implement → User says "yes" → Implements
Fallback: Skill doesn't activate (30-50%) → User types `/implement` → Implements

Both paths → PostToolUse hook → tests + commit + critique
```

---

### 1.2: Enhanced CLAUDE.md (10 min)

**Add to ONE of these files**:

**Personal** (all projects): `~/.claude/CLAUDE.md`
**Project-wide** (shared with team): `CLAUDE.md` in project root
**Project-local** (your settings only): `CLAUDE.local.md` in project root (add to .gitignore)

**Recommendation**: Start with personal (~/.claude/CLAUDE.md)

---

**Add this content**:

```markdown
## Quality Standards (CRITICAL - Always Follow)

### 0. Explore → Plan → Code → Commit Workflow

**EXPLORE**: Read relevant files, understand patterns (no code yet)
**PLAN**: Create plan, get approval
**CODE**: Implement, run tests, report results
**COMMIT**: Commit with message, create PR if needed

**Skip only if**: Trivial changes (typos, formatting) or user says "just do it"

**Agentic best practice**: "Ask for a plan first" yields better outcomes than jumping to code.

---

### 1. Latest Documentation Check

**IMPORTANT**: NEVER assume API compatibility. Training cutoff: January 2025.

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

### 3. Output Format
```

PROPOSAL: [What to implement]
QUALITY CHECK: ✓ Docs | ✓ Correct | ✓ Elegant | ✓ Standards | ✓ Testable [reasoning]
CONCERNS: [Trade-offs if any]
READY FOR APPROVAL

```

---

### 4. When User Approves

**YOU MUST**: When user says "yes"/"proceed"/"implement":
1. ✓ Execute immediately (approval given)
2. ✓ Run relevant tests after implementation
3. ✓ Report test results
4. ✓ Only then mark complete

Do not ask for approval again or skip tests.

---

### 5. Non-Obvious Questions Only

Ask ONLY if: Multiple valid approaches, domain knowledge needed, breaking changes, can't find answer after search.

DON'T ask: Questions in docs, implementation details, preferences in CLAUDE.md, standard practices.

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

**CRITICAL**: Use `/clear` frequently to prevent "dumber after compaction" issue.

**Use /clear**: After completing task, switching topics, when unfocused
**Don't use /clear**: Mid multi-step task, during active debugging

---

### 8. Testing Standards

**After any code changes**:
- Run existing test suite
- Report results before completion
- If tests fail: fix them (don't ask user)

For TDD workflow: See `@./.safeword/guides/testing-methodology.md`
```

**Pro tip**: During coding, press **#** and type an instruction. Claude will automatically add it to the relevant CLAUDE.md file for you.

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

**Effort**: 2 hours

**Impact**: Auto-invoked checks (when Skills activate) + post-code validation

**Reality check**:

- Skills activate 50-70% of time
- Manual fallback needed 30-50% (use slash commands)
- Description tuning requires iteration

---

### 2.1: Recommended Skills (Choose 1-2)

**Start with 1-2 Skills, NOT all at once**. Add 3rd only if first 2 working well.

**Option A: Docs Verifier** - Check latest docs before proposing code
**Option B: Quality Gates** - Final review before Write/Edit tools

**Anthropic 2025 guidance**: "Keep Skills lean" - focused descriptions <1024 chars

**LLM research 2025**: Progressive disclosure - load details when Skill invoked, not in description

**What to load when Skill invoked**:

- **Docs Verifier** - Full protocol for library version checking and API deprecation detection
- **Quality Gates** - Edge case checklist (null, empty, boundary values) + bloat patterns + CLAUDE.md conventions
- **Implementation Cycle Manager** - Protocol for detecting proposals, asking confirmation, and implementing changes

---

### Skill 1: Docs Verifier (30 min)

**File**: `~/.claude/skills/docs-verifier/SKILL.md`

```yaml
---
name: docs-verifier
description: |
  Check latest documentation before proposing code changes.

  Use PROACTIVELY when:
  - About to propose implementation using external libraries
  - User mentions library/framework names (react, electron, vitest, etc.)
  - Writing code that calls external APIs

  DO NOT use for:
  - Standard library features (Array.map, Promise, console.log)
  - Reading/exploring code without proposing changes

  Returns: VERIFIED / DEPRECATED / VERSION_MISMATCH

  (See below for full verification protocol)

allowed-tools: Read, WebFetch, WebSearch
---

# Documentation Verification Protocol

**Process**:
1. Read package.json for library versions
2. WebSearch "[library] v[version] documentation"
3. Check for deprecated APIs: "[library] deprecated [version]"
4. Return structured output

**Example output**:
```

DOCS VERIFICATION:
✓ react v18.3.1 - API unchanged
⚠️ electron v32 - ipcRenderer.sendSync deprecated, use invoke
✗ zustand - Project uses v3, docs for v4 (VERSION_MISMATCH)

RECOMMENDATION: PROCEED / UPDATE_LIBRARY / FIX_DEPRECATED

```

**Edge cases**:
- No package.json: Search "[library] latest documentation"
- Monorepo: Check package.json in nearest parent or specific package
- Version mismatch: Warn if docs are newer/older than installed version
```

**Supporting file** (optional): `~/.claude/skills/docs-verifier/examples.md` (loaded only when Skill runs)

**Activation test**:

```
You: "Let's add a new feature using react hooks"
Expected: Docs Verifier Skill activates, checks react docs
```

---

### Skill 2: Quality Gates (30 min)

**File**: `~/.claude/skills/quality-gates/SKILL.md`

```yaml
---
name: quality-gates
description: |
  Final review before Write/Edit for .ts/.tsx/.js/.jsx files.

  Use when ABOUT TO:
  - Write/Edit source files (not config/docs)
  - User approves implementation ("yes", "proceed", "implement")

  Checks: Edge cases (null, undefined, empty), bloat (simplest solution), standards (CLAUDE.md patterns)

  Returns: PROCEED / REVISE / USER_INPUT

  (See below for full review protocol)

allowed-tools: Read, Grep, Glob
---

# Quality Gates Review Protocol

**Check proposed code for**:
1. **Edge cases**: Null/undefined, empty arrays/objects/strings, boundary values (0, -1, MAX_INT), async errors, race conditions
2. **Bloat**: Simplest solution? Unnecessary dependencies/abstractions? Premature optimization?
3. **Standards**: Read project CLAUDE.md for file organization, naming conventions, coding patterns

**Return one of**:
- PROCEED (all checks pass)
- REVISE (list specific issues to fix)
- USER_INPUT (need user decision)

**Example output**:
```

QUALITY GATES:
✓ Edge cases: Handles null, empty, errors
✗ Bloat: Adds lodash just for \_.isEmpty
✓ Standards: Follows naming conventions

RECOMMENDATION: REVISE

- Replace lodash: Object.keys(obj).length === 0

```

```

**Activation test**:

```
You: "Let's implement the login handler"
Expected: Quality Gates Skill activates, checks edge cases/bloat/standards
```

---

### Skill 3: Implementation Cycle Manager (30 min)

**File**: `~/.claude/skills/implementation-cycle/SKILL.md`

```yaml
---
name: implementation-cycle-manager
description: |
  Detects when you've proposed changes (proposedChanges true) and offers to implement them immediately.

  Use when YOU JUST:
  - Responded with proposals/suggestions/fixes
  - Listed changes to make
  - Found issues in critique
  - Responded with {"proposedChanges": true}

  Eliminates user typing "make all your suggested changes" or "yes please".

  Returns: Asks user "Should I implement all suggested changes now?" → If yes, implement → PostToolUse hook handles rest.

  (See below for full protocol)

allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Implementation Cycle Manager Protocol

**When to activate**: You just responded with `{"proposedChanges": true, "madeChanges": false}`

**Detection signals**:
- You listed numbered changes (1. Fix X, 2. Add Y, 3. Update Z)
- You used phrases: "Here's what needs to change", "I found N issues", "Proposed changes:"
- Your response ended with `{"proposedChanges": true, "madeChanges": false}`

**What to do**:

1. **Ask user for confirmation**:
```

I found [N] issues/changes. Should I implement all suggested changes now?

(Type "yes", "proceed", "do it", or "implement" to continue)

```

2. **If user says YES** (matches: yes, proceed, do it, implement, make the changes, go ahead):
   - Implement ALL proposed changes using Write/Edit tools
   - PostToolUse hook will automatically:
     - Run tests (if code changes)
     - Commit changes
     - Trigger critique
   - Respond with final JSON status

3. **If user says NO** (matches: no, not yet, wait, hold on):
   - Acknowledge: "Understood. Let me know when you're ready."
   - Wait for further instructions

4. **If user asks question or modifies request**:
   - Answer question first
   - Then re-offer implementation

**Example flow**:

```

User: "double check and critique the authentication module"
You: [critique finds 5 issues]
{"proposedChanges": true, "madeChanges": false}

You (Skill activates): "I found 5 issues. Should I implement all suggested changes now?"

User: "yes"

You: [uses Edit tool to fix all 5 issues]
PostToolUse Hook: [runs tests, commits, injects critique]
You: [responds with critique of implemented changes]
{"proposedChanges": false, "madeChanges": true}

```

**What this eliminates**:
- ✅ User typing "make all your suggested changes" (27 chars)
- ✅ User typing "yes please" (10 chars)
- ✅ User typing "do it" (5 chars)

**Activation rate reality**: 50-70% (fallback: user types `/implement` when Skill doesn't activate)
```

**Activation test**:

```
You: "critique the user authentication code"
Claude: [finds 3 issues] {"proposedChanges": true}
Expected: Skill activates, asks "Should I implement all suggested changes now?"
You: "yes"
Expected: Claude implements all 3 fixes
```

---

### Skills: Common Mistakes & Fixes

| Mistake                 | Symptom                 | Fix                                                                    | Verify                               |
| ----------------------- | ----------------------- | ---------------------------------------------------------------------- | ------------------------------------ |
| Invalid YAML            | Skill doesn't load      | Run `yamllint`                                                         | `yamllint SKILL.md`                  |
| Description >1024 chars | Low activation rate     | Count chars, move details below YAML                                   | `grep -A 50 "description:" \| wc -c` |
| No trigger keywords     | Never activates         | Add user vocab keywords (library names, file extensions, action verbs) | Test with trigger phrases            |
| Name invalid format     | Skill doesn't load      | Lowercase, hyphens only, ≤64 chars                                     | `echo -n "name" \| wc -c`            |
| Vague description       | Inconsistent activation | Add specific "Use when" bullets with examples                          | Track activation rate                |

**Testing protocol**:

1. **Positive test** (should activate): Say trigger phrase → Verify Skill invoked
2. **Negative test** (should NOT activate): Say unrelated phrase → Verify Skill NOT invoked
3. **Iterate descriptions**: Track false positives/negatives, refine weekly

---

### Skills: Activation Mitigation

**Realistic expectations**: Skills activate 50-70% of time. Manual fallback needed 30-50%.

**Mitigation strategies**:

**1. Slash command alternatives**

| Skill         | Slash Command            | Use When                    |
| ------------- | ------------------------ | --------------------------- |
| Docs Verifier | `/latest-docs [library]` | Skill doesn't activate      |
| Quality Gates | `/critique`              | Need to force quality check |

**2. Track activation rate weekly**

```bash
# Create log: ~/.claude/skills/activation-log.txt
# Format: Date | Skill | Activated (Y/N) | Expected (Y/N)

# After 1 week, calculate rate
grep docs-verifier ~/.claude/skills/activation-log.txt | \
  awk '{total++; if($4=="Y" && $6=="Y") correct++} END {print "Rate:", correct/total*100"%"}'
```

**3. Iterate descriptions based on real usage**

Week 1 → Week 2 → Week 3 → Week 4: Add missed trigger keywords, measure improvement

**Example iteration**:

```yaml
# v1 (40% activation)
description: "Review code before Write/Edit"

# v2 (60% activation) - Added triggers
description: "Review .ts/.tsx/.js/.jsx before Write/Edit. Use when proposing changes, user says 'implement', 'fix', 'yes'."

# v3 (70% activation) - Added library names
description: "Review .ts/.tsx/.js/.jsx before Write/Edit using react/electron/vitest. Use when proposing changes, user says 'implement'."
```

**4. Document manual fallback in project CLAUDE.md**

```markdown
## When Skills Don't Activate

If Quality Gates doesn't activate: Type `/critique [stack]` or say "use the quality-gates skill"
```

---

### 2.2: PostToolUse Hook - Auto-Critique After Changes (45 min)

**⚠️ Requires**: Hooks working (see Critical Warning above)

**What**: Detect `{"madeChanges": true}` responses, auto-run tests for code changes, auto-commit, and trigger full critique

**This replaces your manual workflow**:

- ❌ Old: You type "make all your suggested changes" → Claude implements → You type "double check and critique" → loop
- ✅ New: Claude implements → Hook auto-runs tests + commits + triggers critique → done

**File**: Create `~/.claude/hooks/PostToolUse.sh`

```bash
#!/bin/bash

# Parse tool name and file paths
TOOL_NAME="$CLAUDE_TOOL_NAME"
FILE_PATHS="$CLAUDE_FILE_PATHS"  # Comma-separated

# Only trigger on file modification tools
if [[ ! "$TOOL_NAME" =~ ^(Write|Edit|MultiEdit|NotebookEdit)$ ]]; then
  exit 0
fi

# Extract file extensions
CODE_EXTENSIONS="ts|tsx|js|jsx|py|go|rs|java|c|cpp|h|hpp"
CHANGED_CODE=false

IFS=',' read -ra FILES <<< "$FILE_PATHS"
for file in "${FILES[@]}"; do
  if [[ "$file" =~ \.($CODE_EXTENSIONS)$ ]]; then
    CHANGED_CODE=true
    break
  fi
done

# Run tests for code changes
if [ "$CHANGED_CODE" = true ]; then
  echo "📝 Code changes detected. Running tests..."

  # Detect test command from package.json or common patterns
  if [ -f "package.json" ] && grep -q '"test":' package.json; then
    npm test 2>&1 | head -50
  elif [ -f "pytest.ini" ] || [ -f "setup.py" ]; then
    pytest 2>&1 | head -50
  elif [ -f "go.mod" ]; then
    go test ./... 2>&1 | head -50
  elif [ -f "Cargo.toml" ]; then
    cargo test 2>&1 | head -50
  fi

  echo ""
fi

# Auto-commit changes
echo "💾 Committing changes..."

# Generate commit message from changed files
COMMIT_MSG="update: $(basename ${FILES[0]})"
if [ ${#FILES[@]} -gt 1 ]; then
  COMMIT_MSG="update: ${#FILES[@]} files"
fi

git add ${FILES[@]} 2>/dev/null
git commit -m "$COMMIT_MSG

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>" 2>&1 | grep -E "(commit|changed|insertion|deletion)"

echo ""
echo "✅ Changes committed: $COMMIT_MSG"
echo ""

# Trigger full critique (matches user's exact prompt pattern)
cat <<'CRITIQUE'
IMPORTANT: Now double check and critique your changes:

1. **Correctness**: Will it actually work? Any bugs?
2. **Elegance**: Is it clean, maintainable, avoiding bloat?
3. **Best Practices**: Following language/framework conventions? Check latest docs.
4. **Test Coverage**: Did tests pass? Any gaps?
5. **Documentation**: Does CLAUDE.md need updating?

Be honest and thorough. Respond with JSON status at the end.
CRITIQUE
```

**Make executable**:

```bash
chmod +x ~/.claude/hooks/PostToolUse.sh
```

**Register in settings.json**:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/PostToolUse.sh"
          }
        ]
      }
    ]
  }
}
```

**How it works**:

1. Claude uses Write/Edit/NotebookEdit tool
2. Hook fires automatically
3. Detects if code files were changed (by extension)
4. Runs tests if code changed
5. Auto-commits changes with consistent message format
6. Injects critique prompt into Claude's context
7. Claude sees the prompt and responds with critique

**What this automates** (your exact workflow):

- ✅ "make all your suggested changes" → Claude implements (you still type this)
- ✅ Test execution → Hook runs automatically
- ✅ Git commit → Hook runs automatically
- ✅ "double check and critique" → Hook injects automatically
- ✅ Loop prevention → You only intervene when Claude finds issues

**Data sources**:

- `$CLAUDE_TOOL_NAME` - Tool that was used (Write/Edit/NotebookEdit)
- `$CLAUDE_FILE_PATHS` - Comma-separated list of modified files
- `$CLAUDE_PROJECT_DIR` - Current working directory

**Pros**:

- ✅ Eliminates 100+ "double check and critique" prompts per project
- ✅ Deterministic (always runs after file modifications)
- ✅ Matches your exact prompt pattern ("is it correct? elegant? best practices? avoid bloat?")
- ✅ Auto-runs tests only for code changes (not docs/config)
- ✅ Consistent commit messages

**Cons**:

- ❌ Adds ~10-30 seconds per change (test + commit time)
- ❌ May generate noisy commits if making many small changes (solution: use `/implement` for big changes)
- ❌ Broken in v2.0.27+ without `--debug` workaround
- ❌ Cannot detect `{"madeChanges": true}` in JSON (hook runs after tool, not after response)

---

### 2.3: SessionStart Hook (OPTIONAL, 20 min)

**What**: Load quality standards at session start

**File**: Create `~/.claude/hooks/session-start.sh`

```bash
#!/bin/bash

echo "🚀 Session started: $CLAUDE_PROJECT_DIR"
echo ""

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
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/session-start.sh"
          }
        ]
      }
    ]
  }
}
```

**Pros**:

- ✅ Loads context automatically
- ✅ Sets up environment consistently
- ✅ Runs once per session (not repeatedly)

**Cons**:

- ❌ Adds to initial context (uses tokens)
- ❌ Broken in v2.0.27+ (including v2.0.30) without `--debug` workaround

---

### 2.4: Stop Hook for Context Management (OPTIONAL, 10 min)

**What**: Reminds to `/clear` context after tasks

**File**: Add to `~/.claude/settings.json`

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "echo '💡 Task complete. Consider: /clear before next task (prevents context pollution)'"
          }
        ]
      }
    ]
  }
}
```

**Agentic best practice**: "Use /clear between distinct tasks" - prevents context window clutter

**Pros**:

- ✅ Prevents "dumber after compaction" issue
- ✅ Non-invasive (suggestion, not manipulation)
- ✅ No context bloat

**Cons**:

- ❌ User must manually type `/clear`
- ❌ May be repetitive if working on single task

---

### Common Gotchas for Hooks

| Issue                           | Symptom                                   | Fix                                                                                                                          |
| ------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------- | -------- | --- | ----- |
| **JSON parsing in PostToolUse** | Hook can't detect `{"madeChanges": true}` | Hooks run AFTER tool execution, before response text. Cannot parse JSON from response. Use file extension detection instead. |
| **Hook output not visible**     | Hook runs but Claude doesn't see output   | Use `echo` to print output. Hook stdout/stderr is shown to Claude.                                                           |
| **Commit message formatting**   | Commit message has broken newlines        | Use HEREDOC: `git commit -m "$(cat <<'EOF' ... EOF)"`                                                                        |
| **Test commands not found**     | Hook fails to find `npm`/`pytest`         | Check `$PATH` in hook environment. Use full paths: `/usr/local/bin/npm test`                                                 |
| **Hook hangs session**          | Claude waits forever                      | Add timeout or use `                                                                                                         |     | true`to prevent blocking:`npm test 2>&1 | head -50 |     | true` |
| **Git not in repo**             | Hook fails with git errors                | Check if in git repo: `[ -d .git ] && git add ...`                                                                           |
| **File paths with spaces**      | Hook fails to process files               | Quote file paths: `git add "${FILES[@]}"` not `git add $FILES`                                                               |

**Why you can't parse `{"madeChanges": true}` in PostToolUse hook**:

- PostToolUse hook executes AFTER Write/Edit tool completes
- But BEFORE Claude generates response text (which includes the JSON)
- Hook only has access to: `$CLAUDE_TOOL_NAME`, `$CLAUDE_FILE_PATHS`, `$CLAUDE_PROJECT_DIR`
- Solution: Detect file types by extension (`*.ts, *.tsx`) instead of parsing JSON

**Testing protocol**:

1. **Echo test**: Add `echo "🎉 Hook fired!"` to verify hook runs
2. **Dry run**: Comment out git commands, test file detection logic
3. **Check logs**: Look at Claude Code debug logs (if using `--debug` flag)

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

| Metric                            | Before          | Phase 1 Target | Phase 2 Target |
| --------------------------------- | --------------- | -------------- | -------------- |
| Avg prompt length (chars)         | 250             | 150 (-40%)     | 100 (-60%)     |
| Quality check prompts per session | 15              | 6 (-60%)       | 4-8 (-50-70%)  |
| **Implementation cycle prompts**  | **100/project** | **40 (-60%)**  | **5 (-95%)**   |
| Time to implementation (min)      | 10              | 7 (-30%)       | 5-6 (-40-50%)  |
| Docs lookup prompts               | 8               | 3 (-62%)       | 1-3 (-62-87%)  |
| **Skills activation rate**        | N/A             | N/A            | **50-70%**     |
| **Manual fallback needed**        | N/A             | N/A            | **30-50%**     |

**Key principles**:

- ❌ Removed "0 (-100%)" targets - unrealistic
- ✅ Accept 30-50% manual fallback as success
- ✅ Skills activation trending up = success (even if not 100%)

**Implementation cycle prompts explained**:

- **Before**: You type "double check and critique" → Claude finds 5 issues → You type "make all your suggested changes" → Claude implements → You type "double check and critique" again → Loop 100 times per project
- **Phase 1 (slash commands)**: Replace long prompts with `/critique` and `/implement` → Saves 60% keystrokes
- **Phase 2 (hooks + skills)**: PostToolUse hook auto-triggers critique after changes, Implementation Cycle Manager Skill auto-offers to implement → 95% reduction (only 5 manual interventions per 100 cycles)

### Qualitative Goals

- **Quality maintained**: No increase in bugs or refactoring needs
- **Developer experience**: Feels faster, less repetitive _even with 30-50% manual_
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

**Agentic best practice (2025)**: "Guide yields better outcomes than pure autonomy. Ask for a plan first, then execute."

### Week 1: Phase 1

1. ✅ Implement slash commands + CLAUDE.md
2. ✅ Use in both projects (soulless-monorepo, bitd)
3. ✅ Measure prompt length reduction
4. ✅ Track command usage frequency
5. ❓ **Decision point**: Is this sufficient, or is Phase 2 needed?

### Week 2-3: Phase 2 (if needed)

1. ✅ Verify hooks working (test hook, workaround if needed)
2. ✅ Implement 1-2 Skills (not all at once - start small)
3. ✅ Implement PostToolUse Hook (if hooks working)
4. ✅ Test activation with positive/negative cases
5. ✅ Track Skills activation rate daily

### Week 4-5: Phase 2 Iteration

1. ✅ Review activation log (false positives/negatives)
2. ✅ Refine Skill descriptions (add missed trigger keywords)
3. ✅ Add 3rd automation if first 2 working well
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
- 📋 "Ask for a plan first" - agentic best practice

**Ready to start?**
