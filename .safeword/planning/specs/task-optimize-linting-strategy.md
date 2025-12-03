# Task: Optimize Linting Strategy for AI Coding Assistants

**Type:** Improvement

**Issue:** [#25](https://github.com/TheMostlyGreat/safeword/issues/25)

**Learning:** `.safeword/learnings/post-tool-linting-strategies.md`

---

## Scope

Optimize the linting configuration in safeword to work well with AI coding assistants (Claude Code, Cursor), avoiding infinite retry loops while maximizing code quality feedback.

## Out of Scope

- Adding new linting rules
- Changing the rules themselves (only how they're invoked)
- E2E test linting (separate concern)

---

## Current State Audit

### What We Have

| Component    | Location                   | Behavior       |
| ------------ | -------------------------- | -------------- |
| lint-staged  | `.lintstagedrc.json`       | Runs on commit |
| ESLint       | `eslint.config.mjs`        | Code quality   |
| Prettier     | `package.json`             | Formatting     |
| markdownlint | `.markdownlint-cli2.jsonc` | MD quality     |
| TypeScript   | `tsconfig.json`            | Type checking  |
| Shellcheck   | lint-staged                | Shell scripts  |

### What Happens Today

1. Developer edits file
2. Claude Code makes changes
3. **No immediate linting feedback**
4. At commit time, lint-staged runs all linters
5. If errors, commit blocked

### Problems with Current State

1. **No feedback during editing** - Claude doesn't learn from lint errors until commit
2. **All-or-nothing at commit** - Either everything passes or commit fails
3. **Unknown exit code behavior** - Do our formatters return 0 after auto-fix?

---

## Questions to Answer

### Q1: Do our formatters return 0 after auto-fixing?

```bash
# Test: Does prettier return 0 after fixing?
echo "const x=1" > /tmp/test.js
prettier --write /tmp/test.js
echo "Exit code: $?"
```

**If non-zero:** This would cause loops if we add PostToolUse hooks.

### Q2: What's the latency of each linter?

| Linter       | Latency | Acceptable for PostToolUse? |
| ------------ | ------- | --------------------------- |
| Prettier     | ? ms    | Probably yes                |
| ESLint       | ? ms    | Maybe                       |
| TypeScript   | ? ms    | Maybe not                   |
| markdownlint | ? ms    | Probably yes                |

**Threshold:** >500ms adds noticeable lag to editing.

### Q3: What errors actually help Claude learn?

| Error Type    | Example           | AI Should See?  |
| ------------- | ----------------- | --------------- |
| Formatting    | Wrong indentation | No (auto-fix)   |
| Style         | Prefer const      | No (auto-fix)   |
| Type error    | Missing property  | **Yes**         |
| Security      | Hardcoded secret  | **Yes (block)** |
| Unused import | Dead code         | Maybe           |

### Q4: What's our risk tolerance for loops?

Options:

- **Conservative:** No PostToolUse hooks, keep commit-time only
- **Moderate:** Add hooks for formatters only (always exit 0)
- **Aggressive:** Add hooks for type checking too (may cause loops)

---

## Proposed Investigation Steps

### Phase 1: Audit

- [ ] Test exit codes for all formatters with --write
- [ ] Measure latency for each linter on a typical file
- [ ] Document current lint-staged behavior

### Phase 2: Design Decision

Based on audit, choose one:

**Option A: Keep Current (Conservative)**

- Pros: No risk of loops, already works
- Cons: No feedback during editing
- Action: Document why and close issue

**Option B: Add Format-Only Hooks (Moderate)**

- Pros: Clean formatting without asking, no loop risk
- Cons: Still no type feedback during editing
- Action: Add PostToolUse hook for Prettier only

**Option C: Add Type Feedback Hooks (Aggressive)**

- Pros: Claude learns from type errors immediately
- Cons: Risk of loops, added latency
- Action: Add hooks with retry cap, monitor for loops

### Phase 3: Implementation (if B or C)

- [ ] Create `.claude/settings.json` with PostToolUse hooks
- [ ] Ensure formatters exit 0
- [ ] Add retry cap mechanism if needed
- [ ] Test with intentional errors
- [ ] Document in SAFEWORD.md

---

## Done When

- [ ] Exit codes documented for all linters
- [ ] Latency measured and documented
- [ ] Decision made and documented (A, B, or C)
- [ ] If B or C: Hooks implemented and tested
- [ ] SAFEWORD.md updated with linting strategy
- [ ] Issue #25 closed

---

## Tests

### If Option B or C chosen:

- [ ] Prettier auto-fixes and exits 0
- [ ] ESLint auto-fixes and exits 0
- [ ] Type errors return exit 2 with stderr feedback
- [ ] No infinite loops on intentional errors (cap at 3)
- [ ] Commit-time linting still works as fallback
