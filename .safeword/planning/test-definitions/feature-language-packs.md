# Test Definitions: Language Packs

**Guide**: `.safeword/guides/testing-guide.md`
**Template**: `.safeword/templates/test-definitions-feature.md`

**Feature**: Modular language support with bundled language packs
**Spec**: `.safeword/planning/specs/feature-language-packs.md`
**Status**: ❌ Not Implemented
**Test File**: `packages/cli/tests/packs/language-packs.test.ts`

---

## Test Suite 1: Pack Registry

Tests for pack interface and registry helpers.

### Test 1.1: findPackForExtension returns Python pack ❌

**Status**: ❌ Not Implemented
**Description**: Registry maps .py extension to Python pack

**Steps**:

1. Call `findPackForExtension('.py')`

**Expected**:

- Returns pack with `id: 'python'`

---

### Test 1.2: findPackForExtension returns TypeScript pack ❌

**Status**: ❌ Not Implemented
**Description**: Registry maps .ts extension to TypeScript pack

**Steps**:

1. Call `findPackForExtension('.ts')`

**Expected**:

- Returns pack with `id: 'typescript'`

---

### Test 1.3: findPackForExtension returns null for unknown ❌

**Status**: ❌ Not Implemented
**Description**: Unknown extensions return null

**Steps**:

1. Call `findPackForExtension('.xyz')`

**Expected**:

- Returns `null`

---

### Test 1.4: detectLanguages finds Python ❌

**Status**: ❌ Not Implemented
**Description**: Detects Python when pyproject.toml exists

**Steps**:

1. Create temp dir with `pyproject.toml`
2. Call `detectLanguages(cwd)`

**Expected**:

- Returns array containing `'python'`

---

### Test 1.5: detectLanguages finds TypeScript ❌

**Status**: ❌ Not Implemented
**Description**: Detects TypeScript when package.json with TS deps exists

**Steps**:

1. Create temp dir with `package.json` containing `typescript` dep
2. Call `detectLanguages(cwd)`

**Expected**:

- Returns array containing `'typescript'`

---

## Test Suite 2: Pack Refactoring (Regression)

Existing tests verify behavior still works after refactoring.

### Test 2.1: Python pack setup matches existing behavior ✅

**Status**: ✅ Covered by existing tests
**Description**: Python pack produces same output as current implementation

**Reference**: `tests/commands/setup-python-phase2.test.ts` - 18 tests

---

### Test 2.2: TypeScript pack setup matches existing behavior ✅

**Status**: ✅ Covered by existing tests
**Description**: TS pack produces same output as current implementation

**Reference**: `tests/commands/setup.test.ts` - ESLint config tests

---

## Test Suite 3: Installed Packs Tracking

Tests for config.json pack tracking.

### Test 3.1: Setup writes installedPacks to config ❌

**Status**: ❌ Not Implemented
**Description**: After setup, config.json contains installed pack IDs

**Steps**:

1. Create Python project
2. Run `safeword setup`
3. Read `.safeword/config.json`

**Expected**:

- `installedPacks` array contains `'python'`

---

### Test 3.2: isPackInstalled returns true after setup ❌

**Status**: ❌ Not Implemented
**Description**: Helper correctly checks installed status

**Steps**:

1. Run setup in Python project
2. Call `isPackInstalled('python')`

**Expected**:

- Returns `true`

---

### Test 3.3: isPackInstalled returns false when not installed ❌

**Status**: ❌ Not Implemented
**Description**: Helper returns false for uninstalled packs

**Steps**:

1. Create empty config.json
2. Call `isPackInstalled('python')`

**Expected**:

- Returns `false`

---

### Test 3.4: getInstalledPacks returns all installed ❌

**Status**: ❌ Not Implemented
**Description**: Helper returns complete list of installed packs

**Steps**:

1. Create config with `installedPacks: ['python', 'typescript']`
2. Call `getInstalledPacks()`

**Expected**:

