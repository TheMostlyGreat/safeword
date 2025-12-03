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
3. **PostToolUse hook runs** (`.safeword/hooks/post-tool-lint.sh`)
   - ESLint --fix + Prettier for JS/TS
   - markdownlint --fix + Prettier for MD
   - Prettier only for JSON/CSS/etc
   - **Always exits 0** (never blocks)
   - Outputs errors to stderr if unfixable
4. At commit time, lint-staged runs all linters (backup)
5. If errors at commit, commit blocked

### Current PostToolUse Behavior

```bash
# From .safeword/hooks/post-tool-lint.sh
case "$file" in
  *.ts|*.tsx|...)
    npx eslint --fix "$file"  # Fix what we can
    npx prettier --write "$file"  # Format
    ;;
  *.md)
    npx markdownlint-cli2 --fix "$file"
    npx prettier --write "$file"
    ;;
esac
exit 0  # ALWAYS exits 0 - never blocks Claude
```

### Questions About Current State

1. **Are unfixable errors fed back to Claude?** - Script outputs errors but exits 0
2. **Is latency acceptable?** - ESLint + Prettier on every edit
3. **Should type errors block?** - Currently no TypeScript checking in hook

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

### Q4: Should we change error feedback behavior?

Options:

- **Keep Current:** Always exit 0, errors shown but don't block
- **Add Blocking:** Exit 2 on unfixable ESLint errors (Claude retries)
- **Add Type Checking:** Run `tsc --noEmit`, exit 2 on type errors

---

## Proposed Investigation Steps

### Phase 1: Audit

- [ ] Test exit codes for all formatters with --write
- [ ] Measure latency for each linter on a typical file
- [ ] Document current lint-staged behavior

### Phase 2: Design Decision

Based on audit, choose one:

**Option A: Keep Current (exit 0 always)**

- Pros: No risk of loops, auto-fixes silently
- Cons: Claude doesn't learn from unfixable errors
- Action: Document current behavior and close issue

**Option B: Block on Unfixable ESLint Errors**

- Pros: Claude learns from real code issues
- Cons: May cause retry loops on edge cases
- Action: Change exit code when ESLint has unfixable errors

**Option C: Add TypeScript Checking**

- Pros: Type errors caught immediately
- Cons: Slow (tsc), high loop risk
- Action: Add tsc --noEmit to hook, exit 2 on errors

### Phase 3: Implementation (if B or C)

- [ ] Modify `.safeword/hooks/post-tool-lint.sh`
- [ ] Test with intentional unfixable errors
- [ ] Verify no infinite loops
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
