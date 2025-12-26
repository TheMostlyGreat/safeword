# Test Definitions: Language Packs

**Guide**: `.safeword/guides/testing-guide.md`
**Spec**: `.safeword/planning/specs/feature-language-packs.md`
**Status**: ❌ Not Implemented

---

## Unit Tests

**File**: `packages/cli/tests/packs/packs.test.ts`

### Test 1.1: Maps file extensions to language packs ❌

**Description**: Registry correctly maps extensions to packs, returns null for unknown

**Steps**:

1. Call `findPackForExtension()` with `.py`, `.ts`, `.tsx`, `.js`, `.xyz`

**Expected**:

- `.py` → pack with `id: 'python'`
- `.ts`, `.tsx`, `.js` → pack with `id: 'typescript'`
- `.xyz` → `null`

---

### Test 1.2: Detects languages from project markers ❌

**Description**: Scans project for language markers and returns detected pack IDs

**Steps**:

1. Create temp dir with `pyproject.toml` and `package.json` (with `typescript` dep)
2. Call `detectLanguages(cwd)`

**Expected**:

- Returns `['python', 'typescript']` (order doesn't matter)

---

### Test 1.3: Reads installed packs from config ❌

**Description**: Config helpers correctly read installedPacks array

**Steps**:

1. Call `getInstalledPacks()` on empty config → `[]`
2. Call `isPackInstalled('python')` → `false`
3. Write config with `installedPacks: ['python']`
4. Call `getInstalledPacks()` → `['python']`
5. Call `isPackInstalled('python')` → `true`
6. Call `isPackInstalled('go')` → `false`

**Expected**:

- All assertions pass

---

### Test 1.4: Installs pack and updates config ❌

**Description**: `installPack()` runs pack setup and records in config

**Steps**:

1. Create project with no packs installed
2. Call `installPack('python', cwd)`
3. Read config

**Expected**:

- Python pack's `setup()` was called
- Config contains `installedPacks: ['python']`

---

### Test 1.5: Skips already-installed packs ❌

**Description**: `installPack()` is idempotent - no duplicate work

**Steps**:

1. Create project with `installedPacks: ['python']`
2. Call `installPack('python', cwd)`

**Expected**:

- Pack's `setup()` NOT called
- Config unchanged (no duplicate entries)

---

## Integration Tests

**File**: `packages/cli/tests/commands/setup-core.test.ts` (extend existing)

### Test 2.1: Setup tracks installed packs in config ❌

**Description**: After setup, config.json records which packs were installed

**Steps**:

1. Create Python project with `pyproject.toml`
2. Run `safeword setup --yes`
3. Read `.safeword/config.json`

**Expected**:

- `installedPacks` contains `'python'`

---

**File**: `packages/cli/tests/commands/check.test.ts` (extend existing)

### Test 3.1: Warns when detected language has no installed pack ❌

**Description**: Check command detects language/pack mismatch

**Steps**:

1. Create project with `pyproject.toml`
2. Write config with `installedPacks: []`
3. Run `safeword check`

**Expected**:

- Exit code: non-zero (warning)
- Output contains: `Python files detected but pack not installed`
- Output contains: `safeword upgrade`

---

### Test 3.2: Passes when all detected languages have packs ❌

**Description**: No warnings when everything is in sync

**Steps**:

1. Create Python project
2. Write config with `installedPacks: ['python']`
3. Run `safeword check`

**Expected**:

- Exit code: 0
- No pack-related warnings in output

---

**File**: `packages/cli/tests/commands/upgrade.test.ts` (extend existing)

### Test 4.1: Installs packs for newly detected languages ❌

**Description**: Upgrade command auto-installs missing packs

**Steps**:

1. Create Python project with `pyproject.toml`
2. Write config with `installedPacks: []`
3. Run `safeword upgrade`
4. Read config

**Expected**:

- Output contains: `Installed Python pack`
- Config now has `installedPacks: ['python']`

---

### Test 4.2: Skips already-installed packs silently ❌

**Description**: No redundant work or noise for existing packs

**Steps**:

1. Create Python project
2. Write config with `installedPacks: ['python']`
3. Run `safeword upgrade`

**Expected**:

- Output does NOT contain: `Installed Python pack`
- Config unchanged

---

## Summary

**Total**: 9 tests (5 unit, 4 integration)

| File | Tests | Focus |
|------|-------|-------|
| `packs/packs.test.ts` | 5 | `findPackForExtension`, `detectLanguages`, config helpers, `installPack` |
| `commands/setup-core.test.ts` | 1 | Config tracking after setup |
| `commands/check.test.ts` | 2 | Missing pack detection |
| `commands/upgrade.test.ts` | 2 | Auto-install missing packs |

*All paths relative to `packages/cli/tests/`*

**Note**: Stories 2 & 3 (refactoring Python/TS to packs) covered by existing tests. If they pass after refactor, behavior is preserved.

---

## Test Execution

```bash
# Unit tests
bun run test packages/cli/tests/packs/packs.test.ts

# Integration tests (run with existing command tests)
bun run test packages/cli/tests/commands/setup-core.test.ts
bun run test packages/cli/tests/commands/check.test.ts
bun run test packages/cli/tests/commands/upgrade.test.ts
```

---

**Last Updated**: 2025-12-26
