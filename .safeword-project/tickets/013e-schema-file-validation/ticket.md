---
id: 013e
type: task
phase: implement
status: pending
created: 2025-01-09T11:45:00Z
last_modified: 2025-01-09T11:45:00Z
---

# Schema File Validation Command

**Goal:** Add a CLI command that verifies all template files are registered in the schema.

**Why:** Prevents orphaned files that exist in templates but never get installed, caught manually today during cleanup review.

## Requirements

1. **Internal dev tooling** (not customer-facing): Test or script that runs in CI for safeword repo only
2. **Validates**:
   - Every file in `packages/cli/templates/` has a corresponding entry in `schema.ts` (ownedFiles, managedFiles, or as a template reference)
   - Reports untracked files as errors
3. **CI integration**: Should be runnable in CI to catch missing registrations before merge

## Implementation Notes

- Scan `packages/cli/templates/` recursively
- Compare against `SAFEWORD_SCHEMA.ownedFiles` template references
- Exclude directories (only validate files)
- Exit code 1 if untracked files found

## Work Log

---

{Keep work log in reverse-chronological order. Newest entries at top.}

---
