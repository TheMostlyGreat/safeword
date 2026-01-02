# Task: Audit Cleanup

**Created:** 2026-01-02
**Status:** In Progress

---

## Summary

Address remaining issues from `/audit` run after knip cleanup.

---

## Completed

- [x] Knip auto-fix: Removed 44 unused exports, 7 unused deps, 15 unused types
- [x] Architecture check: No circular dependencies ✓
- [x] Fix poetry test helper (7a16873) - was never working, not a regression
- [x] Add missing devDependencies (1c6c2da) - @vitest/coverage-v8, @types/estree

---

## Remaining Issues

### 1. Depcruise Unsafe Regex (Medium Priority)

The `no-dev-deps-in-src` rule has an unsafe regex pattern:

```
ERROR: rule {"name":"no-dev-deps-in-src"...} has an unsafe regular expression
```

**Action:** Fix regex in `packages/cli/src/utils/depcruise-config.ts`

### 2. Optional Binaries (Low Priority - Documentation)

| Binary  | Usage                              | Status                       |
| ------- | ---------------------------------- | ---------------------------- |
| `shfmt` | Shell script formatting            | Optional, document in README |
| `dot`   | Graphviz (depcruise visualization) | Optional, document in README |

---

## Informational (No Action Required)

- **11 duplicate exports**: Intentional pattern (named + default export for API flexibility)
- **12 unused template files**: Intentional (templates copied to user projects)

---

## Test Results

**737 passed**, 1 skipped (49 test files) ✅

All tests passing after poetry test fix.

---

## Execution Order

1. **Fix depcruise unsafe regex**
   - Update `no-dev-deps-in-src` rule regex in depcruise-config.ts
   - Test with: `npx depcruise --config .dependency-cruiser.cjs packages/cli/src`

2. **Document optional binaries** (if time permits)
   - Add note to README about shfmt and dot being optional system tools

---

## Notes

- Knip cleanup removed significant dead code (44 exports, 7 deps, 15 types)
- Architecture is clean (no circular deps)
- Depcruise ESM/CJS mismatch already fixed (both files are .cjs)
- Test suite 737/737 passing
