# Task: Audit Cleanup

**Created:** 2026-01-02
**Status:** Complete

---

## Summary

Address remaining issues from `/audit` run after knip cleanup.

---

## Completed

- [x] Knip auto-fix: Removed 44 unused exports, 7 unused deps, 15 unused types
- [x] Architecture check: No circular dependencies ✓
- [x] Fix poetry test helper (7a16873) - was never working, not a regression
- [x] Add missing devDependencies (1c6c2da) - @vitest/coverage-v8, @types/estree
- [x] Fix depcruise unsafe regex (ebf64ee) - use path array, .cjs extension
- [x] Document optional binaries (shfmt, dot) in README

---

## Remaining Issues

None - all issues resolved.

---

## Informational (No Action Required)

- **11 duplicate exports**: Intentional pattern (named + default export for API flexibility)
- **12 unused template files**: Intentional (templates copied to user projects)

---

## Test Results

**737 passed**, 1 skipped (49 test files) ✅

All tests passing after poetry test fix.

---

## Notes

- Knip cleanup removed significant dead code (44 exports, 7 deps, 15 types)
- Architecture is clean (no circular deps)
- Depcruise ESM/CJS mismatch already fixed (both files are .cjs)
- Test suite 737/737 passing
