---
id: 001
status: in_progress
created: 2025-12-01T17:35:00Z
last_modified: 2025-12-01T17:45:00Z
---

# Declarative Schema Architecture

**Goal:** Refactor CLI to use a single SAFEWORD_SCHEMA as source of truth for all files/dirs/configs.

**Why:** Adding a new file currently requires changes in 4+ places (setup.ts, upgrade.ts, reset.ts, install.ts, check.ts) → drift risk.

## Work Log

- 2025-12-01T19:10:00Z GREEN: check.ts refactored to use reconcile(dryRun), all tests pass ✓
- 2025-12-01T19:05:00Z Created src/utils/context.ts helper
- 2025-12-01T19:00:00Z PLANNING: Command refactoring strategy documented
- 2025-12-01T18:20:00Z VERIFIED: Full test suite passes (187 tests, 2 skipped) ✓
- 2025-12-01T18:10:00Z GREEN: src/reconcile.ts created, 28 tests passing ✓ (refs: src/reconcile.ts)
- 2025-12-01T18:08:00Z FIX: getTemplatesDir() path resolution (src/templates/ vs templates/)
- 2025-12-01T18:00:00Z RED: reconcile.test.ts written, 28 tests failing (refs: tests/reconcile.test.ts)
- 2025-12-01T17:55:00Z GREEN: src/schema.ts created, 18 tests passing ✓ (refs: src/schema.ts)
- 2025-12-01T17:54:00Z FIX: Renamed templates/prompts/review.md → quality-review.md
- 2025-12-01T17:50:00Z RED: schema.test.ts written, 18 tests failing (refs: tests/schema.test.ts)
- 2025-12-01T17:45:00Z Started: TDD RED phase - writing schema.test.ts first

---

## Command Refactoring Plan

### Priority Order (by test stability risk)

1. **check** - Lowest risk, uses dryRun, no mutations
2. **diff** - Low risk, uses dryRun, read-only
3. **upgrade** - Medium risk, existing tests comprehensive
4. **setup** - Medium risk, most complex, existing tests comprehensive
5. **reset** - Medium risk, destructive, needs careful handling
6. **sync** - Low change, only imports schema.packages

### Command Transformation Patterns

**Before (each command):**

```typescript
// ~50-100 lines of file operations
installTemplates(cwd, { isSetup: true / false });
updateSettingsHooks(cwd);
updateMcpConfig(cwd);
ensureAgentsMdLink(cwd);
setupHuskyPreCommit(cwd);
// ... manual package list building
```

**After (thin wrapper):**

```typescript
const packageJson = readJson<PackageJson>(join(cwd, 'package.json'));
const ctx: ProjectContext = {
  cwd,
  projectType: detectProjectType(packageJson),
  devDeps: packageJson?.devDependencies ?? {},
};

const result = await reconcile(SAFEWORD_SCHEMA, mode, ctx, options);

if (result.packagesToInstall.length > 0) {
  await installPackages(result.packagesToInstall);
}

printSummary(result);
```

### Command-Specific Notes

| Command | Mode                     | Special Logic to Preserve                                             |
| ------- | ------------------------ | --------------------------------------------------------------------- |
| setup   | install                  | Check already configured, create package.json if missing, npm install |
| upgrade | upgrade                  | Version check (no downgrade), backup, npm install if needed           |
| reset   | uninstall/uninstall-full | Confirmation prompt, npm uninstall if --full                          |
| check   | upgrade (dryRun)         | Version check, npm update check, show issues                          |
| diff    | upgrade (dryRun)         | Unified diff output, --verbose flag                                   |
| sync    | (no reconcile)           | Import schema.packages, fast exit if nothing missing                  |

### Test Strategy (per command)

1. **Write integration test for refactored command** (RED)
   - Test that reconcile() is called with correct mode
   - Test that packages are installed/removed
   - Test that output matches expected format

2. **Refactor command to use reconcile()** (GREEN)
   - Keep existing tests passing
   - New test passes

3. **Run full test suite** (verify no regression)

### Files to Modify

| File                    | Changes                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| src/commands/setup.ts   | Replace manual operations with reconcile('install')              |
| src/commands/upgrade.ts | Replace with reconcile('upgrade')                                |
| src/commands/reset.ts   | Replace with reconcile('uninstall'/'uninstall-full')             |
| src/commands/check.ts   | Replace checkHealth() with reconcile('upgrade', {dryRun: true})  |
| src/commands/diff.ts    | Replace getFileDiffs() with reconcile('upgrade', {dryRun: true}) |
| src/commands/sync.ts    | Import schema.packages instead of hardcoded list                 |
| src/utils/install.ts    | Remove functions (installTemplates, etc.), keep constants        |

### Shared Helper Function

Create a helper for common patterns:

```typescript
// src/utils/context.ts
export function createProjectContext(cwd: string): ProjectContext {
  const packageJson = readJson<PackageJson>(join(cwd, 'package.json'));
  return {
    cwd,
    projectType: detectProjectType(packageJson ?? {}),
    devDeps: packageJson?.devDependencies ?? {},
  };
}
```

---

## Planning Docs

- ~/.claude/plans/indexed-tinkering-seahorse.md (full plan)

## Scope

**In scope:**

- Create `src/schema.ts` with interfaces + SAFEWORD_SCHEMA
- Create `src/reconcile.ts` with reconciliation engine
- Refactor commands: setup, upgrade, reset, check, diff, sync → thin wrappers
- Simplify `src/utils/install.ts` (constants only)
- Fix: Rename `templates/prompts/review.md` → `quality-review.md`
- Fix: Add `.safeword/planning/{test-definitions,issues}/`
- Fix: SAFEWORD_COMMANDS constant

**Out of scope:**

- New features beyond schema refactor
- Backward compatibility with pre-0.6.3 versions

## Acceptance Criteria

- [ ] All 6 commands use reconcile() with appropriate mode
- [ ] `schema.test.ts`: Every templates/ file has schema entry
- [ ] `reconcile.test.ts`: computePlan modes, dryRun, packagesToInstall
- [ ] Existing tests pass (especially golden-path.test.ts, hooks.test.ts)
- [ ] `safeword check` reports healthy on fresh setup
- [ ] `safeword upgrade` only updates changed files
- [ ] `safeword reset` preserves tickets/completed
- [ ] sync command imports schema.packages (single source of truth)

## Implementation Order

1. `src/schema.ts` - interfaces + SAFEWORD_SCHEMA
2. `src/reconcile.ts` - computePlan, executePlan, helpers
3. Refactor commands: setup → upgrade → reset → check → diff → sync
4. Simplify `src/utils/install.ts` (constants only, remove functions)
5. Run full test suite
6. Update root AGENTS.md + README.md

## Key Design Decisions

| Decision                 | Rationale                                  |
| ------------------------ | ------------------------------------------ |
| Husky always created     | Schema purity, ~50 bytes, future-proof     |
| preservedDirs on reset   | tickets/completed not deleted              |
| No validate.ts           | check uses dryRun - single source of truth |
| Hybrid package handling  | reconcile computes, commands execute       |
| String compare with trim | Simple file change detection               |
| sync imports schema      | Single source of truth for packages        |