- Returns `['python', 'typescript']`

---

## Test Suite 4: Hook Pack Verification

Tests for hook-triggered pack installation.

### Test 4.1: Hook triggers install for missing pack ❌

**Status**: ❌ Not Implemented
**Description**: Editing .py file triggers Python pack install if not installed

**Steps**:

1. Create project with Python file but no pack installed
2. Simulate hook trigger for `.py` file change
3. Check config.json

**Expected**:

- Pack's `setup()` called (blocking)
- `installedPacks` now contains `'python'`

---

### Test 4.2: Hook skips install when pack exists ❌

**Status**: ❌ Not Implemented
**Description**: No redundant install when pack already installed

**Steps**:

1. Create project with Python pack already installed
2. Simulate hook trigger for `.py` file change

**Expected**:

- Pack's `setup()` NOT called
- Linting proceeds immediately

---

### Test 4.3: Hook handles unknown extension gracefully ❌

**Status**: ❌ Not Implemented
**Description**: Unknown file types don't cause errors

**Steps**:

1. Simulate hook trigger for `.xyz` file change

**Expected**:

- No error thrown
- Linting skipped for this file type

---

## Test Suite 5: Check Command Detection

Tests for `safeword check` pack detection.

### Test 5.1: Check warns about missing pack ❌

**Status**: ❌ Not Implemented
**Description**: Check detects Python files without installed pack

**Steps**:

1. Create project with `pyproject.toml` but no pack in config
2. Run `safeword check`

**Expected**:

- Warning: "Detected Python files but Python pack not installed"

---

### Test 5.2: Check suggests upgrade command ❌

**Status**: ❌ Not Implemented
**Description**: Check tells user how to fix missing pack

**Steps**:

1. Create project with missing pack
2. Run `safeword check`

**Expected**:

- Message contains "Run `safeword upgrade`"

---

### Test 5.3: Check passes when all packs installed ❌

**Status**: ❌ Not Implemented
**Description**: No warnings when packs match detected languages

**Steps**:

1. Create Python project with pack installed
2. Run `safeword check`

**Expected**:

- No pack-related warnings

---

## Test Suite 6: Upgrade Command Installation

Tests for `safeword upgrade` pack installation.

### Test 6.1: Upgrade installs missing packs ❌

**Status**: ❌ Not Implemented
**Description**: Upgrade adds packs for detected languages

**Steps**:

1. Create Python project without pack installed
2. Run `safeword upgrade`
3. Read config.json

**Expected**:

- `installedPacks` now contains `'python'`

---

### Test 6.2: Upgrade reports installed packs ❌

**Status**: ❌ Not Implemented
**Description**: User sees what was installed

**Steps**:

1. Create Python project without pack installed
2. Run `safeword upgrade`

**Expected**:

- Output contains "Installed Python pack"

---

### Test 6.3: Upgrade skips already installed packs ❌

**Status**: ❌ Not Implemented
**Description**: No redundant work for existing packs

**Steps**:

1. Create Python project with pack already installed
2. Run `safeword upgrade`

**Expected**:

- Pack setup NOT called again
- No "Installed Python pack" message

---

## Summary

**Total**: 18 tests
**Not Implemented**: 16 tests (89%)
**Covered by Existing**: 2 tests (11%)

| Suite | Tests | Status |
|-------|-------|--------|
| Pack Registry | 5 | ❌ Not Implemented |
| Pack Refactoring | 2 | ✅ Covered |
| Installed Packs Tracking | 4 | ❌ Not Implemented |
| Hook Pack Verification | 3 | ❌ Not Implemented |
| Check Command Detection | 3 | ❌ Not Implemented |
| Upgrade Command Installation | 3 | ❌ Not Implemented |

---

## Test Execution

```bash
# Run all Language Packs tests
bun run test packages/cli/tests/packs/language-packs.test.ts

# Run specific suite
bun run test --grep "Pack Registry"
```

---

**Last Updated**: 2025-12-26
