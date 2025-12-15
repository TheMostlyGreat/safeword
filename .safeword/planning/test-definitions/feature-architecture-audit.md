# Test Definitions: Architecture Audit System

**Guide**: `.safeword/guides/testing-guide.md`
**Template**: `.safeword/templates/test-definitions-feature.md`

**Feature**: Architecture purity enforcement via dependency-cruiser and knip
**Feature Spec**: `.safeword/planning/specs/feature-architecture-audit.md`
**Design Doc**: `.safeword/planning/design/architecture-audit.md`

**Test File**: `packages/cli/src/utils/__tests__/depcruise-config.test.ts`
**Total Tests**: 10 (9 passing, 0 skipped, 1 not implemented)

---

## Test Suite 1: Config Generator

Tests for `generateDepCruiseConfigFile()` and `generateDepCruiseMainConfig()`.

### Test 1.1: Generates circular dependency rule ✅

**Status**: ✅ Passing
**Description**: Config always includes no-circular rule regardless of architecture

**Steps**:

1. Call `generateDepCruiseConfigFile()` with empty architecture
2. Parse the generated JS string
3. Check forbidden array

**Expected**:

- Contains rule with `name: 'no-circular'`
- Rule has `severity: 'error'`
- Rule has `to: { circular: true }`

---

### Test 1.2: Generates monorepo layer rules from workspaces ✅

**Status**: ✅ Passing
**Description**: Detects workspaces field and generates hierarchy rules

**Steps**:

1. Call with architecture: `{ workspaces: ['packages/*', 'apps/*', 'libs/*'] }`
2. Parse generated config

**Expected**:

- Rule: packages cannot import apps
- Rule: libs cannot import packages or apps
- Rules have `severity: 'error'`

---

### Test 1.3: Generates orphan detection rule ❌

**Status**: ❌ Not Implemented
**Description**: Config includes info-level orphan detection

**Steps**:

1. Call `generateDepCruiseConfigFile()`
2. Parse generated config

**Expected**:

- Contains rule with `name: 'no-orphans'`
- Rule has `severity: 'info'` (not error)
- Excludes test files and index files from orphan check

---

### Test 1.4: Generates main config that imports generated ❌

**Status**: ❌ Not Implemented
**Description**: Main config imports and spreads generated rules

**Steps**:

1. Call `generateDepCruiseMainConfig()`
2. Check output string

**Expected**:

- Imports from `./.safeword/depcruise-config.js`
- Spreads `generated.forbidden`
- Spreads `generated.options`
- Contains comment for user customization

---

### Test 1.5: Options include doNotFollow for node_modules and .safeword ❌

**Status**: ❌ Not Implemented
**Description**: Generated options exclude irrelevant directories

**Steps**:

1. Call `generateDepCruiseConfigFile()`
2. Parse options section

**Expected**:

- `doNotFollow.path` includes `'node_modules'`
- `doNotFollow.path` includes `'.safeword'`

---

## Test Suite 2: Sync Config Command

Tests for `safeword sync-config` CLI command.

### Test 2.1: Fails if .safeword directory missing ❌

**Status**: ❌ Not Implemented
**Description**: Command requires safeword to be set up first

**Steps**:

1. Run `sync-config` in directory without `.safeword/`
2. Check exit code and output

**Expected**:

- Exit code non-zero
- Error message includes "Run `safeword setup` first"

---

### Test 2.2: Writes generated config to .safeword/depcruise-config.js ❌

**Status**: ❌ Not Implemented
**Description**: Command writes generated rules file

**Steps**:

1. Create `.safeword/` directory
2. Run `sync-config`
3. Check file exists

**Expected**:

- File `.safeword/depcruise-config.js` exists
- File contains `module.exports`
- File contains `forbidden` array

---

### Test 2.3: Creates main config if not exists ❌

**Status**: ❌ Not Implemented
**Description**: Self-healing: creates `.dependency-cruiser.js` if missing

**Steps**:

1. Create `.safeword/` directory (no `.dependency-cruiser.js`)
2. Run `sync-config`
3. Check both files

**Expected**:

- `.dependency-cruiser.js` created at project root
- File imports from `.safeword/depcruise-config.js`

---

### Test 2.4: Does not overwrite existing main config ❌

**Status**: ❌ Not Implemented
**Description**: User customizations preserved

**Steps**:

1. Create `.safeword/` directory
2. Create `.dependency-cruiser.js` with custom content
3. Run `sync-config`
4. Check main config content

**Expected**:

- `.dependency-cruiser.js` unchanged
- `.safeword/depcruise-config.js` regenerated

---

### Test 2.5: Uses detectArchitecture from boundaries.ts ❌

**Status**: ❌ Not Implemented
**Description**: Reuses existing architecture detection logic

**Steps**:

1. Create project with `src/utils/`, `src/components/`
2. Run `sync-config`
3. Check generated rules reflect detected structure

**Expected**:

- Rules generated based on detected architecture
- Same detection logic as boundaries.ts

---

## Summary

**Total**: 10 tests
**Passing**: 9 tests (90%)
**Skipped**: 0 tests (0%)
**Not Implemented**: 1 test (10%)
**Failing**: 0 tests (0%)

### Coverage by Feature

| Feature          | Tests | Status  |
| ---------------- | ----- | ------- |
| Config Generator | 5/5   | ✅ 100% |
| Sync Command     | 4/5   | ✅ 80%  |

---

## Test Execution

```bash
# Run all tests for this feature
npm test -- --grep "depcruise"

# Run specific test
npm test -- --grep "Generates circular dependency rule"
```

---

**Last Updated**: 2025-12-15
