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

## Test Suite 2: Installed Packs Tracking

Tests for config.json pack tracking.

### Test 2.1: Setup writes installedPacks to config ❌

**Status**: ❌ Not Implemented
**Description**: After setup, config.json contains installed pack IDs

**Steps**:

1. Create Python project
2. Run `safeword setup`
3. Read `.safeword/config.json`

**Expected**:

- `installedPacks` array contains `'python'`

---

### Test 2.2: isPackInstalled returns correct status ❌

**Status**: ❌ Not Implemented
**Description**: Helper correctly checks installed status

**Steps**:

1. Create config with `installedPacks: ['python']`
2. Call `isPackInstalled('python')` and `isPackInstalled('go')`

**Expected**:

- Returns `true` for installed pack
- Returns `false` for uninstalled pack

---

### Test 2.3: getInstalledPacks returns all installed ❌

**Status**: ❌ Not Implemented
**Description**: Helper returns complete list of installed packs

**Steps**:

1. Create config with `installedPacks: ['python', 'typescript']`
2. Call `getInstalledPacks()`

**Expected**:

- Returns `['python', 'typescript']`

---

## Test Suite 3: Pack Installation Logic

Tests for `ensurePackInstalled(extension, cwd)` - the internal function hooks call.

### Test 3.1: ensurePackInstalled installs missing pack ❌

**Status**: ❌ Not Implemented
**Description**: Installs pack when not already installed

**Steps**:

1. Create project with no pack installed
2. Call `ensurePackInstalled('.py', cwd)`
3. Check config.json

**Expected**:

- Pack's `setup()` called
- `installedPacks` now contains `'python'`

---

### Test 3.2: ensurePackInstalled skips when already installed ❌

**Status**: ❌ Not Implemented
**Description**: No redundant install when pack already installed

**Steps**:

1. Create project with Python pack already installed
2. Call `ensurePackInstalled('.py', cwd)`

**Expected**:

- Pack's `setup()` NOT called
- Returns without error

---

### Test 3.3: ensurePackInstalled ignores unknown extensions ❌

**Status**: ❌ Not Implemented
**Description**: Unknown file types don't cause errors

**Steps**:

1. Call `ensurePackInstalled('.xyz', cwd)`

**Expected**:

- No error thrown
- Returns without action

---

## Test Suite 4: Check Command Detection

Tests for `safeword check` pack detection.

### Test 4.1: Check warns about missing pack with upgrade suggestion ❌

**Status**: ❌ Not Implemented
**Description**: Check detects missing pack and tells user how to fix

**Steps**:

1. Create project with `pyproject.toml` but no pack in config
2. Run `safeword check`

**Expected**:

- Warning about missing Python pack
- Message suggests "Run `safeword upgrade`"

---

### Test 4.2: Check passes when all packs installed ❌

**Status**: ❌ Not Implemented
**Description**: No warnings when packs match detected languages

**Steps**:

1. Create Python project with pack installed
2. Run `safeword check`

**Expected**:

- No pack-related warnings

---

## Test Suite 5: Upgrade Command Installation

Tests for `safeword upgrade` pack installation.

### Test 5.1: Upgrade installs missing packs and reports ❌

**Status**: ❌ Not Implemented
**Description**: Upgrade adds packs for detected languages and tells user

**Steps**:

1. Create Python project without pack installed
2. Run `safeword upgrade`
3. Read config.json

**Expected**:

- `installedPacks` now contains `'python'`
- Output contains "Installed Python pack"

---

### Test 5.2: Upgrade skips already installed packs ❌

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

**Total**: 13 tests
**Not Implemented**: 13 tests (100%)

| Suite | Tests | Focus |
|-------|-------|-------|
| Pack Registry | 5 | `findPackForExtension`, `detectLanguages` |
| Installed Packs Tracking | 3 | config.json, `isPackInstalled`, `getInstalledPacks` |
| Pack Installation Logic | 3 | `ensurePackInstalled` (hook internals) |
| Check Command Detection | 2 | Missing pack warnings |
| Upgrade Command Installation | 2 | Auto-install missing packs |

**Note**: Stories 2 & 3 (refactoring Python/TS to packs) are covered by existing tests in `setup-python-phase2.test.ts` and `setup.test.ts`. No new tests needed - if existing tests pass after refactor, behavior is preserved.

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
